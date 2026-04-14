/* Tic Tac Toe Game */
let tttBoard = Array(9).fill(null);
let tttTurn = 'X';
let tttOver = false;
let tttScores = { X: 0, O: 0, D: 0 };
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

function tttClick(i) {
  if (tttOver || tttBoard[i]) return;
  tttBoard[i] = tttTurn;
  const cells = document.querySelectorAll('.ttt-cell');
  cells[i].textContent = tttTurn;
  cells[i].classList.add(tttTurn.toLowerCase(), 'taken');
  
  const win = tttCheckWin();
  if (win) {
    win.forEach(idx => cells[idx].classList.add('win-cell'));
    const msg = document.getElementById('ttt-message');
    msg.textContent = `${tttTurn} WINS!`;
    msg.className = `ttt-message win-${tttTurn.toLowerCase()}`;
    tttScores[tttTurn]++;
    document.getElementById(`ttt-score-${tttTurn.toLowerCase()}`).textContent = tttScores[tttTurn];
    tttOver = true;
    updateTTTBoxes();
  } else if (tttBoard.every(c => c)) {
    const msg = document.getElementById('ttt-message');
    msg.textContent = 'DRAW!';
    msg.className = 'ttt-message draw';
    tttScores.D++;
    document.getElementById('ttt-score-d').textContent = tttScores.D;
    tttOver = true;
  } else {
    tttTurn = tttTurn === 'X' ? 'O' : 'X';
    const msg = document.getElementById('ttt-message');
    msg.textContent = `${tttTurn}'s Turn`;
    msg.className = `ttt-message turn-${tttTurn.toLowerCase()}`;
    updateTTTBoxes();
  }
}

function updateTTTBoxes() {
  document.getElementById('ttt-box-x').classList.toggle('active-player', tttTurn === 'X' && !tttOver);
  document.getElementById('ttt-box-o').classList.toggle('active-player', tttTurn === 'O' && !tttOver);
}

function tttCheckWin() {
  for (const combo of tttWins) {
    const [a, b, c] = combo;
    if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
      return combo;
    }
  }
  return null;
}

function tttReset() {
  tttBoard = Array(9).fill(null);
  tttTurn = 'X';
  tttOver = false;
  
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
