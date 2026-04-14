/* Memory Match Game */
const MEM_ICONS = ['🎮', '🚀', '⚡', '🔥', '💎', '🌈', '🎯', '🏆'];

let memCards = [];
let memFlipped = [];
let memMatched = 0;
let memMoves = 0;
let memTimer = null;
let memSecs = 0;
let memLocked = false;

function memoryInit() {
  clearInterval(memTimer);
  memSecs = 0;
  memMoves = 0;
  memMatched = 0;
  memLocked = false;
  
  document.getElementById('mem-moves').textContent = 0;
  document.getElementById('mem-pairs').textContent = '0/8';
  document.getElementById('mem-time').textContent = '0s';
  
  const icons = [...MEM_ICONS, ...MEM_ICONS].sort(() => Math.random() - 0.5);
  const grid = document.getElementById('memory-grid');
  grid.innerHTML = '';
  memCards = [];
  
  icons.forEach((icon, i) => {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.innerHTML = `
      <div class="mem-card-face mem-card-back"></div>
      <div class="mem-card-face mem-card-front">${icon}</div>
    `;
    card.dataset.icon = icon;
    card.dataset.idx = i;
    card.addEventListener('click', () => memFlip(card));
    grid.appendChild(card);
    memCards.push(card);
  });
  
  memTimer = setInterval(() => {
    memSecs++;
    document.getElementById('mem-time').textContent = memSecs + 's';
  }, 1000);
}

function memFlip(card) {
  if (memLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
    return;
  }
  
  card.classList.add('flipped');
  memFlipped.push(card);
  
  if (memFlipped.length === 2) {
    memLocked = true;
    memMoves++;
    document.getElementById('mem-moves').textContent = memMoves;
    
    if (memFlipped[0].dataset.icon === memFlipped[1].dataset.icon) {
      memFlipped.forEach(c => c.classList.add('matched', 'flipped'));
      memMatched++;
      document.getElementById('mem-pairs').textContent = `${memMatched}/8`;
      memFlipped = [];
      memLocked = false;
      
      if (memMatched === 8) {
        clearInterval(memTimer);
      }
    } else {
      setTimeout(() => {
        memFlipped.forEach(c => c.classList.remove('flipped'));
        memFlipped = [];
        memLocked = false;
      }, 900);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const memoryGrid = document.getElementById('memory-grid');
  if (memoryGrid) {
    memoryInit();
  }
});
