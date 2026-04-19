"""
db.py
All MongoDB operations for the Tic Tac Toe Q-table.

Collection: tictactoe
Document shape:
{
    _id        : ObjectId,
    user_id    : str,          # user ObjectId string  OR  "global"
    state      : str,          # 9-char board  e.g. "XO_X_____"
    q_values   : {             # only valid move indices present
        "0": 0.0,
        "4": 0.12,
        ...
    },
    created_at : datetime,
    updated_at : datetime,
}

Unique index on { user_id, state }  (created at startup).
"""

from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, IndexModel, ReturnDocument


# ─────────────────────────────────────────────────────────────────────────────
# Index bootstrap  (call once at app startup)
# ─────────────────────────────────────────────────────────────────────────────

async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.tictactoe.create_indexes([
        IndexModel(
            [("user_id", ASCENDING), ("state", ASCENDING)],
            unique=True,
            name="uq_user_state",
        ),
        IndexModel([("user_id", ASCENDING)], name="idx_user_id"),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Read
# ─────────────────────────────────────────────────────────────────────────────

async def get_q_values(
    db: AsyncIOMotorDatabase,
    user_id: str,
    state: str,
) -> dict[str, float]:
    """
    Return the Q-values dict for (user_id, state).
    Returns {} if the state has never been seen before.
    """
    doc = await db.tictactoe.find_one(
        {"user_id": user_id, "state": state},
        {"q_values": 1},
    )
    if not doc:
        return {}
    return {k: float(v) for k, v in doc["q_values"].items()}


async def get_q_values_bulk(
    db: AsyncIOMotorDatabase,
    user_id: str,
    states: list[str],
) -> dict[str, dict[str, float]]:
    """
    Fetch Q-values for multiple states in one query.
    Returns { state: { move_str: q_float } }
    """
    if not states:
        return {}

    cursor = db.tictactoe.find(
        {"user_id": user_id, "state": {"$in": states}},
        {"state": 1, "q_values": 1},
    )
    result: dict[str, dict[str, float]] = {}
    async for doc in cursor:
        result[doc["state"]] = {k: float(v) for k, v in doc["q_values"].items()}
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Write — single state
# ─────────────────────────────────────────────────────────────────────────────

async def upsert_q_values(
    db: AsyncIOMotorDatabase,
    user_id: str,
    state: str,
    q_values: dict[str, float],
) -> None:
    """
    Insert or fully replace the q_values map for (user_id, state).
    Used when initialising a brand-new state with all moves = 0.0.
    """
    now = datetime.now(timezone.utc)
    await db.tictactoe.update_one(
        {"user_id": user_id, "state": state},
        {
            "$set":         {"q_values": q_values, "updated_at": now},
            "$setOnInsert": {"user_id": user_id, "state": state, "created_at": now},
        },
        upsert=True,
    )


async def update_single_q(
    db: AsyncIOMotorDatabase,
    user_id: str,
    state: str,
    move: int,
    new_value: float,
) -> None:
    """
    Update exactly one Q-value entry Q(state, move) = new_value.
    Uses $set so only that field is touched — no race-condition full overwrites.
    """
    now = datetime.now(timezone.utc)
    await db.tictactoe.update_one(
        {"user_id": user_id, "state": state},
        {
            "$set": {
                f"q_values.{move}": round(new_value, 6),
                "updated_at": now,
            }
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# Write — bulk Q-update after a game ends
# ─────────────────────────────────────────────────────────────────────────────

async def apply_q_updates(
    db: AsyncIOMotorDatabase,
    user_id: str,
    updates: dict[tuple, float],
    # updates = { (state, move_int): new_q_float }
) -> int:
    """
    Persist all (state, move) → new_q pairs computed after a game.
    Each pair is a targeted $set update so concurrent writes are safe.
    Returns the number of documents updated.
    """
    if not updates:
        return 0

    now = datetime.now(timezone.utc)
    count = 0
    for (state, move), new_q in updates.items():
        result = await db.tictactoe.update_one(
            {"user_id": user_id, "state": state},
            {"$set": {f"q_values.{move}": round(new_q, 6), "updated_at": now}},
        )
        if result.matched_count:
            count += 1
    return count


# ─────────────────────────────────────────────────────────────────────────────
# Stats & maintenance
# ─────────────────────────────────────────────────────────────────────────────

async def get_states_count(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> int:
    return await db.tictactoe.count_documents({"user_id": user_id})


async def reset_user_qtable(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> int:
    """Delete all Q-state documents for this user. Returns deleted count."""
    result = await db.tictactoe.delete_many({"user_id": user_id})

    # Reset the games.states_count counter on the user document
    try:
        await db.users.update_one(
            {"_id": ObjectId(user_id), "games.game_name": "tic_tac_toe"},
            {"$set": {"games.$.states_count": 0}},
        )
    except Exception:
        pass  # user_id may be "global" or not an ObjectId

    return result.deleted_count