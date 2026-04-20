"""
routes.py
FastAPI router for Tic Tac Toe — the only file the frontend talks to.

User is injected by your auth middleware as request.state.user:
{
    "id":       "69e000f8b4ad7409cb5d7805",
    "username": "testuser",
    "email":    "test@example.com",
    ...
}
Unauthenticated requests fall back to the shared "global" Q-table.

Endpoints
---------
POST   /tictactoe/start   → start a new game session
POST   /tictactoe/move    → send board after your move, get AI's move back
POST   /tictactoe/end     → report result, trigger Q-learning update
GET    /tictactoe/stats   → how many states this user's bot has learned
DELETE /tictactoe/reset   → wipe this user's Q-table (auth required)

Board format
------------
A list of 9 values. Each element is "X", "O", or null.
  0 | 1 | 2
  ---------
  3 | 4 | 5
  ---------
  6 | 7 | 8

Human = "X"   AI = "O"
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, field_validator

from db.tictactoe import (
    apply_q_updates,
    get_q_values,
    get_q_values_bulk,
    get_states_count,
    reset_user_qtable,
    upsert_q_values,
)
from db.session import get_database, USERS_COLLECTION
from api.helper.helper import (
    AI_PLAYER,
    HUMAN_PLAYER,
    apply_move,
    available_moves,
    bellman_update,
    board_to_state,
    check_winner,
    choose_action,
    close_session,
    compute_history_updates,
    create_session,
    get_session,
    human_to_ai_result,
    push_history,
    get_sessions,
    cleanup_expired_sessions,
    get_session_count,
    get_user_active_sessions,
    cleanup_user_sessions
)

router = APIRouter(prefix="/tictactoe", tags=["Tic Tac Toe"])

GLOBAL_USER = "global"

# Q-learning hyper-parameters (tune via env or config)
EPSILON = 0.1   # exploration rate
ALPHA   = 0.1   # learning rate
GAMMA   = 0.95  # discount factor


# ─────────────────────────────────────────────────────────────────────────────
# Dependency — db + user_id
# ─────────────────────────────────────────────────────────────────────────────

async def get_db(request: Request) -> AsyncIOMotorDatabase:
    return await get_database()


async def resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if user is not None and "error" not in user:
        return str(user["username"])
        # # If we have the user ID directly, use it
        # if "id" in user:
        #     return str(user["id"])
        # elif "_id" in user:  # MongoDB uses '_id'
        #     return str(user["_id"])
        # elif "sub" in user:  # JWT token uses 'sub' for email, need to get user ID from database
        #     try:
        #         db = await get_db(request)
        #         user_doc = await db[USERS_COLLECTION].find_one({"email": user["sub"]})
        #         if user_doc:
        #             return str(user_doc["_id"])
        #         else:
        #             return str(user["sub"])  # Fallback to email if user not found
        #     except Exception:
        #         return str(user["sub"])  # Fallback to email if database error
        # elif "email" in user:  # Fallback to email
        #     return str(user["email"])
    return GLOBAL_USER


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class StartResponse(BaseModel):
    session_id: str
    board: list
    turn: str  # "X" for human starts, "O" for AI starts
    message: str


class MoveRequest(BaseModel):
    session_id: str
    board: list     # 9-element list after the human's move

    @field_validator("board")
    @classmethod
    def validate_board(cls, v: list) -> list:
        if len(v) != 9:
            raise ValueError("Board must have exactly 9 cells.")
        if any(c not in (None, "X", "O") for c in v):
            raise ValueError("Each cell must be 'X', 'O', or null.")
        return v


class MoveResponse(BaseModel):
    ai_move:   int           # index AI chose  (-1 when game was already over)
    board:     list          # board after AI's move
    game_over: bool
    winner:    str | None    # "X" | "O" | "draw" | null
    result:    str | None    # "ai_win" | "ai_loss" | "draw" | null (AI perspective)


class EndRequest(BaseModel):
    session_id: str
    result:     str          # "win" | "loss" | "draw"  — from the human's POV

    @field_validator("result")
    @classmethod
    def validate_result(cls, v: str) -> str:
        if v not in {"win", "loss", "draw"}:
            raise ValueError("result must be 'win', 'loss', or 'draw'.")
        return v


class EndResponse(BaseModel):
    message:        str
    ai_result:      str      # "ai_win" | "ai_loss" | "draw"
    states_updated: int


class StatsResponse(BaseModel):
    user_id:        str
    states_learned: int


# ─────────────────────────────────────────────────────────────────────────────
# POST /tictactoe/
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/")
async def tictactoe_root(request : Request):
    return request.state.user
# ─────────────────────────────────────────────────────────────────────────────
# POST /tictactoe/start user_id
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/start", response_model=StartResponse)
async def start_game(request: Request, first_player: str = Query(default="X")):
    """
    Create a new game session.
    Authenticated users train their own bot; guests use the global bot.
    
    Query parameter:
    - first_player: "X" (human starts) or "O" (AI starts)
    """
    user_id    = await resolve_user_id(request)
    print("User ID used to create session:", user_id)
    session_id = create_session(user_id)

    label = f"your personal bot" if user_id != GLOBAL_USER else "the global bot"
    
    # Validate first_player parameter
    if first_player not in [HUMAN_PLAYER, AI_PLAYER]:
        first_player = HUMAN_PLAYER  # Default to human starting
    
    starting_turn = first_player
    
    return StartResponse(
        session_id=session_id,
        board=[None] * 9,
        turn=starting_turn,
        message=f"Game started. {starting_turn} goes first. You are '{HUMAN_PLAYER}', AI is '{AI_PLAYER}'. Learning as {label}.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /tictactoe/move
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/move", response_model=MoveResponse)
async def make_move(body: MoveRequest, request: Request):
    """
    Receive the board after the human's move, return the AI's move.

    Steps:
    1. Check if the human just won.
    2. Look up (or initialise) Q-values for the current board state.
    3. Pick AI move via ε-greedy.
    4. Apply AI move and record (state, move, next_state) in session history.
    5. If game ends on AI's move, auto-run Q-update so /end is optional.
    """
    all_sessions = get_sessions()
    print("All sessions:", list(all_sessions.keys()))
    db      = await get_db(request)
    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Call /tictactoe/start first.")

    user_id = session["user_id"]
    board   = body.board

    # ── Did the human already end the game? ──────────────────────────────────
    winner = check_winner(board)
    if winner:
        ai_result = "ai_loss" if winner != "draw" else "draw"
        await _run_q_update(db, user_id, session["history"], ai_result)
        close_session(body.session_id)
        return MoveResponse(ai_move=-1, board=board, game_over=True, winner=winner, result=ai_result)

    # ── Fetch / initialise Q-values for the current state ────────────────────
    state    = board_to_state(board)
    print("State:", state)

    moves    = available_moves(board)
    print("Available moves:", moves)
    q_values = await get_q_values(db, user_id, state)
    print("Q-values:", q_values)

    if not q_values:
        # First time we've seen this board — initialise all valid moves to 0.0
        q_values = {str(m): 0.0 for m in moves}
        await upsert_q_values(db, user_id, state, q_values)

    # ── AI picks its move ─────────────────────────────────────────────────────
    ai_move     = choose_action(q_values, moves, epsilon=EPSILON)
    board_after = apply_move(board, ai_move, AI_PLAYER)
    next_state  = board_to_state(board_after)

    # ── Record in session history ─────────────────────────────────────────────
    push_history(body.session_id, state, ai_move, next_state)

    # ── Check if AI just ended the game ──────────────────────────────────────
    winner_after = check_winner(board_after)
    game_over    = winner_after is not None
    ai_result    = None

    if game_over:
        ai_result = "ai_win" if winner_after == AI_PLAYER else "draw"
        session   = get_session(body.session_id)  # re-fetch (history updated)
        await _run_q_update(db, user_id, session["history"], ai_result)
        close_session(body.session_id)

    return MoveResponse(
        ai_move=ai_move,
        board=board_after,
        game_over=game_over,
        winner=winner_after,
        result=ai_result,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /tictactoe/end
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/end", response_model=EndResponse)
async def end_game(body: EndRequest, request: Request):
    """
    Report the game result and trigger Q-learning.
    Call this when the human wins — /move can't detect that automatically.
    result is from the human's POV: 'win' | 'loss' | 'draw'
    """
    db      = await get_db(request)
    session = close_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already closed.")

    ai_result = human_to_ai_result(body.result)
    updated   = await _run_q_update(db, session["user_id"], session["history"], ai_result)

    return EndResponse(
        message=f"Q-values updated for {updated} state(s).",
        ai_result=ai_result,
        states_updated=updated,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /tictactoe/stats
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request):
    """Return how many unique board states this user's bot has learned."""
    db      = await get_db(request)
    user_id = await resolve_user_id(request)
    count   = await get_states_count(db, user_id)
    return StatsResponse(user_id=user_id, states_learned=count)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /tictactoe/reset
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/reset")
async def reset_qtable(request: Request):
    """
    Permanently delete this user's entire Q-table.
    Guests cannot reset the global bot.
    """
    user_id = await resolve_user_id(request)
    if user_id == GLOBAL_USER:
        raise HTTPException(status_code=403, detail="Guests cannot reset the global bot. Please log in.")

    db      = await get_db(request)
    deleted = await reset_user_qtable(db, user_id)
    return {"message": "Q-table cleared.", "states_deleted": deleted}


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /tictactoe/cleanup
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/cleanup")
async def cleanup_sessions(request: Request, max_age: int = Query(default=3600)):
    """
    Clean up expired sessions.
    Query parameter:
    - max_age: Maximum age in seconds (default: 3600 = 1 hour)
    """
    cleaned_count = cleanup_expired_sessions(max_age)
    return {
        "message": f"Cleaned up {cleaned_count} expired session(s).",
        "sessions_cleaned": cleaned_count,
        "max_age_seconds": max_age
    }


