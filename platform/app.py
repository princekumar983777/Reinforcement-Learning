from flask import Flask, render_template, request, jsonify, send_from_directory
import os

# from rl.agent import QLearningAgent

app = Flask(__name__, static_folder='static', static_url_path='/static')

# agent = QLearningAgent()

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
# ERROR HANDLERS
# ────────────────────────────────────────────

@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors"""
    return render_template("home.html"), 404


if __name__ == "__main__":
    app.run(debug=True)