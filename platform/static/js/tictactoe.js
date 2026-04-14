/* Tic Tac Toe Game with Q-Learning AI */
let tttBoard = Array(9).fill(null);
let tttTurn = 'X';
let tttOver = false;
let tttScores = { X: 0, O: 0, D: 0 };
let tttSinglePlayer = false;  // true = vs AI, false = vs human
let tttAIThinking = false;    // Prevent clicks while AI is thinking

const tttWins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// ─────────────────────────────────────────
// MODE MANAGEMENT
// ─────────────────────────────────────────

function setSinglePlayerMode(isAI) {
  console.log('[TTT] Switching mode to:', isAI ? 'AI' : 'PvP');
  tttSinglePlayer = isAI;
  
  // Update button UI
  document.getElementById('mode-pvp').classList.toggle('active', !isAI);
  document.getElementById('mode-pva').classList.toggle('active', isAI);
  
  // Reset game for new mode
  tttReset();
  console.log('[TTT] Mode switched. tttSinglePlayer =', tttSinglePlayer);
}

// ─────────────────────────────────────────
// MAIN GAME LOGIC
// ─────────────────────────────────────────

function tttClick(i) {
  if (tttOver || tttBoard[i] || tttAIThinking) return;
  
  // Player is always 'X'
  tttBoard[i] = 'X';
  updateCellUI(i, 'x');
  
  const win = tttCheckWin();
  if (win) {
    tttGameEnd(win);  // Pass actual winner ('X' or 'O')
  } else if (tttBoard.every(c => c)) {
    tttGameEnd('draw');
  } else {
    tttTurn = 'O';
    updateTTTBoxes();
    
    // If single player, get AI move
    if (tttSinglePlayer) {
      setTimeout(() => getAIMove(), 500);  // Small delay for UX
    }
  }
}

function updateCellUI(i, player) {
//   """Update UI for a cell"""
  const cells = document.querySelectorAll('.ttt-cell');
  cells[i].textContent = player === 'x' ? 'X' : 'O';
  cells[i].classList.add(player, 'taken');
}

function getAIMove() {
  console.log('[TTT] Getting AI move. Board state:', tttBoard);
  tttAIThinking = true;
  
  // Send board to backend
  fetch('/api/ai-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: tttBoard })
  })
  .then(response => {
    console.log('[TTT] AI response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('[TTT] AI move:', data.move);
    // Apply AI move to board
    const move = data.move;
    tttBoard[move] = 'O';
    updateCellUI(move, 'o');
    
    // Check result after AI move
    const win = tttCheckWin();
    if (win) {
      console.log('[TTT] Game end detected. Winner:', win);
      tttGameEnd(win);  // Pass actual winner ('O' or 'X')
    } else if (tttBoard.every(c => c)) {
      tttGameEnd('draw');
    } else {
      tttTurn = 'X';
      updateTTTBoxes();
    }
    
    tttAIThinking = false;
  })
  .catch(error => {
    console.error('[TTT] AI move error:', error);
    tttAIThinking = false;
  });
}

function tttGameEnd(winner) {
//   """Handle game end: update scores and send result to AI"""
  tttOver = true;
  updateTTTBoxes();
  
  const msg = document.getElementById('ttt-message');
  
  if (winner === 'draw') {
    msg.textContent = 'DRAW!';
    msg.className = 'ttt-message draw';
    tttScores.D++;
    document.getElementById('ttt-score-d').textContent = tttScores.D;
    
    // Tell AI it was a draw
    if (tttSinglePlayer) {
      sendGameResult('draw');
    }
  } else if (winner === 'X') {
    msg.textContent = 'X WINS!';
    msg.className = 'ttt-message win-x';
    tttScores.X++;
    document.getElementById('ttt-score-x').textContent = tttScores.X;
    
    // Tell AI it lost
    if (tttSinglePlayer) {
      sendGameResult('ai_loss');
    }
  } else if (winner === 'O') {
    msg.textContent = 'O WINS!';
    msg.className = 'ttt-message win-o';
    tttScores.O++;
    document.getElementById('ttt-score-o').textContent = tttScores.O;
    
    // Tell AI it won (learning moment!)
    if (tttSinglePlayer) {
      sendGameResult('ai_win');
    }
  }
}

function sendGameResult(result) {
//   """Send game result to backend for AI learning"""
  fetch('/api/game-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result: result })
  })
  .then(response => response.json())
  .then(data => {
    console.log('AI learned from game:', data);
  })
  .catch(error => console.error('Game result error:', error));
}

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function updateTTTBoxes() {
  document.getElementById('ttt-box-x').classList.toggle('active-player', tttTurn === 'X' && !tttOver);
  document.getElementById('ttt-box-o').classList.toggle('active-player', tttTurn === 'O' && !tttOver);
}

function tttCheckWin() {
  for (const combo of tttWins) {
    const [a, b, c] = combo;
    if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
      // Highlight winning cells
      const cells = document.querySelectorAll('.ttt-cell');
      [a, b, c].forEach(idx => cells[idx].classList.add('win-cell'));
      return tttBoard[a];
    }
  }
  return null;
}

function tttReset() {
  tttBoard = Array(9).fill(null);
  tttTurn = 'X';
  tttOver = false;
  tttAIThinking = false;
  
  document.querySelectorAll('.ttt-cell').forEach((c, i) => {
    c.textContent = '';
    c.className = 'ttt-cell';
    c.onclick = () => tttClick(i);
  });
  
  const msg = document.getElementById('ttt-message');
  msg.textContent = "X's Turn";
  msg.className = 'ttt-message turn-x';
  updateTTTBoxes();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const tttBoard = document.getElementById('ttt-board');
  if (tttBoard) {
    tttReset();
  }
});