@router.delete("/cleanup/user")
async def cleanup_user_sessions_endpoint(request: Request):
    """
    Clean up all sessions for the current user.
    This is useful when user leaves the game or logs out.
    """
    user_id = await resolve_user_id(request)
    if user_id == GLOBAL_USER:
        raise HTTPException(status_code=403, detail="Guest sessions are automatically cleaned up by timeout.")
    
    cleaned_count = cleanup_user_sessions(user_id)
    return {
        "message": f"Cleaned up {cleaned_count} session(s) for user {user_id}.",
        "sessions_cleaned": cleaned_count,
        "user_id": user_id
    }


@router.get("/sessions")
async def get_session_info(request: Request):
    """
    Get information about current active sessions.
    Useful for monitoring and debugging.
    """
    user_id = await resolve_user_id(request)
    total_sessions = get_session_count()
    user_sessions = get_user_active_sessions(user_id) if user_id != GLOBAL_USER else []
    
    return {
        "total_active_sessions": total_sessions,
        "user_sessions": user_sessions,
        "user_session_count": len(user_sessions),
        "user_id": user_id
    }


# ─────────────────────────────────────────────────────────────────────────────
# Internal helper
# ─────────────────────────────────────────────────────────────────────────────

async def _run_q_update(
    db:      AsyncIOMotorDatabase,
    user_id: str,
    history: list,
    result:  str,
) -> int:
    """Fetch all states in history, compute Bellman updates, persist them."""
    if not history:
        return 0

    # Collect every unique state that appears in the history
    all_states = list({s for s, _, ns in history} | {ns for _, _, ns in history})

    # Single bulk fetch — one DB round-trip for all states
    q_lookup = await get_q_values_bulk(db, user_id, all_states)

    # Pure computation — no DB calls inside
    updates = compute_history_updates(history, q_lookup, result, ALPHA, GAMMA)

    # Persist all updates
    return await apply_q_updates(db, user_id, updates)