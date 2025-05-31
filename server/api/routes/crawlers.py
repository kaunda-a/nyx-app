from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Body, status, Query
from typing import Dict, List, Optional, Any, Union
import asyncio
import logging
import os
import sys
import importlib.util
from pydantic import BaseModel, Field
import uuid
import json
from datetime import datetime, timedelta

# Import crawler operations (unified bridge layer)
from db.crawler_operations import crawler_operations

# Import crawler manager for direct operations when needed
from core.crawler_manager import crawler_manager, Task, Campaign

# Import profile and proxy managers
from core.profile_manager import profile_manager
from core.proxy_manager import proxy_manager

# Check if google-generativeai is available
GOOGLE_GENAI_AVAILABLE = importlib.util.find_spec("google.generativeai") is not None

# Import browser-use for browser automation
try:
    from browser_use import Agent
    if GOOGLE_GENAI_AVAILABLE:
        import google.generativeai as genai
    else:
        logging.warning("google.generativeai is not available. Crawler functionality will be limited.")
except ImportError as e:
    logging.error(f"Error importing dependencies: {e}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("crawlers")

# Import authentication
from security.auth import get_current_user, User

# Create router
router = APIRouter(prefix="/crawlers", tags=["crawlers"])

# Initialize crawler manager
# Initialize crawler manager function - will be called when needed
async def initialize_crawler_manager():
    """Initialize the crawler manager with profile and proxy managers."""
    # Set up managers
    crawler_manager.set_managers(profile_manager, proxy_manager)

    # Create a simple crawler instance for direct execution if needed
    class WebCrawler:
        async def execute(self, task):
            """Execute a web task directly."""
            logger.info(f"Direct execution of task {task.task_id}")
            return f"Executed task {task.task_id} for URL {task.url}"

    # Register the crawler
    crawler_manager.register_crawler(WebCrawler())

    # Start the scheduler
    await crawler_manager.start_scheduler()
    logger.info("Crawler manager initialized with scheduler")

# Models
class CrawlerTask(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: Optional[str] = None
    instructions: str
    profile_id: Optional[str] = None
    max_duration: int = 300  # 5 minutes default
    parameters: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    status: str = "pending"  # pending, running, completed, failed

class CrawlerResult(BaseModel):
    task_id: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    screenshots: List[str] = Field(default_factory=list)
    completed_at: datetime = Field(default_factory=datetime.now)

# In-memory storage for tasks and results
active_tasks: Dict[str, asyncio.Task] = {}
task_results: Dict[str, CrawlerResult] = {}
task_history: List[CrawlerTask] = []

# Helper functions
async def get_proxy_config(task: CrawlerTask) -> Optional[Dict[str, Any]]:
    """Get proxy configuration for a task."""
    proxy_config = None

    # Check if profile has a proxy
    if task.profile_id:
        try:
            # Get profile
            profile = await profile_manager.get_profile(task.profile_id)
            if not profile:
                logger.warning(f"Profile not found: {task.profile_id}")
                return None

            # Check if profile has proxy
            if task.profile_id in proxy_manager.profile_proxies:
                proxy_id = proxy_manager.profile_proxies[task.profile_id]
                if proxy_id in proxy_manager.proxy_pool:
                    proxy_data = proxy_manager.proxy_pool[proxy_id]
                    proxy_config = proxy_data.get('config', {})
                    logger.info(f"Using proxy from profile: {proxy_config}")
        except Exception as e:
            logger.error(f"Error getting profile proxy: {str(e)}")

    # If no proxy from profile, check parameters
    if not proxy_config and "proxy" in task.parameters:
        proxy_config = task.parameters["proxy"]
        logger.info(f"Using proxy from parameters: {proxy_config}")

    return proxy_config

async def execute_task(task: CrawlerTask, task_instructions: Optional[str] = None):
    """Execute a task with the given instructions."""
    try:
        logger.info(f"Executing web task: {task.task_id}")

        # Check if google-generativeai is available
        if not GOOGLE_GENAI_AVAILABLE:
            logger.warning("google.generativeai is not available. Crawler functionality will be limited.")

            # Create a mock result
            task_results[task.task_id] = CrawlerResult(
                task_id=task.task_id,
                success=False,
                error="google.generativeai is not available. Please install it with 'pip install google-generativeai'."
            )
            return

        # Get proxy configuration
        proxy_config = await get_proxy_config(task)

        # Prepare agent parameters with enhanced browsing behavior
        agent_params = {
            "headless": task.parameters.get("headless", False),
            "max_iterations": task.parameters.get("max_iterations", 15),
            "verbose": task.parameters.get("verbose", True),
            "model": "gemini-1.5-pro",  # Specify the model directly
            "timeout": task.parameters.get("timeout", 300),  # 5 minutes default
        }

        # Add realistic browsing parameters if enabled
        if task.parameters.get("realistic_browsing", False):
            agent_params.update({
                "wait_time_between_actions": task.parameters.get("wait_time", [1, 5]),  # Random wait between 1-5 seconds
                "scroll_behavior": task.parameters.get("scroll_behavior", "natural"),
                "click_probability": task.parameters.get("click_probability", 0.3),
                "max_links_to_click": task.parameters.get("max_links", 3),
                "track_metrics": True
            })

        # Add proxy if available
        if proxy_config:
            agent_params["proxy"] = proxy_config

        # Determine final instructions
        final_instructions = task.instructions
        if task_instructions:
            final_instructions = f"{task_instructions}\n\n{task.instructions}"

        # Add ad engagement instructions if not already present
        if task.parameters.get("ad_engagement", False) and "advertisement" not in final_instructions.lower():
            ad_instructions = """
            Pay attention to advertisements on the page. If you see relevant ads:
            1. Note their position and content
            2. If they seem interesting, click on them
            3. Explore the advertiser's page briefly
            4. Return to the original page if needed

            Include information about ads you saw and interacted with in your report.
            """
            final_instructions = f"{final_instructions}\n\n{ad_instructions}"

        # Create the agent - browser-use will use the default Google Gemini integration
        agent = Agent(
            task=final_instructions if not task.url else f"Navigate to {task.url} and then {final_instructions}",
            **agent_params
        )

        # Execute the task
        result = await agent.run()

        # Process and enhance the result with engagement metrics
        engagement_metrics = {
            "page_views": 1,
            "scroll_depth": 0,
            "time_on_page": 0,
            "clicks": 0,
            "ad_impressions": 0,
            "ad_clicks": 0,
            "conversions": 0
        }

        # Extract metrics from agent if available
        if hasattr(agent, "metrics"):
            metrics = agent.metrics
            engagement_metrics.update({
                "scroll_depth": metrics.get("scroll_percentage", 0),
                "clicks": metrics.get("click_count", 0),
                "time_on_page": metrics.get("time_on_page", 0)
            })

        # Try to extract ad metrics from result
        if isinstance(result, str):
            # Count ad impressions based on mentions
            ad_keywords = ["advertisement", "ad ", "ads ", "banner", "sponsored", "promotion"]
            ad_impressions = sum(1 for keyword in ad_keywords if keyword in result.lower())
            engagement_metrics["ad_impressions"] = max(ad_impressions, 1)  # Assume at least 1 ad impression

            # Check for ad clicks
            ad_click_phrases = ["clicked on ad", "clicked the ad", "clicked an ad", "ad click", "clicked a sponsored"]
            engagement_metrics["ad_clicks"] = sum(1 for phrase in ad_click_phrases if phrase in result.lower())

        # Create enhanced result with metrics
        enhanced_result = {
            "content": result,
            "engagement_metrics": engagement_metrics
        }

        # Store the result
        task_results[task.task_id] = CrawlerResult(
            task_id=task.task_id,
            success=True,
            result=enhanced_result,
            screenshots=agent.screenshots if hasattr(agent, "screenshots") else []
        )

        logger.info(f"Task {task.task_id} completed successfully with {engagement_metrics['ad_impressions']} ad impressions and {engagement_metrics['ad_clicks']} ad clicks")

    except Exception as e:
        logger.error(f"Task {task.task_id} failed: {str(e)}")
        task_results[task.task_id] = CrawlerResult(
            task_id=task.task_id,
            success=False,
            error=str(e)
        )
    finally:
        # Update task status
        for i, t in enumerate(task_history):
            if t.task_id == task.task_id:
                task_history[i].status = "completed" if task_results[task.task_id].success else "failed"
                break

        # Remove from active tasks
        if task.task_id in active_tasks:
            del active_tasks[task.task_id]

async def execute_web_task(task: CrawlerTask):
    """Execute a web browsing task."""
    await execute_task(task)

# API Routes
@router.post("/tasks", response_model=Dict[str, str])
async def create_task(
    background_tasks: BackgroundTasks,
    task: CrawlerTask,
    current_user: User = Depends(get_current_user)
):
    """Create a new crawler task."""
    # Check if required dependencies are available
    browser_use_available = importlib.util.find_spec("browser_use") is not None
    if not browser_use_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Required dependency not available: browser-use"
        )

    # Warn if google-generativeai is not available
    if not GOOGLE_GENAI_AVAILABLE:
        logger.warning("google.generativeai is not available. Tasks will not work properly.")
        logger.warning("Please install it with 'pip install google-generativeai'.")

    # Initialize crawler manager if needed
    if not crawler_manager.profile_manager:
        await initialize_crawler_manager()

    # Add to history
    task_history.append(task)

    # Execute as web task
    task_obj = asyncio.create_task(execute_web_task(task))
    active_tasks[task.task_id] = task_obj

    return {"task_id": task.task_id, "status": "created"}

@router.get("/tasks/{task_id}", response_model=Union[CrawlerTask, Dict[str, str]])
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get task status and details."""
    # Check if task is in history
    for task in task_history:
        if task.task_id == task_id:
            return task

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

@router.get("/tasks/{task_id}/result", response_model=Union[CrawlerResult, Dict[str, str]])
async def get_task_result(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get task result."""
    # Check if result exists
    if task_id in task_results:
        return task_results[task_id]

    # Check if task is still running
    if task_id in active_tasks:
        return {"status": "running", "task_id": task_id}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task result not found")

@router.get("/tasks", response_model=List[CrawlerTask])
async def list_tasks(
    current_user: User = Depends(get_current_user)
):
    """List all tasks."""
    return task_history

@router.delete("/tasks/{task_id}", response_model=Dict[str, str])
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a running task."""
    if task_id in active_tasks:
        active_tasks[task_id].cancel()
        try:
            await active_tasks[task_id]
        except asyncio.CancelledError:
            pass

        del active_tasks[task_id]

        # Update task status
        for i, task in enumerate(task_history):
            if task.task_id == task_id:
                task_history[i].status = "cancelled"
                break

        return {"status": "cancelled", "task_id": task_id}

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Task not found or already completed"
    )

# Example route for direct execution (for testing)
@router.post("/execute", response_model=Dict[str, Any])
async def execute_crawler(
    instructions: str = Body(..., embed=True),
    url: Optional[str] = Body(None, embed=True),
    profile_id: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user)
):
    """Execute a crawler task directly and wait for result."""
    # Check if required dependencies are available
    browser_use_available = importlib.util.find_spec("browser_use") is not None
    if not browser_use_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Required dependency not available: browser-use"
        )

    # Warn if google-generativeai is not available
    if not GOOGLE_GENAI_AVAILABLE:
        logger.warning("google.generativeai is not available. Tasks will not work properly.")
        logger.warning("Please install it with 'pip install google-generativeai'.")

    # Initialize crawler manager if needed
    if not crawler_manager.profile_manager:
        await initialize_crawler_manager()

    # Create task
    task = CrawlerTask(
        instructions=instructions,
        url=url,
        profile_id=profile_id
    )

    # Add to history
    task_history.append(task)

    # Execute task
    await execute_web_task(task)

    # Return result
    if task.task_id in task_results:
        return {
            "task_id": task.task_id,
            "success": task_results[task.task_id].success,
            "result": task_results[task.task_id].result,
            "error": task_results[task.task_id].error
        }

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Task execution failed"
    )

# Campaign management endpoints
class CampaignCreate(BaseModel):
    """Model for creating a new campaign."""
    name: str
    description: Optional[str] = None
    urls: List[str]
    profile_ids: Optional[List[str]] = None
    schedule: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class CampaignUpdate(BaseModel):
    """Model for updating a campaign."""
    name: Optional[str] = None
    description: Optional[str] = None
    urls: Optional[List[str]] = None
    profile_ids: Optional[List[str]] = None
    schedule: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

@router.post("/campaigns", response_model=Dict[str, str])
async def create_campaign(
    campaign: CampaignCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new ad engagement campaign."""
    # Initialize crawler manager with profile and proxy managers if not already done
    if not crawler_manager.profile_manager:
        await initialize_crawler_manager()
    elif not crawler_manager.scheduler_running:
        # Start the scheduler if not running
        await crawler_operations.start_scheduler()

    # Create campaign using unified operations
    campaign_id = await crawler_operations.create_campaign({
        "name": campaign.name,
        "description": campaign.description,
        "urls": campaign.urls,
        "profile_ids": campaign.profile_ids,
        "schedule": campaign.schedule,
        "parameters": campaign.parameters
    })

    if not campaign_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create campaign"
        )

    return {"campaign_id": campaign_id, "status": "created"}

