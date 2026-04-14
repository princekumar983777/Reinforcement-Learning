/* Snake Game */
const GRID = 20;
const CELL = 24;

let snakeBody = [];
let snakeVel = { x: 1, y: 0 };
let snakeFood = { x: 5, y: 5 };
let snakeRunning = false;
let snakeInterval = null;
let snakeScoreVal = 0;
let snakeBestVal = 0;
let snakeLevelVal = 1;
let snakeNextVel = { x: 1, y: 0 };

const sc = document.getElementById('snakeCanvas');
const ctx = sc.getContext('2d');

function snakeDrawGrid() {
  ctx.clearRect(0, 0, sc.width, sc.height);
  ctx.fillStyle = '#04040f';
  ctx.fillRect(0, 0, sc.width, sc.height);
  ctx.strokeStyle = 'rgba(57,255,110,0.04)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x < GRID; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, sc.height);
    ctx.stroke();
  }
  for (let y = 0; y < GRID; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(sc.width, y * CELL);
    ctx.stroke();
  }
}

function snakeDraw() {
  snakeDrawGrid();
  
  // Draw food
  const fx = snakeFood.x * CELL;
  const fy = snakeFood.y * CELL;
  ctx.shadowColor = 'rgba(255,45,120,0.8)';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ff2d78';
  ctx.beginPath();
  ctx.arc(fx + CELL / 2, fy + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Draw snake
  snakeBody.forEach((seg, i) => {
    const t = 1 - i / snakeBody.length;
    ctx.shadowColor = `rgba(57,255,110,${t * 0.6})`;
    ctx.shadowBlur = t * 10;
    ctx.fillStyle = `rgba(57,255,110,${0.4 + t * 0.6})`;
    ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    
    if (i === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(seg.x * CELL + 5, seg.y * CELL + 5, 4, 4);
    }
  });
  ctx.shadowBlur = 0;
}

function snakeStep() {
  snakeVel = { ...snakeNextVel };
  const head = {
    x: snakeBody[0].x + snakeVel.x,
    y: snakeBody[0].y + snakeVel.y
  };
  
  // Check collision with walls
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    snakeGameOver();
    return;
  }
  
  // Check collision with self
  if (snakeBody.some(s => s.x === head.x && s.y === head.y)) {
    snakeGameOver();
    return;
  }
  
  snakeBody.unshift(head);
  
  // Check if food eaten
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScoreVal += 10 * snakeLevelVal;
    document.getElementById('snake-score').textContent = snakeScoreVal;
    
    if (snakeScoreVal > snakeBestVal) {
      snakeBestVal = snakeScoreVal;
      document.getElementById('snake-best').textContent = snakeBestVal;
    }
    
    snakeLevelVal = Math.floor(snakeScoreVal / 50) + 1;
    document.getElementById('snake-level').textContent = snakeLevelVal;
    
    clearInterval(snakeInterval);
    snakeInterval = setInterval(snakeStep, Math.max(80, 200 - snakeLevelVal * 15));
    snakePlaceFood();
  } else {
    snakeBody.pop();
  }
  
  snakeDraw();
}

function snakePlaceFood() {
  let f;
  do {
    f = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID)
    };
  } while (snakeBody.some(s => s.x === f.x && s.y === f.y));
  
  snakeFood = f;
}

function snakeStart() {
  document.getElementById('snake-overlay').classList.add('hidden');
  snakeBody = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  snakeVel = { x: 1, y: 0 };
  snakeNextVel = { x: 1, y: 0 };
  snakeScoreVal = 0;
  snakeLevelVal = 1;
  document.getElementById('snake-score').textContent = 0;
  document.getElementById('snake-level').textContent = 1;
  
  snakePlaceFood();
  snakeRunning = true;
  clearInterval(snakeInterval);
  snakeInterval = setInterval(snakeStep, 200);
}

function snakeGameOver() {
  clearInterval(snakeInterval);
  snakeRunning = false;
  const ov = document.getElementById('snake-overlay');
  document.getElementById('snake-overlay-title').textContent = 'GAME OVER';
  document.getElementById('snake-overlay-score').textContent = `Score: ${snakeScoreVal}`;
  document.getElementById('snake-start-btn').textContent = 'PLAY AGAIN';
  ov.classList.remove('hidden');
}

function snakePause() {
  clearInterval(snakeInterval);
  snakeRunning = false;
}

function snakeDir(dx, dy) {
  if (dx !== 0 && snakeVel.x !== 0) return;
  if (dy !== 0 && snakeVel.y !== 0) return;
  snakeNextVel = { x: dx, y: dy };
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('snake')) return;
  
  const map = {
    'ArrowUp': [0, -1],
    'ArrowDown': [0, 1],
    'ArrowLeft': [-1, 0],
    'ArrowRight': [1, 0]
  };
  
  if (map[e.key]) {
    e.preventDefault();
    snakeDir(...map[e.key]);
  }
});

// Initial draw
document.addEventListener('DOMContentLoaded', () => {
  if (sc) {
    snakeDrawGrid();
  }
});
