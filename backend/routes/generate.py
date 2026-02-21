from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.claude_service import generate_content, regenerate_section
from models.database import save_generation, update_monthly_metrics, get_generation_by_id

router = APIRouter()


class BriefRequest(BaseModel):
    brand_name: str
    product_description: str
    target_audience: str
    tone: str
    platform: str
    goal: str
    competitor_urls: Optional[str] = ""


class RegenerateRequest(BaseModel):
    generation_id: int
    section: str


@router.post("/generate")
async def generate(brief: BriefRequest):
    try:
        brief_data = brief.model_dump()
        result, usage = await generate_content(brief_data)
        gen_id = await save_generation(brief_data, result, usage)
        await update_monthly_metrics(usage)

        return {
            "id": gen_id,
            "result": result,
            "usage": {
                "input_tokens": usage["input_tokens"],
                "output_tokens": usage["output_tokens"],
                "cache_read_tokens": usage["cache_read_input_tokens"],
                "cache_creation_tokens": usage["cache_creation_input_tokens"],
                "estimated_cost": usage["estimated_cost"],
                "cache_hit": usage["cache_read_input_tokens"] > 0,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid or missing Anthropic API key. Check your ANTHROPIC_API_KEY environment variable.")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {error_msg}")


@router.post("/regenerate")
async def regenerate(req: RegenerateRequest):
    try:
        generation = await get_generation_by_id(req.generation_id)
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")

        result, usage = await regenerate_section(
            generation["brief_data"],
            req.section,
            generation["result_data"],
        )
        await update_monthly_metrics(usage)

        return {
            "result": result,
            "usage": {
                "input_tokens": usage["input_tokens"],
                "output_tokens": usage["output_tokens"],
                "cache_read_tokens": usage["cache_read_input_tokens"],
                "cache_creation_tokens": usage["cache_creation_input_tokens"],
                "estimated_cost": usage["estimated_cost"],
                "cache_hit": usage["cache_read_input_tokens"] > 0,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")