@router.get("/campaigns", response_model=List[Dict[str, Any]])
async def list_campaigns(
    status: Optional[str] = Query(None, description="Filter by campaign status"),
    search: Optional[str] = Query(None, description="Search campaigns by name or description"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    current_user: User = Depends(get_current_user)
):
    """List all campaigns with enhanced filtering and search."""
    # Build filters
    filters = {}
    if status:
        filters['status'] = status
    if search:
        filters['search'] = search
    if sort_by:
        filters['sort_by'] = sort_by
        filters['sort_order'] = sort_order

    # Get campaigns using unified operations
    campaigns = await crawler_operations.list_campaigns(filters)
    return campaigns

@router.get("/campaigns/{campaign_id}", response_model=Dict[str, Any])
async def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get campaign details with enhanced metadata."""
    campaign = await crawler_operations.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    return campaign

@router.put("/campaigns/{campaign_id}", response_model=Dict[str, Any])
async def update_campaign(
    campaign_id: str,
    updates: CampaignUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a campaign with enhanced database sync."""
    # Convert model to dict, excluding None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}

    # Update using CrawlerManager directly (since crawler_operations doesn't have update_campaign yet)
    campaign = await crawler_manager.update_campaign(campaign_id, update_data)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Sync to database
    await crawler_operations.sync_campaign_to_db(campaign)

    return campaign.to_dict()

@router.delete("/campaigns/{campaign_id}", response_model=Dict[str, str])
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a campaign with database cleanup."""
    success = await crawler_operations.delete_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    return {"status": "deleted", "campaign_id": campaign_id}

@router.post("/campaigns/{campaign_id}/schedule", response_model=Dict[str, Any])
async def schedule_campaign_tasks(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """Schedule tasks for a campaign."""
    campaign = await crawler_manager.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    task_ids = await crawler_manager._schedule_campaign_tasks(campaign)

    return {
        "campaign_id": campaign_id,
        "tasks_scheduled": len(task_ids),
        "task_ids": task_ids
    }

@router.post("/campaigns/{campaign_id}/profile-schedule", response_model=Dict[str, Any])
async def configure_profile_schedule(
    campaign_id: str,
    profile_config: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Configure multiple visits per profile for a campaign."""
    campaign = await crawler_manager.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Get profile IDs and visit configuration
    profile_ids = profile_config.get("profile_ids", [])
    visits_per_day = profile_config.get("visits_per_day", 3)
    min_hours_between = profile_config.get("min_hours_between", 2)

    if not profile_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No profile IDs provided")

    # Update campaign with new profile configuration
    campaign.profile_ids = profile_ids

    # Update schedule parameters
    campaign.schedule["times_per_day"] = visits_per_day
    campaign.schedule["min_hours_between"] = min_hours_between

    # Reschedule tasks
    await crawler_manager.update_campaign(campaign_id, {"schedule": campaign.schedule})

    return {
        "campaign_id": campaign_id,
        "profiles_configured": len(profile_ids),
        "visits_per_day": visits_per_day,
        "min_hours_between": min_hours_between,
        "next_scheduled_tasks": len(campaign.task_ids)
    }

@router.get("/campaigns/{campaign_id}/metrics", response_model=Dict[str, Any])
async def get_campaign_metrics(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get campaign metrics."""
    campaign = await crawler_manager.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Get campaign metrics
    metrics = campaign.metrics

    # Calculate derived metrics
    if metrics["total_impressions"] > 0:
        metrics["ctr"] = metrics["total_clicks"] / metrics["total_impressions"]
    else:
        metrics["ctr"] = 0

    if metrics["total_clicks"] > 0:
        metrics["conversion_rate"] = metrics["total_conversions"] / metrics["total_clicks"]
    else:
        metrics["conversion_rate"] = 0

    # Calculate average time per visit
    if metrics["total_visits"] > 0:
        metrics["avg_time_per_visit"] = metrics["total_time_spent"] / metrics["total_visits"]
    else:
        metrics["avg_time_per_visit"] = 0

    # Calculate revenue estimates
    daily_visits = len(campaign.profile_ids) * campaign.schedule.get("times_per_day", 3)
    monthly_visits = daily_visits * 30
    estimated_impressions = monthly_visits * metrics.get("ad_impressions_per_visit", 4)

    # Revenue calculations
    cpm_revenue = (estimated_impressions / 1000) * 4.0  # $4 CPM for premium geos
    cpc_revenue = (estimated_impressions * 0.02 * 0.5)  # 2% CTR, $0.50 CPC

    metrics["estimated_monthly_revenue"] = {
        "monthly_visits": monthly_visits,
        "estimated_impressions": estimated_impressions,
        "cpm_revenue": round(cpm_revenue, 2),
        "cpc_revenue": round(cpc_revenue, 2),
        "total_estimated": round(cpm_revenue + cpc_revenue, 2)
    }

    return {
        "campaign_id": campaign_id,
        "name": campaign.name,
        "metrics": metrics
    }

@router.get("/health", response_model=Dict[str, Any])
async def health_check(current_user: User = Depends(get_current_user)):
    """Check the health of the crawler service."""
    browser_use_available = importlib.util.find_spec("browser_use") is not None

    # Initialize crawler manager if needed
    if not crawler_manager.profile_manager:
        try:
            await initialize_crawler_manager()
        except Exception as e:
            logger.error(f"Error initializing crawler manager: {str(e)}")
            return {
                "status": "error",
                "message": f"Error initializing crawler manager: {str(e)}",
                "dependencies": {
                    "browser_use": browser_use_available,
                    "google_generativeai": GOOGLE_GENAI_AVAILABLE
                }
            }

    # Get stats from crawler manager
    active_campaign_count = len([c for c in crawler_manager.campaigns.values() if c.status == "active"])
    scheduled_task_count = len(crawler_manager.scheduled_tasks)
    profile_count = len(crawler_manager.profile_usage)

    return {
        "status": "ok",
        "dependencies": {
            "browser_use": browser_use_available,
            "google_generativeai": GOOGLE_GENAI_AVAILABLE
        },
        "active_tasks": len(active_tasks),
        "completed_tasks": len(task_results),
        "total_tasks": len(task_history),
        "campaigns": {
            "active": active_campaign_count,
            "total": len(crawler_manager.campaigns)
        },
        "scheduled_tasks": scheduled_task_count,
        "profiles_used": profile_count,
        "scheduler_running": crawler_manager.scheduler_running
    }

# ===== ENHANCED UNIFIED CRAWLER ROUTES =====

@router.get("/enhanced/tasks", response_model=List[Dict[str, Any]])
async def list_enhanced_tasks(
    status: Optional[str] = Query(None, description="Filter by task status"),
    campaign_id: Optional[str] = Query(None, description="Filter by campaign ID"),
    profile_id: Optional[str] = Query(None, description="Filter by profile ID"),
    search: Optional[str] = Query(None, description="Search tasks by instructions or URL"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    current_user: User = Depends(get_current_user)
):
    """List all tasks with enhanced filtering, search, and database metadata."""
    # Build filters
    filters = {}
    if status:
        filters['status'] = status
    if campaign_id:
        filters['campaign_id'] = campaign_id
    if profile_id:
        filters['profile_id'] = profile_id
    if search:
        filters['search'] = search
    if sort_by:
        filters['sort_by'] = sort_by
        filters['sort_order'] = sort_order

    # Get tasks using unified operations
    tasks = await crawler_operations.list_tasks(filters)
    return tasks

@router.get("/enhanced/stats", response_model=Dict[str, Any])
async def get_enhanced_stats(
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive crawler statistics with database analytics."""
    stats = await crawler_operations.get_crawler_stats()
    return stats

@router.post("/enhanced/scheduler/start", response_model=Dict[str, str])
async def start_enhanced_scheduler(
    current_user: User = Depends(get_current_user)
):
    """Start the crawler scheduler with database sync."""
    success = await crawler_operations.start_scheduler()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start scheduler"
        )

    return {"status": "started", "scheduler_running": True}

@router.post("/enhanced/scheduler/stop", response_model=Dict[str, str])
async def stop_enhanced_scheduler(
    current_user: User = Depends(get_current_user)
):
    """Stop the crawler scheduler."""
    success = await crawler_operations.stop_scheduler()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop scheduler"
        )

    return {"status": "stopped", "scheduler_running": False}

@router.get("/enhanced/scheduler/status", response_model=Dict[str, Any])
async def get_scheduler_status(
    current_user: User = Depends(get_current_user)
):
    """Get scheduler status and statistics."""
    return {
        "scheduler_running": crawler_operations.is_scheduler_running(),
        "max_concurrent_tasks": crawler_manager.max_concurrent_tasks,
        "active_tasks": len(crawler_manager.active_tasks),
        "scheduled_tasks": len(crawler_manager.scheduled_tasks)
    }

@router.delete("/enhanced/history", response_model=Dict[str, str])
async def clear_enhanced_history(
    current_user: User = Depends(get_current_user)
):
    """Clear task execution history from both CrawlerManager and database."""
    success = await crawler_operations.clear_task_history()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear task history"
        )

    return {"status": "cleared", "message": "Task history cleared successfully"}