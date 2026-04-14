"""
Q-Learning Agent for Tic Tac Toe
================================
Learns to play better Tic Tac Toe by updating Q-values after each game.
"""
import json
import random
import os
import redis
import dotenv

dotenv.load_dotenv()


Q_TABLE_FILE = 'platform/rl/q_table.json'

class TicTacToeAgent:
    def __init__(self, epsilon=0.2, learning_rate=0.1, discount=0.95):
        """
        Initialize Q-Learning agent
        
        Args:
            epsilon: Exploration rate (0.2 = 20% random moves, 80% best moves)
            learning_rate: How much to update Q-values (0-1)
            discount: How much to value future rewards vs immediate (0-1)
        """
        self.epsilon = epsilon
        self.learning_rate = learning_rate
        self.discount = discount
        self.q_table = {}
        self.load_q_table()
        self.game_history = []  # Track moves during current game

        self.r = redis.Redis(
            host=os.getenv("R_HOST"),
            port=os.getenv("R_PORT"),
            decode_responses=True,
            username="default",
            password=os.getenv("R_PASSWORD"),
        )
        # ─────────────────────────────────────────
    # CORE GAME FUNCTIONS
    # ─────────────────────────────────────────
    
    def board_to_state(self, board):
        """
        Convert board array to string state for Q-table lookup
        
        Args:
            board: list of 9 values [None, 'X', 'O', ...]
            
        Returns:
            state: string like "X_O_____"
        """
        state = ''.join(['_' if cell is None else cell for cell in board])
        return state
    
    def get_available_moves(self, board):
        """
        Find all empty cells on the board
        
        Args:
            board: list of 9 values
            
        Returns:
            list of indices (0-8) that are empty
        """
        return [i for i in range(9) if board[i] is None]
    
    def check_winner(self, board):
        """
        Check if someone won
        
        Args:
            board: list of 9 values
            
        Returns:
            'X', 'O', 'draw', or None
        """
        win_combos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
            [0, 4, 8], [2, 4, 6]              # diagonals
        ]
        
        for combo in win_combos:
            if board[combo[0]] == board[combo[1]] == board[combo[2]] is not None:
                return board[combo[0]]  # Return 'X' or 'O'
        
        # Check for draw
        if all(cell is not None for cell in board):
            return 'draw'
        
        return None  # Game still ongoing
    
    # ─────────────────────────────────────────
    # Q-LEARNING FUNCTIONS
    # ─────────────────────────────────────────
    
    def choose_action(self, board):
        """
        Choose AI move using epsilon-greedy strategy
        
        Epsilon-Greedy:
        - 20% chance: random move (explore)
        - 80% chance: best learned move (exploit)
        
        Args:
            board: current board state
            
        Returns:
            move: index 0-8 where AI should play
        """
        available_moves = self.get_available_moves(board)
        state = self.board_to_state(board)
        
        # If random forces exploration
        if random.random() < self.epsilon:
            move = random.choice(available_moves)
        else:
            # Get best move from Q-table
            if state not in self.q_table:
                self.q_table[state] = {}
            
            # Get Q-value for each available move
            q_values = [self.q_table[state].get(move, 0.0) for move in available_moves]
            max_q = max(q_values)
            
            # Pick a random move tied for best (helps with ties)
            best_moves = [move for move, q in zip(available_moves, q_values) if q == max_q]
            move = random.choice(best_moves)
        
        return move
    
    def update_q_values(self, result):
        """
        Update Q-table after game ends
        
        Result scoring:
        - AI wins: +1
        - AI loses: -1
        - Draw: 0
        
        Args:
            result: 'ai_win', 'ai_loss', or 'draw'
        """
        # Determine reward
        reward_map = {'ai_win': 1, 'ai_loss': -1, 'draw': 0}
        reward = reward_map.get(result, 0)
        
        # Go through game history backwards and update
        for i in range(len(self.game_history) - 1, -1, -1):
            state, move, next_state = self.game_history[i]
            
            # Initialize Q-table entries if needed
            if state not in self.q_table:
                self.q_table[state] = {}
            if next_state not in self.q_table:
                self.q_table[next_state] = {}
            
            # Get best Q-value from next state
            next_q_values = list(self.q_table[next_state].values())
            max_next_q = max(next_q_values) if next_q_values else 0.0
            
            # Q-Learning formula: Q(s,a) = Q(s,a) + α * (r + γ * max Q(s',a') - Q(s,a))
            current_q = self.q_table[state].get(move, 0.0)
            new_q = current_q + self.learning_rate * (reward + self.discount * max_next_q - current_q)
            self.q_table[state][move] = new_q
            
            # Reduce reward for earlier moves (they matter less than final move)
            reward *= 0.9
        
        # Clear history for next game
        self.game_history = []
    
    def record_move(self, board, move, board_after):
        """
        Record move in game history for later Q-update
        
        Args:
            board: state before move
            move: which index was played
            board_after: state after move
        """
        state = self.board_to_state(board)
        next_state = self.board_to_state(board_after)
        self.game_history.append((state, move, next_state))
    
    # ─────────────────────────────────────────
    # FILE PERSISTENCE
    # ─────────────────────────────────────────
    
    def save_q_table(self):
        """Save Q-table to JSON file"""
        os.makedirs(os.path.dirname(Q_TABLE_FILE), exist_ok=True)
        with open(Q_TABLE_FILE, 'w') as f:
            json.dump(self.q_table, f, indent=2)
    
    def load_q_table(self):
        """Load Q-table from JSON file (or create empty if doesn't exist)"""
        if os.path.exists(Q_TABLE_FILE):
            with open(Q_TABLE_FILE, 'r') as f:
                self.q_table = json.load(f)
        else:
            self.q_table = {}
