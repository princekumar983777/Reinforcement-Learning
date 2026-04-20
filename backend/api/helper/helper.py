"""
helpers.py
Pure game logic, Q-learning math, and in-memory session store.
No database, no FastAPI — only functions.
"""

import random
import time
import uuid
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

AI_PLAYER    = "O"
HUMAN_PLAYER = "X"
EMPTY        = "_"

WIN_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),   # rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),   # cols
    (0, 4, 8), (2, 4, 6),              # diagonals
]

REWARD_MAP = {"ai_win": 1.0, "ai_loss": -1.0, "draw": 0.0}


# ─────────────────────────────────────────────────────────────────────────────
# Board helpers
# ─────────────────────────────────────────────────────────────────────────────

def board_to_state(board: list) -> str:
    """[None, 'X', 'O', …]  →  'X_O______'"""
    return "".join(EMPTY if cell is None else cell for cell in board)


def available_moves(board: list) -> list[int]:
    """Return indices of empty cells."""
    return [i for i, cell in enumerate(board) if cell is None]


def apply_move(board: list, index: int, player: str) -> list:
    """Return a new board with player placed at index."""
    b = board[:]
    b[index] = player
    return b


def check_winner(board: list) -> str | None:
    """Return 'X', 'O', 'draw', or None if game is ongoing."""
    for a, b, c in WIN_LINES:
        if board[a] is not None and board[a] == board[b] == board[c]:
            return board[a]
    if all(cell is not None for cell in board):
        return "draw"
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Q-Learning math
# ─────────────────────────────────────────────────────────────────────────────

def choose_action(
    q_values: dict,         # { "move_index_str": float }
    moves: list[int],       # available move indices
    epsilon: float = 0.1,
) -> int:
    """
    Epsilon-greedy action selection.
    - ε chance  → random move (explore)
    - 1-ε chance → highest Q-value move (exploit), ties broken randomly
    """
    if random.random() < epsilon:
        return random.choice(moves)

    best_q     = max(q_values.get(str(m), 0.0) for m in moves)
    best_moves = [m for m in moves if q_values.get(str(m), 0.0) == best_q]
    
    print("Best moves:", best_moves)
    return random.choice(best_moves)


def bellman_update(
    current_q:    float,
    reward:       float,
    max_next_q:   float,
    alpha:        float,   # learning rate
    gamma:        float,   # discount factor
) -> float:
    """Q(s,a) = Q(s,a) + α * (r + γ * maxQ(s',a') - Q(s,a))"""
    return current_q + alpha * (reward + gamma * max_next_q - current_q)


def compute_history_updates(
    history:  list[tuple],   # [(state, move, next_state), ...]
    q_lookup: dict,          # { state: { "move_str": float } }
    result:   str,           # "ai_win" | "ai_loss" | "draw"
    alpha:    float,
    gamma:    float,
) -> dict[tuple, float]:
    """
    Walk history in reverse, compute new Q-value for every (state, move) pair.
    Returns { (state, move_int): new_q_value }
    """
    reward  = REWARD_MAP[result]
    updates = {}

    for state, move, next_state in reversed(history):
        current_q  = q_lookup.get(state, {}).get(str(move), 0.0)
        next_qs    = q_lookup.get(next_state, {})
        max_next_q = max(next_qs.values(), default=0.0)

        updates[(state, move)] = bellman_update(current_q, reward, max_next_q, alpha, gamma)
        reward *= 0.9   # decay: earlier moves matter a little less

    return updates


def human_to_ai_result(human_result: str) -> str:
    """Flip perspective: human 'win' → AI 'ai_loss', etc."""
    return {"win": "ai_loss", "loss": "ai_win", "draw": "draw"}[human_result]


# ─────────────────────────────────────────────────────────────────────────────
# In-memory session store
# (stores game history between /start → /move → /end)
# ─────────────────────────────────────────────────────────────────────────────

_sessions: dict[str, dict] = {}
# { session_id: { "user_id": str, "created_at": float, "history": [(state, move, next_state)] } }


def get_sessions():
    return _sessions

def create_session(user_id: str) -> str:
    sid = str(uuid.uuid4())
    _sessions[sid] = {"user_id": user_id, "created_at": time.time(), "history": []}
    return sid


def get_session(session_id: str) -> dict | None:
    session = _sessions.get(session_id)
    if not session:
        return None
    
    # Check expiration (1 hour = 3600 seconds)
    if time.time() - session["created_at"] > 3600:
        # Remove expired session
        _sessions.pop(session_id, None)
        return None
    
    return session


def push_history(session_id: str, state: str, move: int, next_state: str) -> None:
    if session_id in _sessions:
        _sessions[session_id]["history"].append((state, move, next_state))


def close_session(session_id: str) -> dict | None:
    return _sessions.pop(session_id, None)


def cleanup_expired_sessions(max_age_seconds: int = 3600) -> int:
    """
    Remove all sessions older than max_age_seconds.
    Returns the number of sessions cleaned up.
    """
    current_time = time.time()
    expired_sessions = []
    
    for session_id, session_data in _sessions.items():
        if current_time - session_data["created_at"] > max_age_seconds:
            expired_sessions.append(session_id)
    
    # Remove expired sessions
    for session_id in expired_sessions:
        _sessions.pop(session_id, None)
    
    return len(expired_sessions)


def get_session_count() -> int:
    """Get the current number of active sessions."""
    return len(_sessions)


def get_user_active_sessions(user_id: str) -> list[str]:
    """Get all active session IDs for a specific user."""
    return [sid for sid, data in _sessions.items() if data["user_id"] == user_id]


def cleanup_user_sessions(user_id: str) -> int:
    """Remove all sessions for a specific user. Returns count of removed sessions."""
    user_sessions = get_user_active_sessions(user_id)
    for session_id in user_sessions:
        _sessions.pop(session_id, None)
    return len(user_sessions)