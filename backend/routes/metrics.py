from fastapi import APIRouter, HTTPException
from models.database import get_metrics

router = APIRouter()


@router.get("/metrics")
async def get_usage_metrics():
    try:
        metrics = await get_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")
