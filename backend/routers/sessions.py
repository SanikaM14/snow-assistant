from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from db.database import get_db

router = APIRouter()

@router.get("/sessions")
async def list_sessions(db=Depends(get_db)):
    try:
        cursor = await db.execute("SELECT * FROM sessions ORDER BY updated_at DESC")
        rows = await cursor.fetchall()
        return [{"id": row["id"], "title": row["title"], "updated_at": row["updated_at"]} for row in rows]
    except Exception as e:
        if "no such table: sessions" in str(e).lower():
            return []
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/sessions/{session_id}")
async def get_session_history(session_id: str, db=Depends(get_db)):
    try:
        cursor = await db.execute("SELECT role, content, created_at, image_url, intent FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
        rows = await cursor.fetchall()
        return [{"role": row["role"], "content": row["content"], "created_at": row["created_at"], "imageUrl": row["image_url"] if "image_url" in row.keys() else None, "intent": row["intent"] if "intent" in row.keys() else None} for row in rows]
    except Exception as e:
        if "no such table: messages" in str(e).lower():
            return []
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db=Depends(get_db)):
    try:
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
