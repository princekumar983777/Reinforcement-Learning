/*
 * ══════════════════════════════════════════════════
 *  Game2048.jsx  —  STEP 7: 2D Array State
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPTS:
 * ------------------
 * 1. 2D array state — the board is a 4×4 grid stored
 *    as an array of arrays: grid[row][col]. Immutable
 *    updates require mapping over both dimensions.
 *
 * 2. JSON.stringify for comparison — checking if the
 *    board changed after a move (to know if we should
 *    add a new tile).
 *
 * 3. Touch events — for swipe support on mobile.
 *    We track where the touch started, then calculate
 *    direction from where it ended.
 *
 * 4. Game algorithm — the slide-and-merge logic is
 *    the core of 2048. Understanding it teaches array
 *    manipulation techniques.
 */

import { useState, useEffect, useRef } from 'react'
import GamePageHeader from '../components/GamePageHeader'

// ── GAME LOGIC (pure functions — no React) ──

function makeGrid() {
  return Array.from({ length: 4 }, () => Array(4).fill(0))
}

function addTile(grid) {
  // Collect all empty cells
  const empty = []
  grid.forEach((row, r) =>
    row.forEach((v, c) => { if (!v) empty.push([r, c]) })
  )
  if (!empty.length) return grid

  // Pick a random empty cell; 90% chance of 2, 10% chance of 4
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const newGrid = grid.map(row => [...row])  // deep copy
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

/*
 * LEARNING: The slide function
 * Takes a single row array, removes zeros, merges
 * adjacent equal values, then pads back to 4.
 * Returns [newRow, scoreGained].
 *
 * Example: [2, 0, 2, 4] → merge 2s → [4, 4, 0, 0]
 */
function slideRow(row) {
  let arr = row.filter(v => v)   // remove zeros: [2, 2, 4]
  let score = 0

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2                // merge
      score += arr[i]
      arr.splice(i + 1, 1)       // remove the merged tile
    }
  }

  while (arr.length < 4) arr.push(0)  // pad with zeros
  return [arr, score]
}

function move(grid, dir) {
  let totalScore = 0
  let newGrid = grid.map(row => [...row])

  if (dir === 'left' || dir === 'right') {
    newGrid = newGrid.map(row => {
      const r = dir === 'right' ? [...row].reverse() : row
      const [slid, s] = slideRow(r)
      totalScore += s
      return dir === 'right' ? slid.reverse() : slid
    })
  } else {
    // For up/down, work column by column
    for (let c = 0; c < 4; c++) {
      let col = newGrid.map(row => row[c])
      if (dir === 'down') col.reverse()
      const [slid, s] = slideRow(col)
      totalScore += s
      if (dir === 'down') slid.reverse()
      newGrid.forEach((row, r) => { row[c] = slid[r] })
    }
  }

  return [newGrid, totalScore]
}

function initGame() {
  let g = makeGrid()
  g = addTile(g)
  g = addTile(g)
  return g
}

// ── COMPONENT ──
export default function Game2048({ onNavigate }) {
  const [grid,  setGrid]  = useState(initGame)
  const [score, setScore] = useState(0)
  const [best,  setBest]  = useState(0)

  const handleMove = (dir) => {
    setGrid(prev => {
      const prevStr = JSON.stringify(prev)
      const [newGrid, gained] = move(prev, dir)

      // Only add tile if the board actually changed
      if (JSON.stringify(newGrid) === prevStr) return prev

      const finalGrid = addTile(newGrid)

      // Update scores (using functional updates to read latest values)
      setScore(s => {
        const newScore = s + gained
        setBest(b => Math.max(b, newScore))
        return newScore
      })

      return finalGrid
    })
  }

  const resetGame = () => {
    setGrid(initGame())
    setScore(0)
  }

  // ── KEYBOARD HANDLER ──
  useEffect(() => {
    const dirMap = {
      ArrowLeft:  'left',
      ArrowRight: 'right',
      ArrowUp:    'up',
      ArrowDown:  'down',
    }
    const onKey = (e) => {
      if (dirMap[e.key]) {
        e.preventDefault()
        handleMove(dirMap[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])   // [] = run once on mount

  // ── TOUCH / SWIPE HANDLER ──
  const touchStart = useRef(null)

  const onTouchStart = (e) => {
    touchStart.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    }
  }

  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
  }

  return (
    <div className="game2048-page">
      <GamePageHeader title="2048" color="pink" onBack={() => onNavigate('home')} />

      <div className="game-container">
        {/* HUD */}
        <div className="g2048-hud">
          <div className="g2048-stat">
            <div className="g2048-stat-label">Score</div>
            <div className="g2048-stat-val">{score}</div>
          </div>
          <div className="g2048-stat">
            <div className="g2048-stat-label">Best</div>
            <div className="g2048-stat-val">{best}</div>
          </div>
        </div>

        {/* Board */}
        <div
          className="g2048-board"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/*
           * LEARNING: Nested .map() for 2D arrays
           * Outer map → rows, inner map → cells.
           * Key must be unique: use `${r}-${c}`.
           */}
          {grid.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className="g2048-cell"
                data-val={val || undefined}
              >
                {val || ''}
              </div>
            ))
          )}
        </div>

        <button className="g2048-reset" onClick={resetGame}>
          New Game
        </button>
        <div className="g2048-hint">Use arrow keys or swipe to slide tiles</div>
      </div>
    </div>
  )
}
