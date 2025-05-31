from typing import Dict, List, Optional, Any, Tuple, Union
import asyncio
import logging
import random
import uuid
import time
from datetime import datetime, timedelta
import json
from pathlib import Path
from enum import Enum
import heapq
import math
from pydantic import BaseModel, Field

# Import profile manager
from core.profile_manager import profile_manager, ProfileData
from core.proxy_manager import proxy_manager
from core.storage import STORAGE_DIR

# Configure logger
logger = logging.getLogger("camoufox.campaigns")

class VisitFrequency(str, Enum):
    """Visit frequency enum for campaigns"""
    LOW = "low"           # 1-2 times per day
    MEDIUM = "medium"     # 3-5 times per day
    HIGH = "high"         # 6-10 times per day
    CUSTOM = "custom"     # Custom frequency

class EngagementLevel(str, Enum):
    """Engagement level enum for campaigns"""
    MINIMAL = "minimal"   # Just page views
    BASIC = "basic"       # Page views with some scrolling
    MODERATE = "moderate" # Scrolling, some clicks, short duration
    DEEP = "deep"         # Deep scrolling, multiple clicks, longer duration
    CUSTOM = "custom"     # Custom engagement level

class AdInteraction(str, Enum):
    """Ad interaction enum for campaigns"""
    NONE = "none"         # No ad interaction
    VIEW_ONLY = "view_only" # Only view ads (impressions)
    OCCASIONAL = "occasional" # Occasional ad clicks (1-5%)
    MODERATE = "moderate" # Moderate ad clicks (5-10%)
    HIGH = "high"         # High ad clicks (10-15%)
    CUSTOM = "custom"     # Custom ad interaction rate

class CampaignStatus(str, Enum):
    """Campaign status enum"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class BehavioralPattern(str, Enum):
    """Behavioral pattern enum for profile behavior"""
    CASUAL = "casual"     # Casual browsing, less focused
    FOCUSED = "focused"   # Focused browsing, more direct
    EXPLORER = "explorer" # Explores many links and pages
    SCANNER = "scanner"   # Quickly scans content
    THOROUGH = "thorough" # Thoroughly reads content
    RANDOM = "random"     # Random behavior

class TimeOfDay(str, Enum):
    """Time of day enum for visit scheduling"""
    EARLY_MORNING = "early_morning"  # 5-8 AM
    MORNING = "morning"              # 8-11 AM
    MIDDAY = "midday"                # 11 AM-2 PM
    AFTERNOON = "afternoon"          # 2-5 PM
    EVENING = "evening"              # 5-8 PM
    NIGHT = "night"                  # 8-11 PM
    LATE_NIGHT = "late_night"        # 11 PM-5 AM

class Campaign(BaseModel):
    """Campaign model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    status: CampaignStatus = CampaignStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Target URLs
    urls: List[str]

    # Profile configuration
    profile_ids: List[str]

    # Visit configuration
    visit_frequency: VisitFrequency = VisitFrequency.MEDIUM
    custom_frequency: Optional[Dict[str, Any]] = None

    # Engagement configuration
    engagement_level: EngagementLevel = EngagementLevel.MODERATE
    custom_engagement: Optional[Dict[str, Any]] = None

    # Ad interaction configuration
    ad_interaction: AdInteraction = AdInteraction.OCCASIONAL
    custom_interaction: Optional[Dict[str, Any]] = None

    # Schedule configuration
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    active_hours: Optional[Dict[str, List[Tuple[int, int]]]] = None  # Day of week -> list of (start_hour, end_hour) tuples

    # Advanced configuration
    behavioral_evolution: bool = True
    device_rotation: bool = False
    geo_distribution: bool = True

    # Results tracking
    total_visits: int = 0
    total_impressions: int = 0
    total_clicks: int = 0
    estimated_revenue: float = 0.0

    # Internal tracking
    scheduled_visits: Dict[str, List[datetime]] = Field(default_factory=dict)  # profile_id -> list of scheduled visit times
    profile_history: Dict[str, Dict[str, Any]] = Field(default_factory=dict)  # profile_id -> history data

