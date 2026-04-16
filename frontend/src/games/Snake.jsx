/*
 * ══════════════════════════════════════════════════
 *  Snake.jsx  —  STEP 5: Side Effects & Canvas
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPTS:
 * ------------------
 * 1. useRef — access DOM elements directly (canvas)
 *    and store mutable values WITHOUT triggering re-renders
 *    (e.g., game interval, snake direction buffer).
 *
 * 2. useEffect — run code AFTER the component renders.
 *    Used here for: keyboard listeners, game loop cleanup.
 *    ALWAYS return a cleanup function to avoid memory leaks!
 *
 * 3. useCallback — memoize a function so it doesn't
 *    get recreated on every render. Important when
 *    passing callbacks to useEffect dependencies.
 *
 * 4. setInterval + clearInterval — the game loop.
 *    We store the interval ID in a ref so we can
 *    cancel it when the component unmounts.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import GamePageHeader from '../components/GamePageHeader'

const GRID = 20
const CELL = 24

// ── Helper: random food position not on snake ──
function placeFood(body) {
  let f
  do {
    f = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    }
  } while (body.some(s => s.x === f.x && s.y === f.y))
  return f
}

// ── Initial snake state ──
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
const INITIAL_VEL   = { x: 1, y: 0 }

export default function Snake({ onNavigate }) {
  // ── UI state (triggers re-renders when changed) ──
  const [score,   setScore]   = useState(0)
  const [best,    setBest]    = useState(0)
  const [level,   setLevel]   = useState(1)
  const [overlay, setOverlay] = useState({ visible: true, title: 'SNAKE', btnText: 'START GAME', showScore: false })

  /*
   * LEARNING: useRef for mutable game state
   * We DON'T use useState for snake/velocity/food because:
   * - We don't want a re-render every game tick (60fps would
   *   mean 60 re-renders per second — very expensive)
   * - Canvas is drawn imperatively, not via JSX
   * - Refs give us a "box" to store any mutable value
   */
  const canvasRef    = useRef(null)
  const intervalRef  = useRef(null)
  const snakeRef     = useRef([...INITIAL_SNAKE])
  const velRef       = useRef({ ...INITIAL_VEL })
  const nextVelRef   = useRef({ ...INITIAL_VEL })
  const foodRef      = useRef({ x: 5, y: 5 })
  const scoreRef     = useRef(0)
  const levelRef     = useRef(1)
  const runningRef   = useRef(false)

  // ── Canvas drawing function ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Clear + background
    ctx.fillStyle = '#04040f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines
    ctx.strokeStyle = 'rgba(57,255,110,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < GRID; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < GRID; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke()
    }

    // Food (glowing circle)
    const f = foodRef.current
    ctx.shadowColor = 'rgba(255,45,120,0.8)'
    ctx.shadowBlur  = 15
    ctx.fillStyle   = '#ff2d78'
    ctx.beginPath()
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Snake segments
    snakeRef.current.forEach((seg, i) => {
      const t = 1 - i / snakeRef.current.length
      ctx.shadowColor = `rgba(57,255,110,${t * 0.6})`
      ctx.shadowBlur  = t * 10
      ctx.fillStyle   = `rgba(57,255,110,${0.4 + t * 0.6})`
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
      if (i === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillRect(seg.x * CELL + 5, seg.y * CELL + 5, 4, 4)
      }
    })
    ctx.shadowBlur = 0
  }, [])

  // ── One game tick ──
  const step = useCallback(() => {
    velRef.current = { ...nextVelRef.current }
    const head = {
      x: snakeRef.current[0].x + velRef.current.x,
      y: snakeRef.current[0].y + velRef.current.y,
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      gameOver(); return
    }
    // Self collision
    if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
      gameOver(); return
    }

    const newSnake = [head, ...snakeRef.current]

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      // Ate food — grow + update score
      const newScore = scoreRef.current + 10 * levelRef.current
      scoreRef.current = newScore
      setScore(newScore)
      setBest(prev => Math.max(prev, newScore))

      const newLevel = Math.floor(newScore / 50) + 1
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel
        setLevel(newLevel)
        // Speed up: restart interval with new speed
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(step, Math.max(80, 200 - newLevel * 15))
      }
      foodRef.current = placeFood(newSnake)
    } else {
      newSnake.pop() // normal move — remove tail
    }

    snakeRef.current = newSnake
    draw()
  }, [draw])

  const gameOver = useCallback(() => {
    clearInterval(intervalRef.current)
    runningRef.current = false
    setOverlay({
      visible: true,
      title: 'GAME OVER',
      btnText: 'PLAY AGAIN',
      showScore: true,
      score: scoreRef.current,
    })
  }, [])

  const startGame = () => {
    // Reset all mutable refs
    snakeRef.current   = [...INITIAL_SNAKE.map(s => ({ ...s }))]
    velRef.current     = { ...INITIAL_VEL }
    nextVelRef.current = { ...INITIAL_VEL }
    foodRef.current    = placeFood(snakeRef.current)
    scoreRef.current   = 0
    levelRef.current   = 1

    setScore(0)
    setLevel(1)
    setOverlay({ visible: false })

    runningRef.current = true
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(step, 200)
  }

  // ── Direction input ──
  const changeDir = (dx, dy) => {
    // Prevent reversing
    if (dx !== 0 && velRef.current.x !== 0) return
    if (dy !== 0 && velRef.current.y !== 0) return
    nextVelRef.current = { x: dx, y: dy }
  }

  /*
   * LEARNING: useEffect for keyboard listeners
   * We add the listener once ([] dep array) and
   * MUST clean it up in the return function.
   * Without cleanup, old listeners pile up on re-renders.
   */
  useEffect(() => {
    const handleKey = (e) => {
      const map = {
        ArrowUp:    [0, -1],
        ArrowDown:  [0,  1],
        ArrowLeft:  [-1, 0],
        ArrowRight: [1,  0],
      }
      if (map[e.key]) {
        e.preventDefault()
        changeDir(...map[e.key])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)  // ← cleanup!
  }, [])

  // Draw initial grid when component mounts
  useEffect(() => {
    draw()
    /*
     * LEARNING: Cleanup on unmount
     * If the user navigates away, stop the interval.
     * Otherwise the game keeps ticking in the background.
     */
    return () => clearInterval(intervalRef.current)
  }, [draw])

  return (
    <div className="snake-page">
      <GamePageHeader title="SNAKE" color="green" onBack={() => { clearInterval(intervalRef.current); onNavigate('home') }} />

      <div className="game-container">
        <div className="snake-ui">
          {/* HUD */}
          <div className="snake-hud">
            <div className="snake-stat">
              <div className="snake-stat-label">Score</div>
              <div className="snake-stat-val">{score}</div>
            </div>
            <div className="snake-stat">
              <div className="snake-stat-label">Best</div>
              <div className="snake-stat-val">{best}</div>
            </div>
            <div className="snake-stat">
              <div className="snake-stat-label">Level</div>
              <div className="snake-stat-val">{level}</div>
            </div>
          </div>

          {/* Canvas wrapper */}
          <div className="snake-canvas-wrap">
            {/*
             * LEARNING: useRef on a DOM element
             * ref={canvasRef} makes canvasRef.current point
             * to the actual <canvas> DOM node. This lets us
             * call canvas.getContext('2d') imperatively.
             */}
            <canvas
              ref={canvasRef}
              id="snakeCanvas"
              width={GRID * CELL}
              height={GRID * CELL}
            />

            {/* Overlay */}
            {overlay.visible && (
              <div className="snake-overlay">
                <div className="overlay-title">{overlay.title}</div>
                <div className="overlay-score">
                  {overlay.showScore
                    ? `Score: ${overlay.score}`
                    : 'Use arrow keys or buttons below'}
                </div>
                <button className="snake-btn" onClick={startGame}>
                  {overlay.btnText}
                </button>
              </div>
            )}
          </div>

          {/* D-pad for mobile */}
          <div className="snake-controls">
            <button className="ctrl-up"    onClick={() => changeDir(0, -1)}>▲</button>
            <button className="ctrl-left"  onClick={() => changeDir(-1, 0)}>◀</button>
            <button className="ctrl-down"  onClick={() => changeDir(0, 1)}>▼</button>
            <button className="ctrl-right" onClick={() => changeDir(1, 0)}>▶</button>
          </div>
        </div>
      </div>
    </div>
  )
}
