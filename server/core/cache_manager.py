from typing import Any, Optional, Dict, List, Union, Callable
from datetime import datetime, timedelta
import asyncio
import json
import logging
import hashlib
import pickle
import time
from enum import Enum
from cachetools import TTLCache

# Optional Redis support
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Configure logging
logger = logging.getLogger("cache_manager")

class CacheLevel(str, Enum):
    """Cache storage levels"""
    MEMORY = "memory"  # In-memory cache (fastest, but limited size)
    REDIS = "redis"    # Redis cache (distributed, larger capacity)
    DISK = "disk"      # Disk-based cache (largest capacity, slowest)

class CacheStrategy(str, Enum):
    """Cache invalidation strategies"""
    TTL = "ttl"              # Time-based expiration
    LRU = "lru"              # Least Recently Used
    EVENT = "event"          # Event-based invalidation
    WRITE_THROUGH = "write"  # Write-through (immediate updates)

class CacheConfig:
    """Configuration for cache manager"""
    def __init__(
        self,
        default_ttl: int = 3600,
        memory_max_size: int = 10000,
        redis_url: Optional[str] = None,
        redis_prefix: str = "cache:",
        disk_path: Optional[str] = None,
        strategy: CacheStrategy = CacheStrategy.TTL,
        default_level: CacheLevel = CacheLevel.MEMORY,
        compression: bool = False,
        serializer: Optional[Callable] = None,
        deserializer: Optional[Callable] = None,
    ):
        self.default_ttl = default_ttl
        self.memory_max_size = memory_max_size
        self.redis_url = redis_url
        self.redis_prefix = redis_prefix
        self.disk_path = disk_path
        self.strategy = strategy
        self.default_level = default_level
        self.compression = compression
        self.serializer = serializer or pickle.dumps
        self.deserializer = deserializer or pickle.loads

