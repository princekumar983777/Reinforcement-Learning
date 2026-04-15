from flask import Flask, render_template, request, jsonify, send_from_directory
import os
from rl.tic_tac_toe_agent import TicTacToeAgent

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Initialize AI agent (loads Q-table from file if it exists)
ai_agent = TicTacToeAgent(epsilon=0.2, learning_rate=0.1, discount=0.95)

# ────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────

@app.route("/")
def home():
    """Render home/games page"""
    return render_template("home.html")


@app.route("/games/tictactoe")
def tictactoe():
    """Render Tic Tac Toe game"""
    return render_template("games/tictactoe.html")


@app.route("/games/snake")
def snake():
    """Render Snake game"""
    return render_template("games/snake.html")


@app.route("/games/memory")
def memory():
    """Render Memory Match game"""
    return render_template("games/memory.html")


@app.route("/games/2048")
def game2048():
    """Render 2048 game"""
    return render_template("games/game2048.html")


# ────────────────────────────────────────────
# AI ENDPOINTS (Q-Learning Tic Tac Toe)
# ────────────────────────────────────────────

@app.route("/api/ai-move", methods=["POST"])
def ai_move():
    """
    Get AI's next move
    
    Request JSON:
        {
            "board": [None, 'X', None, 'O', ...],  // current board state
        }
    
    Response JSON:
        {
            "move": 5,          // AI's chosen move (0-8)
            "board": [None, 'X', None, 'O', 'O', None, ...]  // board after AI move
        }
    """
    data = request.json
    board = data.get('board', [None] * 9)
    
    # Get AI's move
    move = ai_agent.choose_action(board)
    
    # Simulate the move
    board_after = board.copy()
    board_after[move] = 'O'  # AI is 'O'
    
    # Record for learning later
    ai_agent.record_move(board, move, board_after)
    
    return jsonify({
        'move': move,
        'board': board_after
    })


@app.route("/api/game-result", methods=["POST"])
def game_result():
    """
    Update AI's Q-table after game ends
    
    Request JSON:
        {
            "result": "ai_win"  // "ai_win", "ai_loss", or "draw"
        }
    
    Response JSON:
        {
            "status": "success",
            "learned": true
        }
    """
    data = request.json
    result = data.get('result')  # 'ai_win', 'ai_loss', or 'draw'
    
    # Update Q-table based on game result
    ai_agent.update_q_values(result)
    
    # Save learning to file (persist across server restarts)
    ai_agent.save_q_table()
    
    return jsonify({
        'status': 'success',
        'learned': True
    })


# ────────────────────────────────────────────
# ERROR HANDLERS
# ────────────────────────────────────────────

@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors"""
    return render_template("home.html"), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)