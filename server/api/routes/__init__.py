
from fastapi import APIRouter

# Import all routers
from .profiles import router as profiles_router
from .proxies import router as proxies_router
from .crawlers import router as crawlers_router
from .campaigns import router as campaigns_router
from .settings import router as settings_router
from .updates import router as updates_router
# from .numbers import router as numbers_router
# source_router removed - functionality moved to api/utils/device.py
# websockets_router removed - WebSocket functionality not needed for core features

# from .detection_risk import router as detection_risk_router
# from .scrapers import router as scrapers_router


# Create main API router
api_router = APIRouter(prefix="/api")

# Include all routers

api_router.include_router(profiles_router, tags=["profiles"])
api_router.include_router(proxies_router, tags=["proxies"])
api_router.include_router(crawlers_router, tags=["crawlers"])
api_router.include_router(campaigns_router, tags=["campaigns"])
api_router.include_router(settings_router, tags=["settings"])
api_router.include_router(updates_router, tags=["updates"])

# api_router.include_router(detection_risk_router, tags=["detection_risk"])
# api_router.include_router(scrapers_router, tags=["scrapers"])

