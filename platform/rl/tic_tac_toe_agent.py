import json
import random
import os
import redis
from dotenv import load_dotenv

load_dotenv()

# Constants
PREFIX = "tictactoe"
JSON_BACKUP_FILE = 'platform/rl/q_table_backup.json'

class TicTacToeAgent:
    def __init__(self, epsilon=0.1, learning_rate=0.1, discount=0.95):
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
        self.game_history = []  # Track moves during current game

        self.r = redis.Redis(
            host=os.getenv("R_HOST"),
            port=int(os.getenv("R_PORT", 6379)),
            decode_responses=True,
            username=os.getenv("R_USERNAME", "default"),
            password=os.getenv("R_PASSWORD"),
        )
        
        # Load JSON backup into Redis on startup
        self.sync_json_to_redis()
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
        # print("State : " , state) #_______________________________________________________
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
        - 10% chance: random move (explore)
        - 80% chance: best learned move (exploit)
        
        Args:
            board: current board state
            
        Returns:
            move: index 0-8 where AI should play
        """
        available_moves = self.get_available_moves(board)
        # print("Available Moves : " , available_moves) #--------------------------------------------------
        state = self.board_to_state(board)
        
        # If random forces exploration
        if random.random() < self.epsilon:
            move = random.choice(available_moves)
            # print("Chosed Random moves : " , move) #--------------------------------------------------
            
        else:
            # Get Q-values from Redis for this state
            q_values_dict = self.get_q_values(state)
            # print(q_values_dict) #----------------------------------------------------
            
            # Get Q-value for each available move (default 0.0)
            q_values = [q_values_dict.get(str(move), 0.0) for move in available_moves]
            max_q = max(q_values)
            
            # Pick a random move tied for best (helps with ties)
            best_moves = [move for move, q in zip(available_moves, q_values) if q == max_q]
            move = random.choice(best_moves)
            # print("Best Move : " , move) #------------------------------------------------------------
        
        return move
    
    def update_q_values(self, result):
        """
        Update Q-table after game ends using Redis
        
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
            
            # Get Q-values for current and next states from Redis
            current_q_values = self.get_q_values(state)
            next_q_values = self.get_q_values(next_state)
            
            # Get best Q-value from next state
            max_next_q = max(next_q_values.values()) if next_q_values else 0.0
            
            # Q-Learning formula: Q(s,a) = Q(s,a) + α * (r + γ * max Q(s',a') - Q(s,a))
            current_q = current_q_values.get(str(move), 0.0)
            new_q = current_q + self.learning_rate * (reward + self.discount * max_next_q - current_q)
            
            # Save to Redis
            self.set_q_value(state, move, new_q)
            
            # Reduce reward for earlier moves (they matter less than final move)
            reward *= 0.9
            # print(f"Updated the q values : {state} :{move}:{current_q}: {new_q}") #------------------------------------------------------------
        
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
    # REDIS OPERATIONS FOR Q-TABLE
    # ─────────────────────────────────────────
    
    def get_q_values(self, state):
        """
        Get all Q-values for a state from Redis
        
        Args:
            state: state string
            
        Returns:
            dict of {move_str: q_value} where move_str is "0"-"8"
        """
        try:
            redis_key = f"{PREFIX}:{state}"
            q_values_raw = self.r.hgetall(redis_key)
            # print(" Q values from redis : " , q_values_raw) #----------------------------------------------------
            
            # Parse and validate Q-values
            q_values = {}
            for move_str, value_str in q_values_raw.items():
                try:
                    # Skip invalid move indices
                    move_int = int(move_str)
                    if 0 <= move_int <= 8:
                        q_values[move_str] = float(value_str)
                except (ValueError, TypeError):
                    # Skip invalid entries
                    continue
            
            return q_values
        except Exception as e:
            print(f"Error getting Q-values from Redis: {e}")
            return {}
    
    def set_q_value(self, state, move, value):
        """
        Set Q-value for a state-move pair in Redis
        
        Args:
            state: state string
            move: move index (0-8)
            value: Q-value to store
        """
        try:
            redis_key = f"{PREFIX}:{state}"
            move_str = str(move)
            value_str = str(round(float(value), 6))
            self.r.hset(redis_key, move_str, value_str)
        except Exception as e:
            print(f"Error setting Q-value in Redis: {e}")
    
    def state_exists(self, state):
        """
        Check if a state exists in Redis Q-table
        
        Args:
            state: state string
            
        Returns:
            True if state has any Q-values stored, False otherwise
        """
        try:
            redis_key = f"{PREFIX}:{state}"
            return bool(self.r.exists(redis_key))
        except Exception as e:
            print(f"Error checking state in Redis: {e}")
            return False
    
    # ─────────────────────────────────────────
    # JSON BACKUP & SYNC FUNCTIONS
    # ─────────────────────────────────────────
    
    def sync_json_to_redis(self):
        """
        Load JSON backup into Redis on startup
        Only loads if Redis is empty to avoid overwriting learned data
        """
        try:
            # Check if Redis already has data
            existing_keys = self.r.keys(f"{PREFIX}:*")
            if existing_keys:
                print("Redis already has data, skipping JSON sync")
                return
            
            # Load from JSON if it exists
            if os.path.exists(JSON_BACKUP_FILE):
                with open(JSON_BACKUP_FILE, 'r') as f:
                    json_data = json.load(f)
                
                # Use pipeline for bulk loading
                with self.r.pipeline() as pipe:
                    for state, moves_dict in json_data.items():
                        redis_key = f"{PREFIX}:{state}"
                        # Convert move keys to strings and values to strings
                        redis_data = {str(k): str(v) for k, v in moves_dict.items()}
                        pipe.hset(redis_key, mapping=redis_data)
                    pipe.execute()
                
                print(f"Loaded {len(json_data)} states from JSON backup into Redis")
            else:
                print("No JSON backup found, starting with empty Q-table")
        except Exception as e:
            print(f"Error syncing JSON to Redis: {e}")
    
    def save_redis_to_json(self):
        """
        Dump all Redis Q-values to JSON backup file
        """
        try:
            # Get all state keys
            state_keys = self.r.keys(f"{PREFIX}:*")
            json_data = {}
            
            for redis_key in state_keys:
                # Extract state from key
                state = redis_key.split(':', 1)[1]
                q_values = self.get_q_values(state)
                
                # Convert move strings back to integers for JSON
                json_data[state] = {int(k): float(v) for k, v in q_values.items()}
            
            # Save to JSON
            os.makedirs(os.path.dirname(JSON_BACKUP_FILE), exist_ok=True)
            with open(JSON_BACKUP_FILE, 'w') as f:
                json.dump(json_data, f, indent=2)
            
            print(f"Saved {len(json_data)} states to JSON backup")
        except Exception as e:
            print(f"Error saving Redis to JSON: {e}")
    
    # ─────────────────────────────────────────
    # REDIS DATABASE MANAGEMENT
    # ─────────────────────────────────────────
    
    def get_q_table_size(self):
        """
        Get the total number of states in Redis Q-table
        
        Returns:
            int count of state entries
        """
        try:
            keys = self.r.keys(f"{PREFIX}:*")
            return len(keys)
        except Exception as e:
            print(f"Error getting Q-table size: {e}")
            return 0
    
    def clear_redis_data(self):
        """
        Clear all Q-Learning data from Redis (for testing/reset)
        """
        try:
            # Delete all Q-table entries
            q_table_keys = self.r.keys(f"{PREFIX}:*")
            if q_table_keys:
                self.r.delete(*q_table_keys)
            
            print("All Redis Q-table data cleared")
        except Exception as e:
            print(f"Error clearing Redis data: {e}")
    
    def cleanup_invalid_fields(self):
        """
        Remove invalid fields from Redis hashes (e.g., non-numeric move indices)
        """
        try:
            state_keys = self.r.keys(f"{PREFIX}:*")
            cleaned_count = 0
            
            for redis_key in state_keys:
                q_values_raw = self.r.hgetall(redis_key)
                invalid_fields = []
                
                for move_str in q_values_raw.keys():
                    try:
                        move_int = int(move_str)
                        if not (0 <= move_int <= 8):
                            invalid_fields.append(move_str)
                    except (ValueError, TypeError):
                        invalid_fields.append(move_str)
                
                # Remove invalid fields
                if invalid_fields:
                    self.r.hdel(redis_key, *invalid_fields)
                    cleaned_count += len(invalid_fields)
            
            print(f"Cleaned {cleaned_count} invalid fields from Redis")
        except Exception as e:
            print(f"Error cleaning invalid fields: {e}")
    
    def save_q_table(self):
        """
        Save Redis Q-table to JSON backup (called periodically)
        """
        self.save_redis_to_json()
    
    def save_new_states_log(self):
        """
        No-op - new states logging removed in favor of clean Redis structure
        """
        pass
