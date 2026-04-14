/* 2048 Game */
let g2048Grid = [];
let g2048Score = 0;
let g2048Best = 0;

function g2048Init() {
  g2048Grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  g2048Score = 0;
  document.getElementById('g2048-score').textContent = 0;
  g2048AddTile();
  g2048AddTile();
  g2048Render();
}

function g2048AddTile() {
  const empty = [];
  g2048Grid.forEach((row, r) => {
    row.forEach((v, c) => {
      if (!v) empty.push([r, c]);
    });
  });
  
  if (!empty.length) return;
  
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g2048Grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function g2048Render() {
  const board = document.getElementById('g2048-board');
  board.innerHTML = '';
  g2048Grid.forEach(row => {
    row.forEach(v => {
      const cell = document.createElement('div');
      cell.className = 'g2048-cell';
      if (v) {
        cell.textContent = v;
        cell.dataset.val = v;
      }
      board.appendChild(cell);
    });
  });
}

function g2048Slide(row) {
  let arr = row.filter(v => v);
  let merged = false;
  
  for (let i = 0; i < arr.length - 1; i++) {
    if (!merged && arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      g2048Score += arr[i];
      arr.splice(i + 1, 1);
      merged = true;
    } else {
      merged = false;
    }
  }
  
  while (arr.length < 4) arr.push(0);
  return arr;
}

function g2048Move(dir) {
  let moved = false;
  const prev = JSON.stringify(g2048Grid);
  
  if (dir === 'left' || dir === 'right') {
    g2048Grid = g2048Grid.map(row => {
      const s = g2048Slide(dir === 'right' ? [...row].reverse() : row);
      return dir === 'right' ? s.reverse() : s;
    });
  } else {
    for (let c = 0; c < 4; c++) {
      let col = g2048Grid.map(r => r[c]);
      if (dir === 'down') col.reverse();
      col = g2048Slide(col);
      if (dir === 'down') col.reverse();
      g2048Grid.forEach((r, ri) => (r[c] = col[ri]));
    }
  }
  
  if (JSON.stringify(g2048Grid) !== prev) {
    moved = true;
  }
  
  if (moved) {
    g2048AddTile();
  }
  
  document.getElementById('g2048-score').textContent = g2048Score;
  
  if (g2048Score > g2048Best) {
    g2048Best = g2048Score;
    document.getElementById('g2048-best').textContent = g2048Best;
  }
  
  g2048Render();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('game2048')) return;
  
  const map = {
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down'
  };
  
  if (map[e.key]) {
    e.preventDefault();
    g2048Move(map[e.key]);
  }
});

// Touch swipe support
let g2048TouchX = null;
let g2048TouchY = null;

document.addEventListener('DOMContentLoaded', () => {
  const g2048Board = document.getElementById('g2048-board');
  if (g2048Board) {
    g2048Board.addEventListener('touchstart', (e) => {
      g2048TouchX = e.changedTouches[0].clientX;
      g2048TouchY = e.changedTouches[0].clientY;
    }, { passive: true });
    
    g2048Board.addEventListener('touchend', (e) => {
      if (g2048TouchX === null) return;
      
      const dx = e.changedTouches[0].clientX - g2048TouchX;
      const dy = e.changedTouches[0].clientY - g2048TouchY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        g2048Move(dx > 0 ? 'right' : 'left');
      } else {
        g2048Move(dy > 0 ? 'down' : 'up');
      }
      
      g2048TouchX = null;
      g2048TouchY = null;
    }, { passive: true });
    
    g2048Init();
  }
});
