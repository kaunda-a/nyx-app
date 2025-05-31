import asyncio
import logging
import os
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Set, Tuple
import uuid
import json
import heapq
from croniter import croniter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("crawler_manager")

class Task:
    """Represents a crawler task with all necessary parameters."""

    def __init__(
        self,
        task_id: str = None,
        url: str = None,
        instructions: str = None,
        profile_id: str = None,
        proxy_id: str = None,
        max_duration: int = 300,  # 5 minutes default
        priority: int = 1,
        parameters: Dict[str, Any] = None,
        schedule: Dict[str, Any] = None,
        campaign_id: str = None,
    ):
        self.task_id = task_id or str(uuid.uuid4())
        self.url = url
        self.instructions = instructions
        self.profile_id = profile_id
        self.proxy_id = proxy_id
        self.max_duration = max_duration
        self.priority = priority
        self.parameters = parameters or {}
        self.schedule = schedule or {}  # Schedule parameters for recurring tasks
        self.campaign_id = campaign_id  # For grouping tasks into campaigns
        self.created_at = datetime.now()
        self.started_at = None
        self.completed_at = None
        self.status = "pending"  # pending, running, completed, failed, scheduled
        self.result = None
        self.error = None
        self.engagement_metrics = {
            "page_views": 0,
            "scroll_depth": 0,
            "time_on_page": 0,
            "clicks": 0,
            "ad_impressions": 0,
            "ad_clicks": 0,
            "conversions": 0
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary."""
        return {
            "task_id": self.task_id,
            "url": self.url,
            "instructions": self.instructions,
            "profile_id": self.profile_id,
            "proxy_id": self.proxy_id,
            "max_duration": self.max_duration,
            "priority": self.priority,
            "parameters": self.parameters,
            "schedule": self.schedule,
            "campaign_id": self.campaign_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "engagement_metrics": self.engagement_metrics,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Task":
        """Create task from dictionary."""
        task = cls(
            task_id=data.get("task_id"),
            url=data.get("url"),
            instructions=data.get("instructions"),
            profile_id=data.get("profile_id"),
            proxy_id=data.get("proxy_id"),
            max_duration=data.get("max_duration"),
            priority=data.get("priority"),
            parameters=data.get("parameters"),
            schedule=data.get("schedule"),
            campaign_id=data.get("campaign_id"),
        )

        # Convert string dates back to datetime objects
        if data.get("created_at"):
            task.created_at = datetime.fromisoformat(data["created_at"])
        if data.get("started_at"):
            task.started_at = datetime.fromisoformat(data["started_at"])
        if data.get("completed_at"):
            task.completed_at = datetime.fromisoformat(data["completed_at"])

        task.status = data.get("status", "pending")
        task.result = data.get("result")
        task.error = data.get("error")

        # Set engagement metrics if available
        if data.get("engagement_metrics"):
            task.engagement_metrics = data.get("engagement_metrics")

        return task


class Campaign:
    """Represents an ad campaign with multiple tasks and profiles."""

    def __init__(
        self,
        campaign_id: str = None,
        name: str = None,
        description: str = None,
        urls: List[str] = None,
        profile_ids: List[str] = None,
        schedule: Dict[str, Any] = None,
        parameters: Dict[str, Any] = None,
    ):
        self.campaign_id = campaign_id or str(uuid.uuid4())
        self.name = name or f"Campaign-{self.campaign_id[:8]}"
        self.description = description or "Automated ad engagement campaign"
        self.urls = urls or []
        self.profile_ids = profile_ids or []
        self.schedule = schedule or {
            "frequency": "daily",
            "times_per_day": 3,
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "days_of_week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "time_windows": [
                {"start": "08:00", "end": "12:00"},
                {"start": "13:00", "end": "17:00"},
                {"start": "18:00", "end": "22:00"}
            ]
        }
        self.parameters = parameters or {}
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.status = "active"
        self.task_ids = []
        self.metrics = {
            "total_visits": 0,
            "total_impressions": 0,
            "total_clicks": 0,
            "total_conversions": 0,
            "total_time_spent": 0,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert campaign to dictionary."""
        return {
            "campaign_id": self.campaign_id,
            "name": self.name,
            "description": self.description,
            "urls": self.urls,
            "profile_ids": self.profile_ids,
            "schedule": self.schedule,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status,
            "task_ids": self.task_ids,
            "metrics": self.metrics,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Campaign":
        """Create campaign from dictionary."""
        campaign = cls(
            campaign_id=data.get("campaign_id"),
            name=data.get("name"),
            description=data.get("description"),
            urls=data.get("urls"),
            profile_ids=data.get("profile_ids"),
            schedule=data.get("schedule"),
            parameters=data.get("parameters"),
        )

        # Convert string dates back to datetime objects
        if data.get("created_at"):
            campaign.created_at = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            campaign.updated_at = datetime.fromisoformat(data["updated_at"])

        campaign.status = data.get("status", "active")
        campaign.task_ids = data.get("task_ids", [])
        campaign.metrics = data.get("metrics", {})

        return campaign


class CrawlerManager:
    """
    Manages crawler tasks, profiles, and execution.

    This class is responsible for:
    1. Managing task queue and scheduling
    2. Selecting appropriate profiles with proxies
    3. Executing tasks with the right crawler
    4. Monitoring and reporting results
    5. Managing ad campaigns and engagement metrics
    """

    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.scheduled_tasks: List[Tuple[datetime, str]] = []  # Priority queue of (next_run_time, task_id)
        self.campaigns: Dict[str, Campaign] = {}
        self.profile_manager = None  # Will be set later
        self.proxy_manager = None    # Will be set later
        self.crawler = None          # Will be set by register_crawler
        self.max_concurrent_tasks = 5
        self.task_history: List[Dict[str, Any]] = []
        self.profile_usage: Dict[str, Dict[str, Any]] = {}  # Track profile usage statistics
        self.scheduler_running = False
        self.scheduler_task = None

    def set_managers(self, profile_manager, proxy_manager):
        """Set the profile and proxy managers."""
        self.profile_manager = profile_manager
        self.proxy_manager = proxy_manager

    def register_crawler(self, crawler_instance):
        """Register the crawler instance."""
        self.crawler = crawler_instance
        logger.info("Registered crawler instance")

    async def start_scheduler(self):
        """Start the task scheduler."""
        if self.scheduler_running:
            return

        self.scheduler_running = True
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Task scheduler started")

    async def stop_scheduler(self):
        """Stop the task scheduler."""
        if not self.scheduler_running:
            return

        self.scheduler_running = False
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("Task scheduler stopped")

    async def _scheduler_loop(self):
        """Main scheduler loop that checks for tasks to run."""
        try:
            while self.scheduler_running:
                now = datetime.now()

                # Check if there are scheduled tasks to run
                while self.scheduled_tasks and self.scheduled_tasks[0][0] <= now:
                    _, task_id = heapq.heappop(self.scheduled_tasks)

                    # Check if task still exists
                    if task_id in self.tasks:
                        task = self.tasks[task_id]

                        # If it's a recurring task, schedule the next run
                        if task.schedule.get("recurring", False):
                            await self._schedule_next_run(task)

                        # Set task to pending and process it
                        task.status = "pending"
                        await self._process_tasks()

                # Sleep for a short time before checking again
                await asyncio.sleep(10)
        except asyncio.CancelledError:
            logger.info("Scheduler loop cancelled")
        except Exception as e:
            logger.error(f"Error in scheduler loop: {str(e)}")
            self.scheduler_running = False

    async def _schedule_next_run(self, task: Task):
        """Schedule the next run for a recurring task."""
        schedule = task.schedule

        if schedule.get("cron"):
            # Use croniter for cron-based scheduling
            cron_iter = croniter(schedule["cron"], datetime.now())
            next_run = cron_iter.get_next(datetime)
        else:
            # Use simple interval-based scheduling
            interval_minutes = schedule.get("interval_minutes", 60)
            next_run = datetime.now() + timedelta(minutes=interval_minutes)

        # Create a new task for the next run
        next_task = Task.from_dict(task.to_dict())
        next_task.task_id = str(uuid.uuid4())
        next_task.created_at = datetime.now()
        next_task.started_at = None
        next_task.completed_at = None
        next_task.status = "scheduled"

        # Add to tasks and scheduled queue
        self.tasks[next_task.task_id] = next_task
        heapq.heappush(self.scheduled_tasks, (next_run, next_task.task_id))

        logger.info(f"Scheduled next run of task {task.task_id} as {next_task.task_id} at {next_run}")

        # If this is part of a campaign, add to campaign task list
        if task.campaign_id and task.campaign_id in self.campaigns:
            self.campaigns[task.campaign_id].task_ids.append(next_task.task_id)

        return next_task.task_id

    async def add_task(self, task: Union[Task, Dict[str, Any]]) -> str:
        """Add a task to the queue."""
        if isinstance(task, dict):
            task = Task.from_dict(task)

        self.tasks[task.task_id] = task
        logger.info(f"Added task {task.task_id}")

        # If task has a schedule, add it to the scheduled tasks
        if task.schedule and task.schedule.get("enabled", False):
            # Determine when to run the task
            if task.schedule.get("run_at"):
                # Specific time to run
                run_at = datetime.fromisoformat(task.schedule["run_at"])
            elif task.schedule.get("delay_minutes"):
                # Run after a delay
                run_at = datetime.now() + timedelta(minutes=task.schedule["delay_minutes"])
            else:
                # Run immediately
                run_at = datetime.now()

            # Set task status to scheduled
            task.status = "scheduled"

            # Add to scheduled tasks queue
            heapq.heappush(self.scheduled_tasks, (run_at, task.task_id))
            logger.info(f"Scheduled task {task.task_id} to run at {run_at}")

            # Make sure scheduler is running
            if not self.scheduler_running:
                await self.start_scheduler()
        else:
            # Start task processing if we have capacity
            await self._process_tasks()

        return task.task_id

    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        return self.tasks.get(task_id)

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running or pending task."""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]

        if task.status == "running" and task_id in self.active_tasks:
            # Cancel the running asyncio task
            self.active_tasks[task_id].cancel()
            try:
                await self.active_tasks[task_id]
            except asyncio.CancelledError:
                pass

            del self.active_tasks[task_id]

        task.status = "cancelled"
        logger.info(f"Cancelled task {task_id}")

        # Archive the task
        self.task_history.append(task.to_dict())
        del self.tasks[task_id]

        return True

    async def _process_tasks(self):
        """Process pending tasks if we have capacity."""
        # Check if we can run more tasks
        if len(self.active_tasks) >= self.max_concurrent_tasks:
            return

        # Get pending tasks sorted by priority
        pending_tasks = [
            task for task in self.tasks.values()
            if task.status == "pending"
        ]
        pending_tasks.sort(key=lambda t: t.priority, reverse=True)

        # Start tasks up to our capacity
        for task in pending_tasks:
            if len(self.active_tasks) >= self.max_concurrent_tasks:
                break

            # Start the task
            asyncio_task = asyncio.create_task(self._execute_task(task))
            self.active_tasks[task.task_id] = asyncio_task

    async def _execute_task(self, task: Task):
        """Execute a single task with the appropriate crawler."""
        try:
            # Update task status
            task.status = "running"
            task.started_at = datetime.now()

            logger.info(f"Starting task {task.task_id}")

            # Select profile and proxy if not specified
            if not task.profile_id and self.profile_manager:
                # Select an appropriate profile based on usage patterns
                profiles = await self.profile_manager.list_profiles()
                if profiles:
                    # Prefer profiles with less recent usage
                    profile_ids = [p.id for p in profiles]
                    task.profile_id = self._select_profile_for_campaign(profile_ids)
                    logger.info(f"Selected profile {task.profile_id} for task {task.task_id}")

            if not task.proxy_id and task.profile_id and self.proxy_manager:
                # Check if profile has an assigned proxy
                if task.profile_id in self.proxy_manager.profile_proxies:
                    task.proxy_id = self.proxy_manager.profile_proxies[task.profile_id]
                    logger.info(f"Using proxy {task.proxy_id} for task {task.task_id}")

            # Enhance task instructions for ad engagement if this is a campaign task
            if task.campaign_id and task.campaign_id in self.campaigns:
                # Add realistic browsing instructions
                enhanced_instructions = self._generate_realistic_browsing_instructions(task)
                if enhanced_instructions:
                    task.instructions = enhanced_instructions

            # Use the API routes to execute the task
            try:
                # Import here to avoid circular imports
                from api.routes.crawlers import CrawlerTask, execute_web_task

                # Create API task object with enhanced parameters for realistic browsing
                api_task = CrawlerTask(
                    task_id=task.task_id,
                    url=task.url,
                    instructions=task.instructions,
                    profile_id=task.profile_id,
                    max_duration=task.max_duration,
                    parameters={
                        **task.parameters,
                        "proxy": self.proxy_manager.proxy_pool[task.proxy_id]['config'] if task.proxy_id and task.proxy_id in self.proxy_manager.proxy_pool else None,
                        "realistic_browsing": True,
                        "track_engagement": True,
                        "simulate_human": True
                    }
                )

                # Execute web task
                await execute_web_task(api_task)

                # Get result from API
                from api.routes.crawlers import task_results
                if task.task_id in task_results:
                    result = task_results[task.task_id]
                    task.status = "completed" if result.success else "failed"
                    task.completed_at = datetime.now()
                    task.result = result.result
                    task.error = result.error

                    # Extract engagement metrics from result
                    self._extract_engagement_metrics(task, result)

                    # Update campaign metrics if this is a campaign task
                    if task.campaign_id and task.campaign_id in self.campaigns:
                        self._update_campaign_metrics(task.campaign_id, task)
                else:
                    raise ValueError(f"Task execution failed: no result found for task {task.task_id}")

            except ImportError:
                # Fall back to old method if API routes not available
                if not self.crawler:
                    raise ValueError("No crawler registered")

                # Execute the task with the crawler
                result = await self.crawler.execute(task)

                # Update task with result
                task.status = "completed"
                task.completed_at = datetime.now()
                task.result = result

                # Extract basic engagement metrics
                task.engagement_metrics = {
                    "page_views": 1,
                    "time_on_page": (task.completed_at - task.started_at).total_seconds(),
                    "scroll_depth": random.uniform(0.3, 1.0),  # Simulate scroll depth
                    "clicks": random.randint(0, 5),  # Simulate clicks
                    "ad_impressions": random.randint(1, 10),  # Simulate ad impressions
                    "ad_clicks": random.randint(0, 2),  # Simulate ad clicks
                    "conversions": 0
                }

            logger.info(f"Completed task {task.task_id}")

            # Update profile usage statistics
            if task.profile_id:
                await self.update_profile_usage(
                    task.profile_id,
                    task.task_id,
                    {
                        "success": task.status == "completed",
                        "time_on_page": task.engagement_metrics.get("time_on_page", 0)
                    }
                )

        except Exception as e:
            # Handle task failure
            logger.error(f"Task {task.task_id} failed: {str(e)}")
            task.status = "failed"
            task.completed_at = datetime.now()
            task.error = str(e)

            # Update profile usage for failed task
            if task.profile_id:
                await self.update_profile_usage(
                    task.profile_id,
                    task.task_id,
                    {"success": False}
                )

        finally:
            # Clean up
            if task.task_id in self.active_tasks:
                del self.active_tasks[task.task_id]

            # Archive the task
            self.task_history.append(task.to_dict())
            if task.task_id in self.tasks:
                del self.tasks[task.task_id]

            # Process more tasks
            await self._process_tasks()

    def _generate_realistic_browsing_instructions(self, task: Task) -> Optional[str]:
        """Generate realistic browsing instructions for ad engagement."""
        # Base instructions for natural browsing
        base_instructions = f"""
        Visit {task.url} and behave like a real human user interested in the content:

        1. Scroll naturally through the page, pausing to read content
        2. Look for interesting articles, products, or information
        3. Click on at least one interesting link if available
        4. Pay attention to advertisements that appear relevant to the content
        5. If an ad seems interesting or relevant, click on it
        6. Spend between {task.parameters.get('min_duration', 60)} and {task.parameters.get('max_duration', 300)} seconds on the site
        7. If you click on an ad, explore the advertiser's page briefly

        Report back with:
        - A summary of the content you viewed
        - Any ads you noticed and whether you clicked on them
        - Any products or services that seemed interesting
        """

        # Add specific behavior based on parameters
        if task.parameters.get("scroll_behavior") == "thorough":
            base_instructions += "\nMake sure to scroll all the way to the bottom of the page, reading carefully."

        if task.parameters.get("ad_focus", False):
            base_instructions += "\nPay special attention to advertisements, especially those related to products or services you might be interested in."

        return base_instructions

    def _extract_engagement_metrics(self, task: Task, result):
        """Extract engagement metrics from task result."""
        # Initialize with default metrics
        metrics = {
            "page_views": 1,
            "scroll_depth": 0,
            "time_on_page": 0,
            "clicks": 0,
            "ad_impressions": 0,
            "ad_clicks": 0,
            "conversions": 0
        }

        # Calculate time on page
        if task.started_at and task.completed_at:
            metrics["time_on_page"] = (task.completed_at - task.started_at).total_seconds()

        # Try to extract metrics from result
        if hasattr(result, 'result') and result.result:
            result_data = result.result

            # If result is a string, try to parse JSON
            if isinstance(result_data, str):
                try:
                    result_data = json.loads(result_data)
                except:
                    pass

            # If result is a dict, extract metrics
            if isinstance(result_data, dict):
                # Extract metrics from result
                metrics["scroll_depth"] = result_data.get("scroll_depth", metrics["scroll_depth"])
                metrics["clicks"] = result_data.get("clicks", metrics["clicks"])
                metrics["ad_impressions"] = result_data.get("ad_impressions", metrics["ad_impressions"])
                metrics["ad_clicks"] = result_data.get("ad_clicks", metrics["ad_clicks"])
                metrics["conversions"] = result_data.get("conversions", metrics["conversions"])

        # Update task metrics
        task.engagement_metrics = metrics

    def _update_campaign_metrics(self, campaign_id: str, task: Task):
        """Update campaign metrics with task results."""
        if campaign_id not in self.campaigns:
            return

        campaign = self.campaigns[campaign_id]
        metrics = campaign.metrics

        # Update campaign metrics
        metrics["total_visits"] += 1
        metrics["total_impressions"] += task.engagement_metrics.get("ad_impressions", 0)
        metrics["total_clicks"] += task.engagement_metrics.get("ad_clicks", 0)
        metrics["total_conversions"] += task.engagement_metrics.get("conversions", 0)
        metrics["total_time_spent"] += task.engagement_metrics.get("time_on_page", 0)

        # Update campaign
        campaign.updated_at = datetime.now()

    async def get_active_tasks(self) -> List[Dict[str, Any]]:
        """Get all active tasks."""
        return [task.to_dict() for task in self.tasks.values()]

    async def get_task_history(self) -> List[Dict[str, Any]]:
        """Get task execution history."""
        return self.task_history

    async def clear_task_history(self):
        """Clear task execution history."""
        self.task_history = []

    async def create_campaign(self, campaign: Union[Campaign, Dict[str, Any]]) -> str:
        """Create a new ad engagement campaign."""
        if isinstance(campaign, dict):
            campaign = Campaign.from_dict(campaign)

        self.campaigns[campaign.campaign_id] = campaign
        logger.info(f"Created campaign {campaign.campaign_id}: {campaign.name}")

        # Schedule initial tasks for the campaign
        await self._schedule_campaign_tasks(campaign)

        return campaign.campaign_id

    async def _schedule_campaign_tasks(self, campaign: Campaign) -> List[str]:
        """Schedule tasks for a campaign based on its configuration."""
        task_ids = []

        # Get campaign schedule
        schedule = campaign.schedule
        start_date = datetime.fromisoformat(schedule["start_date"]) if isinstance(schedule["start_date"], str) else schedule["start_date"]
        end_date = datetime.fromisoformat(schedule["end_date"]) if isinstance(schedule["end_date"], str) else schedule["end_date"]

        # Check if campaign is in valid date range
        now = datetime.now()
        if now < start_date:
            logger.info(f"Campaign {campaign.campaign_id} will start on {start_date}")
            return task_ids

        if now > end_date:
            logger.info(f"Campaign {campaign.campaign_id} has ended on {end_date}")
            campaign.status = "completed"
            return task_ids

        # Get today's day of week
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today = days[datetime.now().weekday()]

        # Check if campaign runs today
        if today not in schedule["days_of_week"]:
            logger.info(f"Campaign {campaign.campaign_id} does not run on {today}")
            return task_ids

        # Determine how many tasks to schedule today
        times_per_day = schedule.get("times_per_day", 1)

        # Get available time windows
        time_windows = schedule.get("time_windows", [{"start": "09:00", "end": "17:00"}])

        # Get available profiles
        profiles = campaign.profile_ids
        if not profiles and self.profile_manager:
            # If no specific profiles, get all available profiles
            all_profiles = await self.profile_manager.list_profiles()
            profiles = [p.id for p in all_profiles]

        if not profiles:
            logger.warning(f"No profiles available for campaign {campaign.campaign_id}")
            return task_ids

        # Get URLs to visit
        urls = campaign.urls
        if not urls:
            logger.warning(f"No URLs specified for campaign {campaign.campaign_id}")
            return task_ids

        # Get minimum hours between visits
        min_hours_between = schedule.get("min_hours_between", 2)

        # Track profile visit times to ensure proper spacing
        profile_visit_times = {profile_id: [] for profile_id in profiles}

        # Schedule tasks
        for _ in range(times_per_day):
            # For each profile, schedule visits with proper spacing
            for profile_id in profiles:
                # Select a random time window
                window = random.choice(time_windows)

                # Parse time window
                start_time = datetime.strptime(window["start"], "%H:%M").time()
                end_time = datetime.strptime(window["end"], "%H:%M").time()

                # Calculate a random time within the window
                start_minutes = start_time.hour * 60 + start_time.minute
                end_minutes = end_time.hour * 60 + end_time.minute

                if end_minutes <= start_minutes:
                    end_minutes += 24 * 60  # Handle overnight windows

                random_minutes = random.randint(start_minutes, end_minutes)
                hours, minutes = divmod(random_minutes, 60)
                hours %= 24  # Handle overflow

                # Create task time
                task_time = datetime.now().replace(hour=hours, minute=minutes, second=0, microsecond=0)

                # If time is in the past, schedule for tomorrow
                if task_time < datetime.now():
                    task_time += timedelta(days=1)

                # Check if this time respects the minimum hours between visits
                valid_time = True
                for prev_time in profile_visit_times[profile_id]:
                    time_diff = abs((task_time - prev_time).total_seconds()) / 3600
                    if time_diff < min_hours_between:
                        valid_time = False
                        break

                # If not valid, try to find a better time
                attempts = 0
                while not valid_time and attempts < 10:
                    # Adjust time by adding some hours
                    task_time += timedelta(hours=min_hours_between)
                    valid_time = True
                    for prev_time in profile_visit_times[profile_id]:
                        time_diff = abs((task_time - prev_time).total_seconds()) / 3600
                        if time_diff < min_hours_between:
                            valid_time = False
                            break
                    attempts += 1

                # Record this visit time
                profile_visit_times[profile_id].append(task_time)

                # Select a random URL
                url = random.choice(urls)

                # Create the task
                task = Task(
                    url=url,
                    instructions=f"Visit this website and engage with content naturally. Look for ads and interact with them if relevant.",
                    profile_id=profile_id,
                    campaign_id=campaign.campaign_id,
                    schedule={
                        "enabled": True,
                        "run_at": task_time.isoformat(),
                        "recurring": False
                    },
                    parameters={
                        "realistic_browsing": True,
                        "min_duration": 60,  # At least 1 minute
                        "max_duration": 300,  # At most 5 minutes
                        "scroll_behavior": "natural",
                        "click_probability": 0.3,
                        "ad_click_probability": 0.1,
                        "ad_engagement": True,
                        "premium_geo": True  # Flag for premium geo targeting
                    }
                )

                # Add the task
                task_id = await self.add_task(task)
                task_ids.append(task_id)

                # Add to campaign task list
                campaign.task_ids.append(task_id)

                logger.info(f"Scheduled task {task_id} for profile {profile_id} in campaign {campaign.campaign_id} at {task_time}")

        return task_ids

    def _select_profile_for_campaign(self, profile_ids: List[str]) -> str:
        """Select the most appropriate profile for a campaign task."""
        if not profile_ids:
            return None

        # If only one profile, use it
        if len(profile_ids) == 1:
            return profile_ids[0]

        # Find profiles with least recent usage
        profile_usage = {}
        for profile_id in profile_ids:
            if profile_id in self.profile_usage:
                profile_usage[profile_id] = self.profile_usage[profile_id].get("last_used", 0)
            else:
                # If no usage record, prioritize this profile
                profile_usage[profile_id] = 0

        # Sort profiles by last usage time (oldest first)
        sorted_profiles = sorted(profile_usage.items(), key=lambda x: x[1])

        # Return the least recently used profile
        return sorted_profiles[0][0]

    async def update_campaign(self, campaign_id: str, updates: Dict[str, Any]) -> Optional[Campaign]:
        """Update a campaign's configuration."""
        if campaign_id not in self.campaigns:
            return None

        campaign = self.campaigns[campaign_id]

        # Update campaign fields
        for key, value in updates.items():
            if hasattr(campaign, key):
                setattr(campaign, key, value)

        campaign.updated_at = datetime.now()

        # If schedule was updated, reschedule tasks
        if "schedule" in updates:
            # Cancel existing scheduled tasks for this campaign
            for task_id in campaign.task_ids:
                if task_id in self.tasks and self.tasks[task_id].status == "scheduled":
                    await self.cancel_task(task_id)

            # Clear task list and schedule new tasks
            campaign.task_ids = []
            await self._schedule_campaign_tasks(campaign)

        logger.info(f"Updated campaign {campaign_id}")
        return campaign

    async def get_campaign(self, campaign_id: str) -> Optional[Campaign]:
        """Get a campaign by ID."""
        return self.campaigns.get(campaign_id)

    async def list_campaigns(self) -> List[Dict[str, Any]]:
        """List all campaigns."""
        return [campaign.to_dict() for campaign in self.campaigns.values()]

    async def delete_campaign(self, campaign_id: str) -> bool:
        """Delete a campaign and cancel all its tasks."""
        if campaign_id not in self.campaigns:
            return False

        campaign = self.campaigns[campaign_id]

        # Cancel all tasks for this campaign
        for task_id in campaign.task_ids:
            if task_id in self.tasks:
                await self.cancel_task(task_id)

        # Remove campaign
        del self.campaigns[campaign_id]
        logger.info(f"Deleted campaign {campaign_id}")

        return True

    async def update_profile_usage(self, profile_id: str, task_id: str, metrics: Dict[str, Any] = None):
        """Update profile usage statistics."""
        if profile_id not in self.profile_usage:
            self.profile_usage[profile_id] = {
                "task_count": 0,
                "last_used": 0,
                "total_duration": 0,
                "success_count": 0,
                "failure_count": 0,
                "tasks": []
            }

        usage = self.profile_usage[profile_id]
        usage["task_count"] += 1
        usage["last_used"] = time.time()
        usage["tasks"].append(task_id)

        # Limit task history
        if len(usage["tasks"]) > 100:
            usage["tasks"] = usage["tasks"][-100:]

        # Update metrics if provided
        if metrics:
            usage["total_duration"] += metrics.get("time_on_page", 0)
            if metrics.get("success", True):
                usage["success_count"] += 1
            else:
                usage["failure_count"] += 1


# Create a singleton instance
crawler_manager = CrawlerManager()