class CampaignsManager:
    """
    Manager for campaigns using sophisticated browser automation

    This class handles the creation, scheduling, and execution of campaigns
    that generate ad revenue through realistic browsing patterns and engagement.
    """
    def __init__(self):
        """Initialize the campaigns manager"""
        self.campaigns: Dict[str, Campaign] = {}
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.scheduled_visits: List[Tuple[datetime, str, str]] = []  # (visit_time, campaign_id, profile_id)
        self.visit_locks: Dict[str, asyncio.Lock] = {}  # profile_id -> lock
        self.scheduler_running = False
        self.scheduler_task = None

        # Create storage directory
        self.storage_dir = STORAGE_DIR / "campaigns"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Profile behavior patterns
        self.profile_behaviors: Dict[str, Dict[str, Any]] = {}

        # Load existing campaigns
        self._load_campaigns()

        logger.info("CampaignsManager initialized")

    def _load_campaigns(self):
        """Load existing campaigns from storage"""
        try:
            campaigns_file = self.storage_dir / "campaigns.json"
            if campaigns_file.exists():
                with open(campaigns_file, "r") as f:
                    campaigns_data = json.load(f)

                for campaign_data in campaigns_data:
                    try:
                        # Convert string dates to datetime objects
                        if "created_at" in campaign_data:
                            campaign_data["created_at"] = datetime.fromisoformat(campaign_data["created_at"])
                        if "updated_at" in campaign_data:
                            campaign_data["updated_at"] = datetime.fromisoformat(campaign_data["updated_at"])
                        if "start_date" in campaign_data and campaign_data["start_date"]:
                            campaign_data["start_date"] = datetime.fromisoformat(campaign_data["start_date"])
                        if "end_date" in campaign_data and campaign_data["end_date"]:
                            campaign_data["end_date"] = datetime.fromisoformat(campaign_data["end_date"])

                        # Convert scheduled visits
                        if "scheduled_visits" in campaign_data:
                            for profile_id, visits in campaign_data["scheduled_visits"].items():
                                campaign_data["scheduled_visits"][profile_id] = [
                                    datetime.fromisoformat(visit) for visit in visits
                                ]

                        campaign = Campaign(**campaign_data)
                        self.campaigns[campaign.id] = campaign
                    except Exception as e:
                        logger.error(f"Error loading campaign: {e}")

                logger.info(f"Loaded {len(self.campaigns)} campaigns from storage")
        except Exception as e:
            logger.error(f"Error loading campaigns: {e}")

        # Load profile behaviors
        try:
            behaviors_file = self.storage_dir / "profile_behaviors.json"
            if behaviors_file.exists():
                with open(behaviors_file, "r") as f:
                    self.profile_behaviors = json.load(f)
                logger.info(f"Loaded behaviors for {len(self.profile_behaviors)} profiles")
        except Exception as e:
            logger.error(f"Error loading profile behaviors: {e}")

    async def _save_campaigns(self):
        """Save campaigns to storage"""
        try:
            campaigns_data = []
            for campaign in self.campaigns.values():
                # Convert to dict and handle datetime serialization
                campaign_dict = campaign.dict()
                campaign_dict["created_at"] = campaign_dict["created_at"].isoformat()
                campaign_dict["updated_at"] = campaign_dict["updated_at"].isoformat()

                if campaign_dict["start_date"]:
                    campaign_dict["start_date"] = campaign_dict["start_date"].isoformat()
                if campaign_dict["end_date"]:
                    campaign_dict["end_date"] = campaign_dict["end_date"].isoformat()

                # Convert scheduled visits
                if "scheduled_visits" in campaign_dict:
                    for profile_id, visits in campaign_dict["scheduled_visits"].items():
                        campaign_dict["scheduled_visits"][profile_id] = [
                            visit.isoformat() for visit in visits
                        ]

                campaigns_data.append(campaign_dict)

            campaigns_file = self.storage_dir / "campaigns.json"
            with open(campaigns_file, "w") as f:
                json.dump(campaigns_data, f, indent=2)

            logger.info(f"Saved {len(self.campaigns)} campaigns to storage")

            # Save profile behaviors
            behaviors_file = self.storage_dir / "profile_behaviors.json"
            with open(behaviors_file, "w") as f:
                json.dump(self.profile_behaviors, f, indent=2)

            logger.info(f"Saved behaviors for {len(self.profile_behaviors)} profiles")
        except Exception as e:
            logger.error(f"Error saving campaigns: {e}")

    async def create_campaign(self, campaign_data: Dict[str, Any]) -> str:
        """
        Create a new campaign

        Args:
            campaign_data: Campaign data dictionary

        Returns:
            Campaign ID
        """
        try:
            # Create campaign object
            campaign = Campaign(**campaign_data)

            # Set default start date if not provided
            if not campaign.start_date:
                campaign.start_date = datetime.utcnow()

            # Add to campaigns dictionary
            self.campaigns[campaign.id] = campaign

            # Initialize profile behaviors if not already set
            for profile_id in campaign.profile_ids:
                if profile_id not in self.profile_behaviors:
                    self.profile_behaviors[profile_id] = self._generate_profile_behavior()

            # Save campaigns
            await self._save_campaigns()

            logger.info(f"Created campaign {campaign.id}: {campaign.name}")

            return campaign.id
        except Exception as e:
            logger.error(f"Error creating campaign: {e}")
            raise

    def _generate_profile_behavior(self) -> Dict[str, Any]:
        """
        Generate a new profile behavior pattern

        Returns:
            Dictionary with behavior parameters
        """
        # Select a primary behavioral pattern
        primary_pattern = random.choice(list(BehavioralPattern))

        # Generate base behavior parameters
        behavior = {
            "pattern": primary_pattern,
            "scroll_speed": random.uniform(0.5, 2.0),
            "read_time_multiplier": random.uniform(0.7, 1.5),
            "click_probability": random.uniform(0.05, 0.3),
            "ad_interest_categories": random.sample([
                "technology", "sports", "health", "finance",
                "entertainment", "travel", "food", "fashion"
            ], k=random.randint(2, 4)),
            "preferred_time_of_day": random.choice(list(TimeOfDay)),
            "session_duration_range": (
                random.randint(30, 120),  # Min seconds
                random.randint(180, 600)  # Max seconds
            ),
            "mouse_movement": {
                "speed": random.uniform(0.7, 1.3),
                "jitter": random.uniform(0.01, 0.1),
                "natural_curves": random.choice([True, False, True]),  # Bias toward True
                "pause_probability": random.uniform(0.01, 0.1)
            },
            "typing": {
                "speed": random.uniform(0.6, 1.4),
                "error_rate": random.uniform(0.01, 0.08),
                "correction_probability": random.uniform(0.7, 0.95)
            },
            "evolution_factors": {
                "learning_rate": random.uniform(0.01, 0.1),
                "consistency": random.uniform(0.7, 0.95),
                "adaptability": random.uniform(0.1, 0.5)
            },
            "visit_history": {},
            "ad_interaction_history": {},
            "last_evolved": datetime.utcnow().isoformat()
        }

        # Adjust parameters based on behavioral pattern
        if primary_pattern == BehavioralPattern.CASUAL:
            behavior["scroll_speed"] *= 0.8
            behavior["read_time_multiplier"] *= 0.7
            behavior["session_duration_range"] = (
                max(20, int(behavior["session_duration_range"][0] * 0.8)),
                max(120, int(behavior["session_duration_range"][1] * 0.7))
            )
        elif primary_pattern == BehavioralPattern.FOCUSED:
            behavior["scroll_speed"] *= 1.2
            behavior["read_time_multiplier"] *= 1.3
            behavior["click_probability"] *= 1.5
        elif primary_pattern == BehavioralPattern.EXPLORER:
            behavior["click_probability"] *= 2.0
            behavior["session_duration_range"] = (
                behavior["session_duration_range"][0],
                int(behavior["session_duration_range"][1] * 1.5)
            )
        elif primary_pattern == BehavioralPattern.SCANNER:
            behavior["scroll_speed"] *= 1.8
            behavior["read_time_multiplier"] *= 0.5
            behavior["session_duration_range"] = (
                max(15, int(behavior["session_duration_range"][0] * 0.6)),
                max(90, int(behavior["session_duration_range"][1] * 0.6))
            )
        elif primary_pattern == BehavioralPattern.THOROUGH:
            behavior["scroll_speed"] *= 0.6
            behavior["read_time_multiplier"] *= 2.0
            behavior["session_duration_range"] = (
                behavior["session_duration_range"][0],
                int(behavior["session_duration_range"][1] * 1.8)
            )

        return behavior

    async def get_campaign(self, campaign_id: str) -> Optional[Campaign]:
        """
        Get a campaign by ID

        Args:
            campaign_id: Campaign ID

        Returns:
            Campaign object if found, None otherwise
        """
        return self.campaigns.get(campaign_id)

    async def list_campaigns(self) -> List[Campaign]:
        """
        List all campaigns

        Returns:
            List of campaign objects
        """
        return list(self.campaigns.values())

    async def update_campaign(self, campaign_id: str, updates: Dict[str, Any]) -> Optional[Campaign]:
        """
        Update a campaign

        Args:
            campaign_id: Campaign ID
            updates: Dictionary of updates to apply

        Returns:
            Updated campaign object if successful, None otherwise
        """
        try:
            # Check if campaign exists
            if campaign_id not in self.campaigns:
                logger.error(f"Campaign {campaign_id} not found")
                return None

            # Get campaign
            campaign = self.campaigns[campaign_id]

            # Apply updates
            for key, value in updates.items():
                if hasattr(campaign, key):
                    setattr(campaign, key, value)

            # Update timestamp
            campaign.updated_at = datetime.utcnow()

            # Save campaigns
            await self._save_campaigns()

            logger.info(f"Updated campaign {campaign_id}")

            return campaign
        except Exception as e:
            logger.error(f"Error updating campaign {campaign_id}: {e}")
            return None

    async def delete_campaign(self, campaign_id: str) -> bool:
        """
        Delete a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if campaign exists
            if campaign_id not in self.campaigns:
                logger.error(f"Campaign {campaign_id} not found")
                return False

            # Remove campaign
            del self.campaigns[campaign_id]

            # Save campaigns
            await self._save_campaigns()

            logger.info(f"Deleted campaign {campaign_id}")

            return True
        except Exception as e:
            logger.error(f"Error deleting campaign {campaign_id}: {e}")
            return False

    async def start_campaign(self, campaign_id: str) -> bool:
        """
        Start a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if campaign exists
            if campaign_id not in self.campaigns:
                logger.error(f"Campaign {campaign_id} not found")
                return False

            # Get campaign
            campaign = self.campaigns[campaign_id]

            # Check if campaign is already active
            if campaign.status == CampaignStatus.ACTIVE:
                logger.info(f"Campaign {campaign_id} is already active")
                return True

            # Update status
            campaign.status = CampaignStatus.ACTIVE
            campaign.updated_at = datetime.utcnow()

            # Schedule visits
            await self._schedule_campaign_visits(campaign)

            # Start scheduler if not already running
            if not self.scheduler_running:
                await self.start_scheduler()

            # Save campaigns
            await self._save_campaigns()

            logger.info(f"Started campaign {campaign_id}")

            return True
        except Exception as e:
            logger.error(f"Error starting campaign {campaign_id}: {e}")
            return False

    async def pause_campaign(self, campaign_id: str) -> bool:
        """
        Pause a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if campaign exists
            if campaign_id not in self.campaigns:
                logger.error(f"Campaign {campaign_id} not found")
                return False

            # Get campaign
            campaign = self.campaigns[campaign_id]

            # Check if campaign is already paused
            if campaign.status == CampaignStatus.PAUSED:
                logger.info(f"Campaign {campaign_id} is already paused")
                return True

            # Update status
            campaign.status = CampaignStatus.PAUSED
            campaign.updated_at = datetime.utcnow()

            # Remove scheduled visits for this campaign
            self.scheduled_visits = [
                visit for visit in self.scheduled_visits
                if visit[1] != campaign_id
            ]

            # Save campaigns
            await self._save_campaigns()

            logger.info(f"Paused campaign {campaign_id}")

            return True
        except Exception as e:
            logger.error(f"Error pausing campaign {campaign_id}: {e}")
            return False

    async def _schedule_campaign_visits(self, campaign: Campaign) -> None:
        """
        Schedule visits for a campaign

        Args:
            campaign: Campaign object
        """
        try:
            # Clear existing scheduled visits for this campaign
            self.scheduled_visits = [
                visit for visit in self.scheduled_visits
                if visit[1] != campaign.id
            ]

            # Get current time
            now = datetime.utcnow()

            # Get start and end dates
            start_date = campaign.start_date or now
            end_date = campaign.end_date or (now + timedelta(days=30))

            # Ensure start date is not in the past
            if start_date < now:
                start_date = now

            # Calculate scheduling window (up to 7 days in advance)
            schedule_end = min(end_date, now + timedelta(days=7))

            # Get visit frequency
            visits_per_day = self._get_visits_per_day(campaign)

            # Schedule visits for each profile
            for profile_id in campaign.profile_ids:
                # Get profile behavior
                behavior = self.profile_behaviors.get(profile_id, self._generate_profile_behavior())

                # Calculate visits for this profile
                profile_visits_per_day = self._adjust_visits_for_profile(visits_per_day, behavior)

                # Get preferred time of day
                preferred_time = behavior.get("preferred_time_of_day", TimeOfDay.MIDDAY)

                # Schedule visits
                scheduled_visits = []
                current_date = start_date

                while current_date <= schedule_end:
                    # Check if this is a weekday or weekend
                    is_weekend = current_date.weekday() >= 5  # 5=Saturday, 6=Sunday

                    # Adjust visits based on weekday/weekend
                    day_visits = max(1, int(profile_visits_per_day * (0.7 if is_weekend else 1.0)))

                    # Get active hours for this day
                    active_hours = self._get_active_hours(campaign, current_date.strftime("%A").lower(), preferred_time)

                    if active_hours:
                        # Schedule visits within active hours
                        day_visits_times = self._generate_visit_times(
                            current_date,
                            active_hours,
                            day_visits,
                            behavior
                        )

                        # Add to scheduled visits
                        for visit_time in day_visits_times:
                            heapq.heappush(
                                self.scheduled_visits,
                                (visit_time, campaign.id, profile_id)
                            )
                            scheduled_visits.append(visit_time)

                    # Move to next day
                    current_date += timedelta(days=1)

                # Store scheduled visits in campaign
                campaign.scheduled_visits[profile_id] = scheduled_visits

            # Save campaign
            await self._save_campaigns()

            logger.info(f"Scheduled visits for campaign {campaign.id}: {len(self.scheduled_visits)} total visits")
        except Exception as e:
            logger.error(f"Error scheduling visits for campaign {campaign.id}: {e}")

    def _get_visits_per_day(self, campaign: Campaign) -> int:
        """
        Get the number of visits per day for a campaign

        Args:
            campaign: Campaign object

        Returns:
            Number of visits per day
        """
        if campaign.visit_frequency == VisitFrequency.LOW:
            return random.randint(1, 2)
        elif campaign.visit_frequency == VisitFrequency.MEDIUM:
            return random.randint(3, 5)
        elif campaign.visit_frequency == VisitFrequency.HIGH:
            return random.randint(6, 10)
        elif campaign.visit_frequency == VisitFrequency.CUSTOM and campaign.custom_frequency:
            return campaign.custom_frequency.get("visits_per_day", 3)
        else:
            return 3  # Default to medium

    def _adjust_visits_for_profile(self, base_visits: int, behavior: Dict[str, Any]) -> int:
        """
        Adjust the number of visits based on profile behavior

        Args:
            base_visits: Base number of visits
            behavior: Profile behavior dictionary

        Returns:
            Adjusted number of visits
        """
        pattern = behavior.get("pattern", BehavioralPattern.CASUAL)

        if pattern == BehavioralPattern.CASUAL:
            return max(1, int(base_visits * random.uniform(0.7, 0.9)))
        elif pattern == BehavioralPattern.FOCUSED:
            return max(1, int(base_visits * random.uniform(0.8, 1.0)))
        elif pattern == BehavioralPattern.EXPLORER:
            return max(1, int(base_visits * random.uniform(1.1, 1.3)))
        elif pattern == BehavioralPattern.SCANNER:
            return max(1, int(base_visits * random.uniform(1.2, 1.5)))
        elif pattern == BehavioralPattern.THOROUGH:
            return max(1, int(base_visits * random.uniform(0.6, 0.8)))
        else:
            return base_visits

    def _get_active_hours(self, campaign: Campaign, day_of_week: str, preferred_time: str) -> List[Tuple[int, int]]:
        """
        Get active hours for a campaign on a specific day

        Args:
            campaign: Campaign object
            day_of_week: Day of week (lowercase)
            preferred_time: Preferred time of day

        Returns:
            List of (start_hour, end_hour) tuples
        """
        # Check if campaign has specific active hours
        if campaign.active_hours and day_of_week in campaign.active_hours:
            return campaign.active_hours[day_of_week]

        # Default active hours based on preferred time
        if preferred_time == TimeOfDay.EARLY_MORNING:
            return [(5, 8)]
        elif preferred_time == TimeOfDay.MORNING:
            return [(8, 11)]
        elif preferred_time == TimeOfDay.MIDDAY:
            return [(11, 14)]
        elif preferred_time == TimeOfDay.AFTERNOON:
            return [(14, 17)]
        elif preferred_time == TimeOfDay.EVENING:
            return [(17, 20)]
        elif preferred_time == TimeOfDay.NIGHT:
            return [(20, 23)]
        elif preferred_time == TimeOfDay.LATE_NIGHT:
            return [(23, 5)]
        else:
            # Default to business hours
            if day_of_week in ["saturday", "sunday"]:
                return [(10, 20)]  # 10 AM to 8 PM on weekends
            else:
                return [(8, 18)]  # 8 AM to 6 PM on weekdays

    def _generate_visit_times(
        self,
        date: datetime,
        active_hours: List[Tuple[int, int]],
        num_visits: int,
        behavior: Dict[str, Any]
    ) -> List[datetime]:
        """
        Generate visit times within active hours

        Args:
            date: Base date
            active_hours: List of (start_hour, end_hour) tuples
            num_visits: Number of visits to generate
            behavior: Profile behavior dictionary

        Returns:
            List of visit times
        """
        visit_times = []

        # Calculate total active minutes
        total_minutes = sum((end - start) * 60 for start, end in active_hours)

        # Ensure we have enough time for the visits
        if total_minutes < num_visits * 15:  # Minimum 15 minutes between visits
            # Reduce number of visits if not enough time
            num_visits = max(1, total_minutes // 15)

        # Generate visit times
        for _ in range(num_visits):
            # Select a random active hour range
            hour_range = random.choice(active_hours)
            start_hour, end_hour = hour_range

            # Handle overnight ranges
            if end_hour < start_hour:
                end_hour += 24

            # Calculate minutes in this range
            range_minutes = (end_hour - start_hour) * 60

            # Select a random minute within the range
            minute_offset = random.randint(0, range_minutes - 1)

            # Calculate hour and minute
            total_minutes = start_hour * 60 + minute_offset
            hour = (total_minutes // 60) % 24
            minute = total_minutes % 60

            # Create datetime
            visit_time = date.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            # Add some jitter to avoid exact patterns
            jitter = timedelta(minutes=random.randint(-5, 5), seconds=random.randint(-30, 30))
            visit_time += jitter

            # Add to list
            visit_times.append(visit_time)

        # Sort visit times
        visit_times.sort()

        # Ensure minimum spacing between visits (at least 15 minutes)
        for i in range(1, len(visit_times)):
            min_gap = timedelta(minutes=15)
            if visit_times[i] - visit_times[i-1] < min_gap:
                visit_times[i] = visit_times[i-1] + min_gap + timedelta(seconds=random.randint(0, 300))

        return visit_times

    async def start_scheduler(self) -> None:
        """Start the visit scheduler"""
        if self.scheduler_running:
            logger.info("Scheduler is already running")
            return

        self.scheduler_running = True
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Started campaigns scheduler")

    async def stop_scheduler(self) -> None:
        """Stop the visit scheduler"""
        if not self.scheduler_running:
            logger.info("Scheduler is not running")
            return

        self.scheduler_running = False
        if self.scheduler_task:
            try:
                self.scheduler_task.cancel()
                await asyncio.wait([self.scheduler_task], timeout=5)
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.error(f"Error cancelling scheduler task: {e}")

            self.scheduler_task = None

        logger.info("Stopped campaigns scheduler")

    async def _scheduler_loop(self) -> None:
        """Main scheduler loop"""
        try:
            logger.info("Campaigns scheduler loop started")

            while self.scheduler_running:
                try:
                    now = datetime.utcnow()

                    # Check if there are visits to execute
                    while self.scheduled_visits and self.scheduled_visits[0][0] <= now:
                        # Get the next visit
                        visit_time, campaign_id, profile_id = heapq.heappop(self.scheduled_visits)

                        # Check if campaign is still active
                        if campaign_id in self.campaigns and self.campaigns[campaign_id].status == CampaignStatus.ACTIVE:
                            # Execute the visit
                            asyncio.create_task(self._execute_visit(campaign_id, profile_id, visit_time))

                    # Schedule more visits if needed
                    await self._check_schedule_more_visits()

                    # Sleep for a short time
                    await asyncio.sleep(5)  # Check every 5 seconds
                except Exception as e:
                    logger.error(f"Error in scheduler loop: {e}")
                    await asyncio.sleep(10)  # Sleep longer on error
        except asyncio.CancelledError:
            logger.info("Campaigns scheduler loop cancelled")
        except Exception as e:
            logger.error(f"Unexpected error in scheduler loop: {e}")
            self.scheduler_running = False

    async def _check_schedule_more_visits(self) -> None:
        """Check if we need to schedule more visits"""
        try:
            # Get current time
            now = datetime.utcnow()

            # Check if we have active campaigns
            active_campaigns = [c for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE]

            for campaign in active_campaigns:
                # Check if campaign end date has passed
                if campaign.end_date and campaign.end_date < now:
                    # Mark campaign as completed
                    campaign.status = CampaignStatus.COMPLETED
                    campaign.updated_at = now
                    logger.info(f"Campaign {campaign.id} completed (end date reached)")
                    continue

                # Check if we need to schedule more visits
                # We want to always have visits scheduled for the next 7 days
                schedule_horizon = now + timedelta(days=7)

                # Check if we have any scheduled visits for this campaign
                campaign_visits = [v for v in self.scheduled_visits if v[1] == campaign.id]

                if not campaign_visits or (campaign_visits and campaign_visits[-1][0] < schedule_horizon):
                    # Schedule more visits
                    await self._schedule_campaign_visits(campaign)
        except Exception as e:
            logger.error(f"Error checking to schedule more visits: {e}")

    async def _execute_visit(self, campaign_id: str, profile_id: str, visit_time: datetime) -> None:
        """
        Execute a visit for a campaign

        Args:
            campaign_id: Campaign ID
            profile_id: Profile ID
            visit_time: Visit time
        """
        # Get lock for this profile
        if profile_id not in self.visit_locks:
            self.visit_locks[profile_id] = asyncio.Lock()

        # Acquire lock to prevent concurrent visits with the same profile
        async with self.visit_locks[profile_id]:
            try:
                # Get campaign and profile
                campaign = self.campaigns.get(campaign_id)
                if not campaign:
                    logger.error(f"Campaign {campaign_id} not found for scheduled visit")
                    return

                # Check if profile exists
                profile = await profile_manager.get_profile(profile_id)
                if not profile:
                    logger.error(f"Profile {profile_id} not found for scheduled visit")
                    return

                # Get profile behavior
                behavior = self.profile_behaviors.get(profile_id, self._generate_profile_behavior())

                # Select a URL from the campaign
                url = random.choice(campaign.urls)

                # Get engagement level
                engagement_config = self._get_engagement_config(campaign, behavior)

                # Get ad interaction config
                ad_interaction_config = self._get_ad_interaction_config(campaign, behavior)

                # Execute the visit
                logger.info(f"Executing visit for campaign {campaign_id}, profile {profile_id} to {url}")

                # Launch browser
                launch_result = await profile_manager.launch_profile(
                    profile_id=profile_id,
                    headless=False  # Set to True in production
                )

                if not launch_result.get('success', False):
                    logger.error(f"Failed to launch browser for profile {profile_id}: {launch_result.get('error', 'Unknown error')}")
                    return

                # Get browser instance
                browser = profile_manager.active_browsers.get(profile_id)
                if not browser:
                    logger.error(f"Browser not found for profile {profile_id}")
                    return

                try:
                    # Create a new page
                    page = await browser.new_page()

                    # Navigate to URL
                    await page.goto(url, timeout=60000)

                    # Execute engagement behavior
                    await self._execute_engagement(page, engagement_config, behavior)

                    # Execute ad interaction
                    ad_clicks = await self._execute_ad_interaction(page, ad_interaction_config, behavior)

                    # Update campaign statistics
                    campaign.total_visits += 1
                    campaign.total_impressions += 1  # Count each visit as at least one impression
                    campaign.total_clicks += ad_clicks

                    # Estimate revenue (very rough estimate)
                    # Assume $0.001 per impression and $0.01 per click
                    impression_revenue = 0.001
                    click_revenue = 0.01 * ad_clicks
                    campaign.estimated_revenue += impression_revenue + click_revenue

                    # Update profile behavior history
                    if 'visit_history' not in behavior:
                        behavior['visit_history'] = {}

                    domain = url.split('//')[-1].split('/')[0]
                    if domain not in behavior['visit_history']:
                        behavior['visit_history'][domain] = {
                            'visits': 0,
                            'last_visit': None,
                            'engagement': 0.0,
                            'ad_clicks': 0
                        }

                    behavior['visit_history'][domain]['visits'] += 1
                    behavior['visit_history'][domain]['last_visit'] = datetime.utcnow().isoformat()
                    behavior['visit_history'][domain]['engagement'] += engagement_config['engagement_score']
                    behavior['visit_history'][domain]['ad_clicks'] += ad_clicks

                    # Evolve behavior if enabled
                    if campaign.behavioral_evolution:
                        self._evolve_behavior(behavior, url, engagement_config, ad_clicks)

                    # Save updated behavior
                    self.profile_behaviors[profile_id] = behavior

                    # Save campaign updates
                    await self._save_campaigns()

                    # Close the page
                    await page.close()

                    logger.info(f"Completed visit for campaign {campaign_id}, profile {profile_id} to {url}")
                except Exception as e:
                    logger.error(f"Error during visit execution: {e}")
                finally:
                    # Close browser
                    await profile_manager.close_browser(profile_id)
            except Exception as e:
                logger.error(f"Error executing visit: {e}")

    def _get_engagement_config(self, campaign: Campaign, behavior: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get engagement configuration based on campaign settings and profile behavior

        Args:
            campaign: Campaign object
            behavior: Profile behavior dictionary

        Returns:
            Engagement configuration dictionary
        """
        # Base configuration
        config = {
            'scroll_depth': 0.7,  # How far down the page to scroll (0.0-1.0)
            'scroll_speed': behavior.get('scroll_speed', 1.0),
            'read_time': 30,  # Base time to spend on page in seconds
            'click_probability': behavior.get('click_probability', 0.1),
            'max_clicks': 3,  # Maximum number of non-ad clicks
            'max_pages': 2,  # Maximum number of pages to visit
            'engagement_score': 0.5  # Base engagement score (0.0-1.0)
        }

        # Adjust based on campaign engagement level
        if campaign.engagement_level == EngagementLevel.MINIMAL:
            config['scroll_depth'] = 0.3
            config['read_time'] = 15
            config['click_probability'] = 0.05
            config['max_clicks'] = 1
            config['max_pages'] = 1
            config['engagement_score'] = 0.2
        elif campaign.engagement_level == EngagementLevel.BASIC:
            config['scroll_depth'] = 0.5
            config['read_time'] = 25
            config['click_probability'] = 0.1
            config['max_clicks'] = 2
            config['max_pages'] = 1
            config['engagement_score'] = 0.4
        elif campaign.engagement_level == EngagementLevel.MODERATE:
            config['scroll_depth'] = 0.7
            config['read_time'] = 40
            config['click_probability'] = 0.15
            config['max_clicks'] = 3
            config['max_pages'] = 2
            config['engagement_score'] = 0.6
        elif campaign.engagement_level == EngagementLevel.DEEP:
            config['scroll_depth'] = 0.9
            config['read_time'] = 60
            config['click_probability'] = 0.25
            config['max_clicks'] = 5
            config['max_pages'] = 3
            config['engagement_score'] = 0.8
        elif campaign.engagement_level == EngagementLevel.CUSTOM and campaign.custom_engagement:
            # Apply custom engagement settings
            for key, value in campaign.custom_engagement.items():
                if key in config:
                    config[key] = value

        # Apply behavior modifiers
        config['read_time'] = int(config['read_time'] * behavior.get('read_time_multiplier', 1.0))

        # Add some randomness
        config['scroll_depth'] *= random.uniform(0.8, 1.2)
        config['scroll_depth'] = min(1.0, config['scroll_depth'])  # Cap at 1.0
        config['read_time'] = int(config['read_time'] * random.uniform(0.8, 1.2))
        config['click_probability'] *= random.uniform(0.7, 1.3)

        return config

    def _get_ad_interaction_config(self, campaign: Campaign, behavior: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get ad interaction configuration based on campaign settings and profile behavior

        Args:
            campaign: Campaign object
            behavior: Profile behavior dictionary

        Returns:
            Ad interaction configuration dictionary
        """
        # Base configuration
        config = {
            'click_probability': 0.05,  # Probability of clicking an ad
            'view_time': 2,  # Time to view ad before clicking (seconds)
            'max_clicks': 1,  # Maximum number of ad clicks
            'preferred_categories': behavior.get('ad_interest_categories', [])
        }

        # Adjust based on campaign ad interaction level
        if campaign.ad_interaction == AdInteraction.NONE:
            config['click_probability'] = 0.0
            config['max_clicks'] = 0
        elif campaign.ad_interaction == AdInteraction.VIEW_ONLY:
            config['click_probability'] = 0.0
            config['max_clicks'] = 0
        elif campaign.ad_interaction == AdInteraction.OCCASIONAL:
            config['click_probability'] = 0.03
            config['max_clicks'] = 1
        elif campaign.ad_interaction == AdInteraction.MODERATE:
            config['click_probability'] = 0.08
            config['max_clicks'] = 1
        elif campaign.ad_interaction == AdInteraction.HIGH:
            config['click_probability'] = 0.12
            config['max_clicks'] = 2
        elif campaign.ad_interaction == AdInteraction.CUSTOM and campaign.custom_interaction:
            # Apply custom interaction settings
            for key, value in campaign.custom_interaction.items():
                if key in config:
                    config[key] = value

        # Add some randomness
        config['click_probability'] *= random.uniform(0.8, 1.2)
        config['view_time'] = max(1, int(config['view_time'] * random.uniform(0.8, 1.2)))

        return config

    async def _execute_engagement(self, page, config: Dict[str, Any], behavior: Dict[str, Any]) -> None:
        """
        Execute engagement behavior on a page

        Args:
            page: Browser page
            config: Engagement configuration
            behavior: Profile behavior
        """
        try:
            # Wait for page to load
            await asyncio.sleep(random.uniform(1, 3))

            # Get page height
            page_height = await page.evaluate("document.body.scrollHeight")

            # Calculate scroll depth
            scroll_depth = int(page_height * config['scroll_depth'])

            # Scroll behavior based on profile pattern
            pattern = behavior.get('pattern', BehavioralPattern.CASUAL)

            if pattern == BehavioralPattern.CASUAL:
                # Casual scrolling with pauses
                await self._casual_scroll(page, scroll_depth, config['scroll_speed'])
            elif pattern == BehavioralPattern.FOCUSED:
                # More direct scrolling to content
                await self._focused_scroll(page, scroll_depth, config['scroll_speed'])
            elif pattern == BehavioralPattern.EXPLORER:
                # Explore many elements
                await self._explorer_scroll(page, scroll_depth, config['scroll_speed'], config['click_probability'])
            elif pattern == BehavioralPattern.SCANNER:
                # Quick scanning
                await self._scanner_scroll(page, scroll_depth, config['scroll_speed'])
            elif pattern == BehavioralPattern.THOROUGH:
                # Thorough reading
                await self._thorough_scroll(page, scroll_depth, config['scroll_speed'])
            else:
                # Default scrolling
                await self._casual_scroll(page, scroll_depth, config['scroll_speed'])

            # Simulate reading time
            await asyncio.sleep(config['read_time'])

            # Click on non-ad elements if configured
            if config['max_clicks'] > 0 and random.random() < config['click_probability']:
                await self._click_content_elements(page, config['max_clicks'])
        except Exception as e:
            logger.error(f"Error executing engagement: {e}")

    async def _casual_scroll(self, page, scroll_depth: int, scroll_speed: float) -> None:
        """Casual scrolling with pauses"""
        current_position = 0
        while current_position < scroll_depth:
            # Random scroll amount
            scroll_amount = random.randint(100, 300)
            current_position += scroll_amount

            # Scroll
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")

            # Random pause
            await asyncio.sleep(random.uniform(0.5, 2.0) / scroll_speed)

            # Occasional longer pause
            if random.random() < 0.2:
                await asyncio.sleep(random.uniform(1.0, 3.0))

    async def _focused_scroll(self, page, scroll_depth: int, scroll_speed: float) -> None:
        """More direct scrolling to content"""
        # First quick scroll to get to main content
        initial_scroll = min(800, scroll_depth // 2)
        await page.evaluate(f"window.scrollBy(0, {initial_scroll})")
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Then slower scrolling through content
        current_position = initial_scroll
        while current_position < scroll_depth:
            scroll_amount = random.randint(50, 150)
            current_position += scroll_amount

            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            await asyncio.sleep(random.uniform(0.3, 1.0) / scroll_speed)

    async def _explorer_scroll(self, page, scroll_depth: int, scroll_speed: float, click_probability: float) -> None:
        """Explore many elements with frequent stops and clicks"""
        current_position = 0
        while current_position < scroll_depth:
            # Smaller scroll amounts
            scroll_amount = random.randint(50, 150)
            current_position += scroll_amount

            # Scroll
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")

            # Pause to look at content
            await asyncio.sleep(random.uniform(0.5, 1.5) / scroll_speed)

            # Occasionally click on elements during scrolling
            if random.random() < click_probability:
                try:
                    # Try to find and click a link or button
                    elements = await page.query_selector_all("a, button")
                    if elements and len(elements) > 0:
                        # Select a random element
                        element = random.choice(elements)

                        # Check if element is visible
                        is_visible = await element.is_visible()
                        if is_visible:
                            # Click the element
                            await element.click()

                            # Wait for page to update
                            await asyncio.sleep(random.uniform(2.0, 4.0))

                            # Go back
                            await page.go_back()
                            await asyncio.sleep(random.uniform(1.0, 2.0))
                except Exception as e:
                    logger.error(f"Error clicking element during explorer scroll: {e}")

    async def _scanner_scroll(self, page, scroll_depth: int, scroll_speed: float) -> None:
        """Quick scanning with larger scroll jumps"""
        current_position = 0
        while current_position < scroll_depth:
            # Larger scroll amounts
            scroll_amount = random.randint(300, 500)
            current_position += scroll_amount

            # Scroll
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")

            # Brief pause
            await asyncio.sleep(random.uniform(0.2, 0.8) / scroll_speed)

    async def _thorough_scroll(self, page, scroll_depth: int, scroll_speed: float) -> None:
        """Thorough reading with very small scrolls and long pauses"""
        current_position = 0
        while current_position < scroll_depth:
            # Very small scroll amounts
            scroll_amount = random.randint(30, 80)
            current_position += scroll_amount

            # Scroll
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")

            # Longer pause to read content
            await asyncio.sleep(random.uniform(1.0, 3.0) / scroll_speed)

    async def _click_content_elements(self, page, max_clicks: int) -> None:
        """Click on non-ad content elements"""
        try:
            # Find potential clickable elements (excluding obvious ads)
            elements = await page.query_selector_all(
                "a:not([href*='ad']):not([href*='sponsor']):not([href*='promotion']), "
                "button:not([class*='ad']):not([class*='sponsor']):not([id*='ad'])"
            )

            if not elements or len(elements) == 0:
                return

            # Shuffle elements
            random.shuffle(elements)

            # Click on up to max_clicks elements
            clicks = 0
            for element in elements:
                if clicks >= max_clicks:
                    break

                try:
                    # Check if element is visible
                    is_visible = await element.is_visible()
                    if not is_visible:
                        continue

                    # Get element position
                    bounding_box = await element.bounding_box()
                    if not bounding_box:
                        continue

                    # Scroll element into view
                    await page.evaluate(
                        f"window.scrollTo({bounding_box['x']}, {bounding_box['y'] - 100})"
                    )
                    await asyncio.sleep(random.uniform(0.5, 1.5))

                    # Click the element
                    await element.click()
                    clicks += 1

                    # Wait for page to update
                    await asyncio.sleep(random.uniform(2.0, 5.0))

                    # Go back if it was a navigation
                    current_url = page.url
                    if current_url != page.url:
                        await page.go_back()
                        await asyncio.sleep(random.uniform(1.0, 2.0))
                except Exception as e:
                    logger.error(f"Error clicking content element: {e}")
        except Exception as e:
            logger.error(f"Error in click_content_elements: {e}")

    async def _execute_ad_interaction(self, page, config: Dict[str, Any], behavior: Dict[str, Any]) -> int:
        """
        Execute ad interaction behavior

        Args:
            page: Browser page
            config: Ad interaction configuration
            behavior: Profile behavior

        Returns:
            Number of ad clicks
        """
        try:
            # Check if we should click ads
            if config['click_probability'] <= 0 or config['max_clicks'] <= 0:
                return 0

            # Find ad elements
            ad_elements = await page.query_selector_all(
                "a[href*='ad'], a[href*='sponsor'], a[href*='promotion'], "
                "iframe[src*='ad'], iframe[id*='ad'], iframe[class*='ad'], "
                "div[id*='ad-'], div[class*='ad-'], div[id*='banner'], div[class*='banner']"
            )

            if not ad_elements or len(ad_elements) == 0:
                return 0

            # Shuffle ad elements
            random.shuffle(ad_elements)

            # Track clicks
            clicks = 0

            # Try to click on ads
            for element in ad_elements:
                if clicks >= config['max_clicks']:
                    break

                # Check if we should click this ad
                if random.random() > config['click_probability']:
                    continue

                try:
                    # Check if element is visible
                    is_visible = await element.is_visible()
                    if not is_visible:
                        continue

                    # Get element position
                    bounding_box = await element.bounding_box()
                    if not bounding_box:
                        continue

                    # Scroll element into view
                    await page.evaluate(
                        f"window.scrollTo({bounding_box['x']}, {bounding_box['y'] - 100})"
                    )

                    # Hover over the ad first
                    await element.hover()

                    # Wait a bit before clicking (view time)
                    await asyncio.sleep(config['view_time'])

                    # Click the ad
                    await element.click()
                    clicks += 1

                    # Wait for ad page to load
                    await asyncio.sleep(random.uniform(3.0, 8.0))

                    # Go back to original page
                    await page.go_back()
                    await asyncio.sleep(random.uniform(1.0, 3.0))
                except Exception as e:
                    logger.error(f"Error clicking ad element: {e}")

            return clicks
        except Exception as e:
            logger.error(f"Error in execute_ad_interaction: {e}")
            return 0

    def _evolve_behavior(self, behavior: Dict[str, Any], url: str, engagement_config: Dict[str, Any], ad_clicks: int) -> None:
        """
        Evolve profile behavior based on visit results

        Args:
            behavior: Profile behavior dictionary
            url: URL that was visited
            engagement_config: Engagement configuration used
            ad_clicks: Number of ad clicks
        """
        try:
            # Get evolution factors
            learning_rate = behavior.get('evolution_factors', {}).get('learning_rate', 0.05)
            consistency = behavior.get('evolution_factors', {}).get('consistency', 0.8)

            # Extract domain
            domain = url.split('//')[-1].split('/')[0]

            # Check if we have history for this domain
            domain_history = behavior.get('visit_history', {}).get(domain, {})
            visits = domain_history.get('visits', 0)

            # Only evolve if we have some history
            if visits > 1:
                # Adjust scroll speed based on engagement
                if engagement_config['engagement_score'] > 0.6:
                    # User engaged well, adjust scroll speed toward optimal
                    optimal_scroll_speed = behavior.get('scroll_speed', 1.0)
                    behavior['scroll_speed'] = (behavior['scroll_speed'] * consistency +
                                               optimal_scroll_speed * learning_rate)

                # Adjust read time multiplier based on engagement
                if engagement_config['engagement_score'] > 0.7:
                    # User engaged very well, increase read time
                    behavior['read_time_multiplier'] += learning_rate * 0.1
                elif engagement_config['engagement_score'] < 0.3:
                    # User engaged poorly, decrease read time
                    behavior['read_time_multiplier'] -= learning_rate * 0.1

                # Ensure read time multiplier stays in reasonable range
                behavior['read_time_multiplier'] = max(0.5, min(2.0, behavior['read_time_multiplier']))

                # Adjust click probability based on ad clicks
                if ad_clicks > 0:
                    # User clicked ads, slightly increase click probability
                    behavior['click_probability'] += learning_rate * 0.05
                else:
                    # User didn't click ads, slightly decrease click probability
                    behavior['click_probability'] -= learning_rate * 0.02

                # Ensure click probability stays in reasonable range
                behavior['click_probability'] = max(0.01, min(0.5, behavior['click_probability']))

            # Update last evolved timestamp
            behavior['last_evolved'] = datetime.utcnow().isoformat()
        except Exception as e:
            logger.error(f"Error evolving behavior: {e}")

# Create a singleton instance of CampaignsManager
campaigns_manager = CampaignsManager()
