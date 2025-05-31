from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
import asyncio
import uuid
import logging
import random

# Import campaigns manager
from core.campaigns_manager import (
    campaigns_manager,
    Campaign,
    VisitFrequency,
    EngagementLevel,
    AdInteraction,
    CampaignStatus,
    BehavioralPattern,
    TimeOfDay
)

# Import profile manager for profile validation
from core.profile_manager import profile_manager

# Import auth for user validation
from security.auth import get_current_user, User

# Configure router
router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for request/response validation
class ActiveHoursConfig(BaseModel):
    monday: Optional[List[List[int]]] = None
    tuesday: Optional[List[List[int]]] = None
    wednesday: Optional[List[List[int]]] = None
    thursday: Optional[List[List[int]]] = None
    friday: Optional[List[List[int]]] = None
    saturday: Optional[List[List[int]]] = None
    sunday: Optional[List[List[int]]] = None

class CustomFrequencyConfig(BaseModel):
    visits_per_day: int = Field(3, description="Number of visits per day", ge=1, le=20)
    min_hours_between: int = Field(2, description="Minimum hours between visits", ge=1, le=12)
    max_visits_per_week: Optional[int] = Field(None, description="Maximum visits per week")

class CustomEngagementConfig(BaseModel):
    scroll_depth: Optional[float] = Field(None, description="How far down the page to scroll (0.0-1.0)", ge=0.0, le=1.0)
    read_time: Optional[int] = Field(None, description="Base time to spend on page in seconds", ge=5, le=300)
    click_probability: Optional[float] = Field(None, description="Probability of clicking non-ad elements", ge=0.0, le=1.0)
    max_clicks: Optional[int] = Field(None, description="Maximum number of non-ad clicks", ge=0, le=10)
    max_pages: Optional[int] = Field(None, description="Maximum number of pages to visit", ge=1, le=10)

class CustomInteractionConfig(BaseModel):
    click_probability: Optional[float] = Field(None, description="Probability of clicking an ad", ge=0.0, le=1.0)
    view_time: Optional[int] = Field(None, description="Time to view ad before clicking (seconds)", ge=1, le=10)
    max_clicks: Optional[int] = Field(None, description="Maximum number of ad clicks", ge=0, le=5)
    preferred_categories: Optional[List[str]] = Field(None, description="Preferred ad categories")