class CacheManager:
    """Enhanced cache manager with multi-level caching support"""
    def __init__(self, ttl: int = 3600, max_size: int = 1000, config: Optional[CacheConfig] = None):
        self.config = config or CacheConfig(default_ttl=ttl, memory_max_size=max_size)

        # Initialize memory cache
        self.memory_cache = TTLCache(maxsize=self.config.memory_max_size, ttl=self.config.default_ttl)
        self.memory_lock = asyncio.Lock()

        # Initialize Redis cache if available
        self.redis_client = None
        if REDIS_AVAILABLE and self.config.redis_url:
            try:
                self.redis_client = redis.from_url(self.config.redis_url)
                logger.info(f"Redis cache initialized at {self.config.redis_url}")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis cache: {e}")

        # Cache statistics
        self.stats = {
            "hits": 0,
            "misses": 0,
            "memory_hits": 0,
            "redis_hits": 0,
            "disk_hits": 0,
            "sets": 0,
            "invalidations": 0
        }

        # Event listeners for event-based invalidation
        self.event_listeners: Dict[str, List[Callable]] = {}

        # Cache groups for bulk operations
        self.cache_groups: Dict[str, List[str]] = {}

    async def get(self, key: str, default: Any = None, level: Optional[CacheLevel] = None) -> Optional[Any]:
        """Get a value from cache with multi-level fallback"""
        # Normalize key
        normalized_key = self._normalize_key(key)

        # Determine cache levels to check
        levels = self._get_levels_to_check(level)

        # Try to get from each cache level
        for cache_level in levels:
            value = await self._get_from_level(normalized_key, cache_level)
            if value is not None:
                # Update stats
                self.stats["hits"] += 1
                self.stats[f"{cache_level}_hits"] += 1

                # If found in a slower cache, store in faster caches
                if cache_level != CacheLevel.MEMORY and CacheLevel.MEMORY in levels:
                    await self._set_in_level(normalized_key, value, CacheLevel.MEMORY)

                return value

        # Update miss stats
        self.stats["misses"] += 1
        return default

    async def set(self, key: str, value: Any, ttl: Optional[int] = None,
                  level: Optional[CacheLevel] = None, group: Optional[str] = None) -> None:
        """Set a value in cache at specified level(s)"""
        # Normalize key
        normalized_key = self._normalize_key(key)

        # Determine cache levels to set
        levels = self._get_levels_to_set(level)

        # Set TTL
        effective_ttl = ttl or self.config.default_ttl

        # Set in each cache level
        for cache_level in levels:
            await self._set_in_level(normalized_key, value, cache_level, effective_ttl)

        # Add to group if specified
        if group:
            if group not in self.cache_groups:
                self.cache_groups[group] = []
            if normalized_key not in self.cache_groups[group]:
                self.cache_groups[group].append(normalized_key)

        # Update stats
        self.stats["sets"] += 1

        # Trigger events if using event-based strategy
        if self.config.strategy == CacheStrategy.EVENT:
            await self._trigger_event("set", normalized_key, value)

    async def invalidate(self, key: str, level: Optional[CacheLevel] = None) -> None:
        """Invalidate a cache entry at specified level(s)"""
        # Normalize key
        normalized_key = self._normalize_key(key)

        # Determine cache levels to invalidate
        levels = self._get_levels_to_set(level)

        # Invalidate in each cache level
        for cache_level in levels:
            await self._invalidate_in_level(normalized_key, cache_level)

        # Update stats
        self.stats["invalidations"] += 1

        # Trigger events if using event-based strategy
        if self.config.strategy == CacheStrategy.EVENT:
            await self._trigger_event("invalidate", normalized_key)

    async def invalidate_group(self, group: str, level: Optional[CacheLevel] = None) -> None:
        """Invalidate all cache entries in a group"""
        if group not in self.cache_groups:
            return

        for key in self.cache_groups[group]:
            await self.invalidate(key, level)

        # Clear group
        self.cache_groups[group] = []

    async def invalidate_pattern(self, pattern: str, level: Optional[CacheLevel] = None) -> None:
        """Invalidate all cache entries matching a pattern"""
        # This is most efficient with Redis
        if self.redis_client and (level is None or level == CacheLevel.REDIS):
            redis_pattern = f"{self.config.redis_prefix}{pattern}*"
            keys = await self.redis_client.keys(redis_pattern)
            if keys:
                await self.redis_client.delete(*keys)

        # For memory cache, we need to check each key
        if level is None or level == CacheLevel.MEMORY:
            async with self.memory_lock:
                keys_to_remove = []
                for k in self.memory_cache:
                    if k.startswith(pattern):
                        keys_to_remove.append(k)

                for k in keys_to_remove:
                    self.memory_cache.pop(k, None)

    async def cleanup(self) -> None:
        """Remove expired entries from all cache levels"""
        # Memory cache auto-expires with TTLCache
        async with self.memory_lock:
            self.memory_cache.expire()

        # Redis handles expiration automatically

        # Trigger events
        if self.config.strategy == CacheStrategy.EVENT:
            await self._trigger_event("cleanup")

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = self.stats.copy()

        # Add hit ratio
        total_requests = stats["hits"] + stats["misses"]
        stats["hit_ratio"] = stats["hits"] / total_requests if total_requests > 0 else 0

        # Add memory cache size
        stats["memory_size"] = len(self.memory_cache)
        stats["memory_max_size"] = self.config.memory_max_size

        # Add Redis info if available
        if self.redis_client:
            try:
                redis_info = await self.redis_client.info()
                stats["redis_used_memory"] = redis_info.get("used_memory_human")
                stats["redis_keys"] = redis_info.get("db0", {}).get("keys", 0)
            except Exception:
                pass

        return stats

    async def clear_all(self, level: Optional[CacheLevel] = None) -> None:
        """Clear all cache entries at specified level(s)"""
        levels = self._get_levels_to_set(level)

        for cache_level in levels:
            if cache_level == CacheLevel.MEMORY:
                async with self.memory_lock:
                    self.memory_cache.clear()
            elif cache_level == CacheLevel.REDIS and self.redis_client:
                await self.redis_client.flushdb()

        # Clear cache groups
        self.cache_groups = {}

        # Reset stats
        for key in self.stats:
            self.stats[key] = 0

    async def on_event(self, event: str, callback: Callable) -> None:
        """Register an event listener"""
        if event not in self.event_listeners:
            self.event_listeners[event] = []
        self.event_listeners[event].append(callback)

    async def _get_from_level(self, key: str, level: CacheLevel) -> Optional[Any]:
        """Get a value from a specific cache level"""
        if level == CacheLevel.MEMORY:
            async with self.memory_lock:
                return self.memory_cache.get(key)
        elif level == CacheLevel.REDIS and self.redis_client:
            redis_key = f"{self.config.redis_prefix}{key}"
            value = await self.redis_client.get(redis_key)
            if value:
                return self.config.deserializer(value)
        return None

    async def _set_in_level(self, key: str, value: Any, level: CacheLevel, ttl: Optional[int] = None) -> None:
        """Set a value in a specific cache level"""
        effective_ttl = ttl or self.config.default_ttl

        if level == CacheLevel.MEMORY:
            async with self.memory_lock:
                if ttl:
                    # Custom TTL requires a timer adjustment
                    self.memory_cache.timer = lambda: time.time() + effective_ttl
                self.memory_cache[key] = value
        elif level == CacheLevel.REDIS and self.redis_client:
            redis_key = f"{self.config.redis_prefix}{key}"
            serialized_value = self.config.serializer(value)
            await self.redis_client.set(redis_key, serialized_value, ex=effective_ttl)

    async def _invalidate_in_level(self, key: str, level: CacheLevel) -> None:
        """Invalidate a value in a specific cache level"""
        if level == CacheLevel.MEMORY:
            async with self.memory_lock:
                self.memory_cache.pop(key, None)
        elif level == CacheLevel.REDIS and self.redis_client:
            redis_key = f"{self.config.redis_prefix}{key}"
            await self.redis_client.delete(redis_key)

    async def _trigger_event(self, event: str, key: str = None, value: Any = None) -> None:
        """Trigger event listeners"""
        if event not in self.event_listeners:
            return

        for callback in self.event_listeners[event]:
            try:
                if key is not None and value is not None:
                    await callback(key, value)
                elif key is not None:
                    await callback(key)
                else:
                    await callback()
            except Exception as e:
                logger.error(f"Error in cache event listener: {e}")

    def _normalize_key(self, key: str) -> str:
        """Normalize cache key"""
        return key.replace(" ", "_").lower()

    def _get_levels_to_check(self, level: Optional[CacheLevel]) -> List[CacheLevel]:
        """Determine which cache levels to check based on specified level"""
        if level:
            return [level]

        # Default check order: Memory -> Redis -> Disk
        levels = [CacheLevel.MEMORY]

        if self.redis_client:
            levels.append(CacheLevel.REDIS)

        return levels

    def _get_levels_to_set(self, level: Optional[CacheLevel]) -> List[CacheLevel]:
        """Determine which cache levels to set based on specified level"""
        if level:
            return [level]

        # Default is to set in all available levels
        levels = [CacheLevel.MEMORY]

        if self.redis_client:
            levels.append(CacheLevel.REDIS)

        return levels