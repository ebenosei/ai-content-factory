from fastapi import APIRouter, HTTPException
from models.database import get_all_generations, get_generation_by_id, delete_generation

router = APIRouter()


@router.get("/history")
async def list_history():
    try:
        generations = await get_all_generations()
        return {"generations": generations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.get("/history/{gen_id}")
async def get_history_item(gen_id: int):
    try:
        generation = await get_generation_by_id(gen_id)
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        return generation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch generation: {str(e)}")


@router.delete("/history/{gen_id}")
async def delete_history_item(gen_id: int):
    try:
        deleted = await delete_generation(gen_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Generation not found")
        return {"message": "Generation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete generation: {str(e)}")