class CampaignCreate(BaseModel):
    name: str = Field(..., description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    urls: List[str] = Field(..., description="Target URLs")
    profile_ids: List[str] = Field(..., description="Profile IDs to use")

    visit_frequency: VisitFrequency = Field(VisitFrequency.MEDIUM, description="Visit frequency")
    custom_frequency: Optional[CustomFrequencyConfig] = Field(None, description="Custom frequency configuration")

    engagement_level: EngagementLevel = Field(EngagementLevel.MODERATE, description="Engagement level")
    custom_engagement: Optional[CustomEngagementConfig] = Field(None, description="Custom engagement configuration")

    ad_interaction: AdInteraction = Field(AdInteraction.OCCASIONAL, description="Ad interaction level")
    custom_interaction: Optional[CustomInteractionConfig] = Field(None, description="Custom interaction configuration")

    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")
    active_hours: Optional[ActiveHoursConfig] = Field(None, description="Active hours configuration")

    behavioral_evolution: bool = Field(True, description="Enable behavioral evolution")
    device_rotation: bool = Field(False, description="Enable device rotation")
    geo_distribution: bool = Field(True, description="Enable geo distribution")

    @validator('profile_ids')
    def validate_profile_ids(cls, v):
        if not v:
            raise ValueError("At least one profile ID is required")
        return v

    @validator('urls')
    def validate_urls(cls, v):
        if not v:
            raise ValueError("At least one URL is required")
        for url in v:
            if not url.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid URL: {url}. URLs must start with http:// or https://")
        return v

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    urls: Optional[List[str]] = Field(None, description="Target URLs")
    profile_ids: Optional[List[str]] = Field(None, description="Profile IDs to use")

    visit_frequency: Optional[VisitFrequency] = Field(None, description="Visit frequency")
    custom_frequency: Optional[CustomFrequencyConfig] = Field(None, description="Custom frequency configuration")

    engagement_level: Optional[EngagementLevel] = Field(None, description="Engagement level")
    custom_engagement: Optional[CustomEngagementConfig] = Field(None, description="Custom engagement configuration")

    ad_interaction: Optional[AdInteraction] = Field(None, description="Ad interaction level")
    custom_interaction: Optional[CustomInteractionConfig] = Field(None, description="Custom interaction configuration")

    start_date: Optional[datetime] = Field(None, description="Campaign start date")
    end_date: Optional[datetime] = Field(None, description="Campaign end date")
    active_hours: Optional[ActiveHoursConfig] = Field(None, description="Active hours configuration")

    behavioral_evolution: Optional[bool] = Field(None, description="Enable behavioral evolution")
    device_rotation: Optional[bool] = Field(None, description="Enable device rotation")
    geo_distribution: Optional[bool] = Field(None, description="Enable geo distribution")

    @validator('urls')
    def validate_urls(cls, v):
        if v is not None:
            if not v:
                raise ValueError("At least one URL is required")
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError(f"Invalid URL: {url}. URLs must start with http:// or https://")
        return v

class CampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: CampaignStatus
    created_at: datetime
    updated_at: datetime

    urls: List[str]
    profile_ids: List[str]

    visit_frequency: VisitFrequency
    custom_frequency: Optional[Dict[str, Any]] = None

    engagement_level: EngagementLevel
    custom_engagement: Optional[Dict[str, Any]] = None

    ad_interaction: AdInteraction
    custom_interaction: Optional[Dict[str, Any]] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    behavioral_evolution: bool
    device_rotation: bool
    geo_distribution: bool

    total_visits: int = 0
    total_impressions: int = 0
    total_clicks: int = 0
    estimated_revenue: float = 0.0

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

    @classmethod
    def from_campaign(cls, campaign: Campaign) -> 'CampaignResponse':
        """Convert Campaign to CampaignResponse"""
        return cls(
            id=campaign.id,
            name=campaign.name,
            description=campaign.description,
            status=campaign.status,
            created_at=campaign.created_at,
            updated_at=campaign.updated_at,
            urls=campaign.urls,
            profile_ids=campaign.profile_ids,
            visit_frequency=campaign.visit_frequency,
            custom_frequency=campaign.custom_frequency,
            engagement_level=campaign.engagement_level,
            custom_engagement=campaign.custom_engagement,
            ad_interaction=campaign.ad_interaction,
            custom_interaction=campaign.custom_interaction,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            behavioral_evolution=campaign.behavioral_evolution,
            device_rotation=campaign.device_rotation,
            geo_distribution=campaign.geo_distribution,
            total_visits=campaign.total_visits,
            total_impressions=campaign.total_impressions,
            total_clicks=campaign.total_clicks,
            estimated_revenue=campaign.estimated_revenue
        )

class CampaignStatsResponse(BaseModel):
    id: str
    name: str
    status: CampaignStatus
    total_visits: int
    total_impressions: int
    total_clicks: int
    estimated_revenue: float
    click_through_rate: float
    profiles_count: int
    urls_count: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @classmethod
    def from_campaign(cls, campaign: Campaign) -> 'CampaignStatsResponse':
        """Create stats response from campaign"""
        ctr = 0.0
        if campaign.total_impressions > 0:
            ctr = campaign.total_clicks / campaign.total_impressions

        return cls(
            id=campaign.id,
            name=campaign.name,
            status=campaign.status,
            total_visits=campaign.total_visits,
            total_impressions=campaign.total_impressions,
            total_clicks=campaign.total_clicks,
            estimated_revenue=campaign.estimated_revenue,
            click_through_rate=ctr,
            profiles_count=len(campaign.profile_ids),
            urls_count=len(campaign.urls),
            start_date=campaign.start_date,
            end_date=campaign.end_date
        )

# API Routes

@router.get("/all-stats", response_model=Dict[str, Any])
async def get_campaigns_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get overall campaigns statistics
    """
    try:
        # Get all campaigns
        campaigns = await campaigns_manager.list_campaigns()

        # Calculate overall stats
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.status == CampaignStatus.ACTIVE])
        total_visits = sum(c.total_visits for c in campaigns)
        total_impressions = sum(c.total_impressions for c in campaigns)
        total_clicks = sum(c.total_clicks for c in campaigns)
        total_revenue = sum(c.estimated_revenue for c in campaigns)

        # Calculate CTR
        ctr = 0.0
        if total_impressions > 0:
            ctr = total_clicks / total_impressions

        # Get unique profiles and URLs
        unique_profiles = set()
        unique_urls = set()

        for campaign in campaigns:
            unique_profiles.update(campaign.profile_ids)
            unique_urls.update(campaign.urls)

        return {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_visits": total_visits,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_revenue": total_revenue,
            "click_through_rate": ctr,
            "unique_profiles_count": len(unique_profiles),
            "unique_urls_count": len(unique_urls),
            "scheduler_running": campaigns_manager.scheduler_running
        }
    except Exception as e:
        logging.error(f"Error getting campaigns stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get campaigns stats: {str(e)}")

@router.post("/scheduler/start", response_model=Dict[str, Any])
async def start_scheduler(
    current_user: User = Depends(get_current_user)
):
    """
    Start the campaigns scheduler
    """
    try:
        await campaigns_manager.start_scheduler()

        return {
            "success": True,
            "message": "Campaigns scheduler started",
            "scheduler_running": campaigns_manager.scheduler_running
        }
    except Exception as e:
        logging.error(f"Error starting scheduler: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start scheduler: {str(e)}")

@router.post("/scheduler/stop", response_model=Dict[str, Any])
async def stop_scheduler(
    current_user: User = Depends(get_current_user)
):
    """
    Stop the campaigns scheduler
    """
    try:
        await campaigns_manager.stop_scheduler()

        return {
            "success": True,
            "message": "Campaigns scheduler stopped",
            "scheduler_running": campaigns_manager.scheduler_running
        }
    except Exception as e:
        logging.error(f"Error stopping scheduler: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop scheduler: {str(e)}")

@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
    status: Optional[CampaignStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """
    List all campaigns

    Optionally filter by status
    """
    try:
        campaigns = await campaigns_manager.list_campaigns()

        # Filter by status if provided
        if status:
            campaigns = [c for c in campaigns if c.status == status]

        return [CampaignResponse.from_campaign(campaign) for campaign in campaigns]
    except Exception as e:
        logging.error(f"Error listing campaigns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list campaigns: {str(e)}")

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific campaign by ID
    """
    try:
        campaign = await campaigns_manager.get_campaign(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        return CampaignResponse.from_campaign(campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error retrieving campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign: {str(e)}")

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign: CampaignCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new campaign

    This endpoint creates a new campaign for generating ad revenue through
    realistic browsing patterns and engagement.
    """
    try:
        # Validate profiles
        for profile_id in campaign.profile_ids:
            profile = await profile_manager.get_profile(profile_id)
            if not profile:
                raise HTTPException(
                    status_code=400,
                    detail=f"Profile with ID {profile_id} not found"
                )

        # Convert active hours if provided
        active_hours = None
        if campaign.active_hours:
            active_hours = {}
            for day, hours in campaign.active_hours.dict(exclude_none=True).items():
                if hours:
                    active_hours[day] = hours

        # Prepare campaign data
        campaign_data = {
            "name": campaign.name,
            "description": campaign.description,
            "urls": campaign.urls,
            "profile_ids": campaign.profile_ids,
            "visit_frequency": campaign.visit_frequency,
            "engagement_level": campaign.engagement_level,
            "ad_interaction": campaign.ad_interaction,
            "start_date": campaign.start_date,
            "end_date": campaign.end_date,
            "active_hours": active_hours,
            "behavioral_evolution": campaign.behavioral_evolution,
            "device_rotation": campaign.device_rotation,
            "geo_distribution": campaign.geo_distribution,
        }

        # Add custom configurations if provided
        if campaign.custom_frequency:
            campaign_data["custom_frequency"] = campaign.custom_frequency.dict(exclude_none=True)
            campaign_data["visit_frequency"] = VisitFrequency.CUSTOM

        if campaign.custom_engagement:
            campaign_data["custom_engagement"] = campaign.custom_engagement.dict(exclude_none=True)
            campaign_data["engagement_level"] = EngagementLevel.CUSTOM

        if campaign.custom_interaction:
            campaign_data["custom_interaction"] = campaign.custom_interaction.dict(exclude_none=True)
            campaign_data["ad_interaction"] = AdInteraction.CUSTOM

        # Create the campaign
        campaign_id = await campaigns_manager.create_campaign(campaign_data)

        # Get the created campaign
        created_campaign = await campaigns_manager.get_campaign(campaign_id)

        return CampaignResponse.from_campaign(created_campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {str(e)}")

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    campaign_update: CampaignUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing campaign
    """
    try:
        # Check if campaign exists
        existing_campaign = await campaigns_manager.get_campaign(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        # Validate profiles if provided
        if campaign_update.profile_ids:
            for profile_id in campaign_update.profile_ids:
                profile = await profile_manager.get_profile(profile_id)
                if not profile:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Profile with ID {profile_id} not found"
                    )

        # Convert active hours if provided
        active_hours = None
        if campaign_update.active_hours:
            active_hours = {}
            for day, hours in campaign_update.active_hours.dict(exclude_none=True).items():
                if hours:
                    active_hours[day] = hours

        # Prepare updates
        updates = {}

        # Add fields that are not None
        for field, value in campaign_update.dict(exclude_none=True).items():
            if field != "active_hours":  # Handle active_hours separately
                updates[field] = value

        # Add active hours if provided
        if active_hours is not None:
            updates["active_hours"] = active_hours

        # Handle custom configurations
        if campaign_update.custom_frequency:
            updates["custom_frequency"] = campaign_update.custom_frequency.dict(exclude_none=True)
            updates["visit_frequency"] = VisitFrequency.CUSTOM

        if campaign_update.custom_engagement:
            updates["custom_engagement"] = campaign_update.custom_engagement.dict(exclude_none=True)
            updates["engagement_level"] = EngagementLevel.CUSTOM

        if campaign_update.custom_interaction:
            updates["custom_interaction"] = campaign_update.custom_interaction.dict(exclude_none=True)
            updates["ad_interaction"] = AdInteraction.CUSTOM

        # Update the campaign
        updated_campaign = await campaigns_manager.update_campaign(campaign_id, updates)

        if not updated_campaign:
            raise HTTPException(status_code=500, detail="Failed to update campaign")

        return CampaignResponse.from_campaign(updated_campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update campaign: {str(e)}")

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a campaign
    """
    try:
        # Check if campaign exists
        existing_campaign = await campaigns_manager.get_campaign(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        # Delete the campaign
        success = await campaigns_manager.delete_campaign(campaign_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete campaign")

        return None
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign: {str(e)}")

@router.post("/{campaign_id}/start", response_model=CampaignResponse)
async def start_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Start a campaign

    This will activate the campaign and begin scheduling visits.
    """
    try:
        # Check if campaign exists
        existing_campaign = await campaigns_manager.get_campaign(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        # Start the campaign
        success = await campaigns_manager.start_campaign(campaign_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to start campaign")

        # Get updated campaign
        updated_campaign = await campaigns_manager.get_campaign(campaign_id)

        return CampaignResponse.from_campaign(updated_campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error starting campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start campaign: {str(e)}")

@router.post("/{campaign_id}/pause", response_model=CampaignResponse)
async def pause_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Pause a campaign

    This will pause the campaign and stop scheduling new visits.
    """
    try:
        # Check if campaign exists
        existing_campaign = await campaigns_manager.get_campaign(campaign_id)
        if not existing_campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        # Pause the campaign
        success = await campaigns_manager.pause_campaign(campaign_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to pause campaign")

        # Get updated campaign
        updated_campaign = await campaigns_manager.get_campaign(campaign_id)

        return CampaignResponse.from_campaign(updated_campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error pausing campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to pause campaign: {str(e)}")

@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
async def get_campaign_stats(
    campaign_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for a campaign
    """
    try:
        # Get campaign
        campaign = await campaigns_manager.get_campaign(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign with ID {campaign_id} not found")

        # Return stats
        return CampaignStatsResponse.from_campaign(campaign)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting campaign stats for {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get campaign stats: {str(e)}")

