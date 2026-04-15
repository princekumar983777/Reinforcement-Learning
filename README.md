# 🤖 AI Learning Games Platform

An interactive gaming platform where users play classic games against AI opponents that continuously learn and improve from every interaction. Built with Q-learning reinforcement algorithms, the AI agents adapt their strategies in real-time, creating personalized and progressively challenging gaming experiences.

## 🎮 Platform Overview

This platform serves as both an entertainment system and an AI research tool, where:
- **Users play games** against AI opponents
- **AI learns continuously** from user gameplay patterns
- **Adaptive difficulty** adjusts based on user skill levels
- **Persistent memory** ensures AI improvement over time

## 🚀 Key Features

### Games Available
- **Tic-Tac-Toe**: Fully AI-powered with active Q-learning
- **Snake**: Classic snake game (AI integration planned)
- **2048**: Number puzzle game (AI integration planned)
- **Memory Match**: Card matching game (AI integration planned)

### AI Capabilities
- **Q-Learning Algorithm**: State-action value optimization
- **Epsilon-Greedy Strategy**: Balanced exploration vs exploitation
- **Real-time Learning**: Updates after every game
- **Redis Persistence**: Maintains knowledge across sessions
- **Adaptive Behavior**: Adjusts to user playing styles

## 🛠️ Technology Stack

### Backend
- **Python Flask**: Web framework
- **Redis**: Primary AI memory storage
- **Q-Learning**: Reinforcement learning algorithm
- **JSON**: Backup data persistence

### Frontend
- **HTML5/CSS3**: Responsive game interfaces
- **JavaScript**: Game logic and interactions
- **WebSockets**: Real-time communication (planned)

### AI Components
- **State Representation**: Efficient board state encoding
- **Reward System**: Win(+1), Loss(-1), Draw(0)
- **Discount Factor**: 0.95 for future reward valuation
- **Learning Rate**: 0.1 for Q-value updates

## 📊 AI Learning Mechanism

```
Game Flow:
1. User makes move → AI observes state
2. AI chooses action → Updates Q-values
3. Game ends → AI learns from result
4. Q-table persists → AI improves over time
```

### Q-Learning Formula
```
Q(s,a) = Q(s,a) + α * (r + γ * max(Q(s',a')) - Q(s,a))
```

Where:
- `α` = Learning rate (0.1)
- `γ` = Discount factor (0.95)
- `r` = Reward (-1, 0, +1)

## 🗂️ Project Structure

```
platform/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── rl/
│   ├── __init__.py
│   ├── tic_tac_toe_agent.py  # Q-learning AI agent
│   └── q_table_backup.json   # JSON backup
├── static/
│   ├── css/               # Game stylesheets
│   ├── js/                # Game scripts
│   └── img/               # Game assets
└── templates/
    ├── base.html          # Base template
    ├── home.html          # Games menu
    └── games/             # Individual game pages
        ├── tictactoe.html
        ├── snake.html
        ├── memory.html
        └── game2048.html
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Redis server (local or cloud)
- Web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reinforcement-learning
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r platform/requirements.txt
   ```

4. **Configure Redis**
   ```bash
   # Update .env file with your Redis credentials
   R_HOST=your-redis-host
   R_PORT=your-redis-port
   R_PASSWORD=your-redis-password
   ```

5. **Run the application**
   ```bash
   python platform/app.py
   ```

6. **Open browser**
   ```
   http://localhost:5000
   ```

## 🎯 API Endpoints

### AI Learning Endpoints
- `POST /api/ai-move`: Get AI's next move
- `POST /api/game-result`: Update AI learning after game

### Game Routes
- `GET /`: Games menu
- `GET /games/tictactoe`: Tic-Tac-Toe game
- `GET /games/snake`: Snake game
- `GET /games/memory`: Memory game
- `GET /games/2048`: 2048 game

## 🧠 AI Training Process

1. **Initial State**: AI starts with empty Q-table
2. **Exploration**: Uses epsilon-greedy (20% random, 80% learned)
3. **Learning**: Updates Q-values after each game
4. **Persistence**: Saves to Redis and JSON backup
5. **Improvement**: Gradually optimizes strategies

## 📈 Performance Metrics

- **Q-Table Size**: Number of learned state-action pairs
- **Win Rate**: AI performance against users
- **Learning Speed**: Q-value convergence rate
- **Adaptability**: Response to different playing styles

## 🔮 Future Enhancements

- **Multi-Agent System**: Different AI personalities
- **Advanced Algorithms**: Deep Q-Learning, Policy Gradients
- **User Analytics**: Gameplay pattern analysis
- **Tournament Mode**: AI vs AI competitions
- **Mobile Support**: Responsive design optimization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Flask web framework
- Powered by Redis in-memory database
- Inspired by reinforcement learning research
- Classic games reimagined with AI

---

**Play games. Train AI. Watch them learn. 🤖🎮**