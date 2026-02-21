import aiosqlite
import json
import os
from datetime import datetime, timezone

DB_PATH = os.getenv("DATABASE_PATH", "data/content_factory.db")


async def get_db():
    os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    db = await get_db()
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_name TEXT NOT NULL,
                brief_data TEXT NOT NULL,
                result_data TEXT,
                platform TEXT NOT NULL,
                tone TEXT NOT NULL,
                goal TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                cache_read_tokens INTEGER DEFAULT 0,
                cache_creation_tokens INTEGER DEFAULT 0,
                estimated_cost REAL DEFAULT 0.0,
                created_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_requests INTEGER DEFAULT 0,
                total_input_tokens INTEGER DEFAULT 0,
                total_output_tokens INTEGER DEFAULT 0,
                total_cache_read_tokens INTEGER DEFAULT 0,
                total_cache_creation_tokens INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0.0,
                month TEXT NOT NULL UNIQUE
            )
        """)
        await db.commit()
    finally:
        await db.close()


async def save_generation(brief_data: dict, result_data: dict, usage: dict) -> int:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO generations
               (brand_name, brief_data, result_data, platform, tone, goal, status,
                input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
                estimated_cost, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                brief_data["brand_name"],
                json.dumps(brief_data),
                json.dumps(result_data),
                brief_data["platform"],
                brief_data["tone"],
                brief_data["goal"],
                "completed",
                usage.get("input_tokens", 0),
                usage.get("output_tokens", 0),
                usage.get("cache_read_input_tokens", 0),
                usage.get("cache_creation_input_tokens", 0),
                usage.get("estimated_cost", 0.0),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        await db.commit()
        return cursor.lastrowid
    finally:
        await db.close()


async def get_all_generations():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM generations ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            results.append({
                "id": row["id"],
                "brand_name": row["brand_name"],
                "brief_data": json.loads(row["brief_data"]),
                "result_data": json.loads(row["result_data"]) if row["result_data"] else None,
                "platform": row["platform"],
                "tone": row["tone"],
                "goal": row["goal"],
                "status": row["status"],
                "input_tokens": row["input_tokens"],
                "output_tokens": row["output_tokens"],
                "cache_read_tokens": row["cache_read_tokens"],
                "cache_creation_tokens": row["cache_creation_tokens"],
                "estimated_cost": row["estimated_cost"],
                "created_at": row["created_at"],
            })
        return results
    finally:
        await db.close()


async def get_generation_by_id(gen_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM generations WHERE id = ?", (gen_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "brand_name": row["brand_name"],
            "brief_data": json.loads(row["brief_data"]),
            "result_data": json.loads(row["result_data"]) if row["result_data"] else None,
            "platform": row["platform"],
            "tone": row["tone"],
            "goal": row["goal"],
            "status": row["status"],
            "input_tokens": row["input_tokens"],
            "output_tokens": row["output_tokens"],
            "cache_read_tokens": row["cache_read_tokens"],
            "cache_creation_tokens": row["cache_creation_tokens"],
            "estimated_cost": row["estimated_cost"],
            "created_at": row["created_at"],
        }
    finally:
        await db.close()


async def delete_generation(gen_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM generations WHERE id = ?", (gen_id,))
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def update_monthly_metrics(usage: dict):
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM metrics WHERE month = ?", (month,))
        row = await cursor.fetchone()
        if row:
            await db.execute(
                """UPDATE metrics SET
                   total_requests = total_requests + 1,
                   total_input_tokens = total_input_tokens + ?,
                   total_output_tokens = total_output_tokens + ?,
                   total_cache_read_tokens = total_cache_read_tokens + ?,
                   total_cache_creation_tokens = total_cache_creation_tokens + ?,
                   total_cost = total_cost + ?
                   WHERE month = ?""",
                (
                    usage.get("input_tokens", 0),
                    usage.get("output_tokens", 0),
                    usage.get("cache_read_input_tokens", 0),
                    usage.get("cache_creation_input_tokens", 0),
                    usage.get("estimated_cost", 0.0),
                    month,
                ),
            )
        else:
            await db.execute(
                """INSERT INTO metrics
                   (total_requests, total_input_tokens, total_output_tokens,
                    total_cache_read_tokens, total_cache_creation_tokens, total_cost, month)
                   VALUES (1, ?, ?, ?, ?, ?, ?)""",
                (
                    usage.get("input_tokens", 0),
                    usage.get("output_tokens", 0),
                    usage.get("cache_read_input_tokens", 0),
                    usage.get("cache_creation_input_tokens", 0),
                    usage.get("estimated_cost", 0.0),
                    month,
                ),
            )
        await db.commit()
    finally:
        await db.close()


async def get_metrics():
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM metrics WHERE month = ?", (month,))
        row = await cursor.fetchone()
        if not row:
            return {
                "total_requests": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cache_read_tokens": 0,
                "total_cache_creation_tokens": 0,
                "total_cost": 0.0,
                "cache_hit_rate": 0.0,
                "avg_tokens_per_request": 0,
                "avg_cost_per_request": 0.0,
                "month": month,
            }
        total_requests = row["total_requests"]
        total_input = row["total_input_tokens"] + row["total_cache_read_tokens"] + row["total_cache_creation_tokens"]
        cache_hit_rate = (row["total_cache_read_tokens"] / total_input * 100) if total_input > 0 else 0
        return {
            "total_requests": total_requests,
            "total_input_tokens": row["total_input_tokens"],
            "total_output_tokens": row["total_output_tokens"],
            "total_cache_read_tokens": row["total_cache_read_tokens"],
            "total_cache_creation_tokens": row["total_cache_creation_tokens"],
            "total_cost": round(row["total_cost"], 4),
            "cache_hit_rate": round(cache_hit_rate, 1),
            "avg_tokens_per_request": round(
                (row["total_input_tokens"] + row["total_output_tokens"]) / total_requests
            ) if total_requests > 0 else 0,
            "avg_cost_per_request": round(
                row["total_cost"] / total_requests, 4
            ) if total_requests > 0 else 0.0,
            "month": month,
        }
    finally:
        await db.close()
