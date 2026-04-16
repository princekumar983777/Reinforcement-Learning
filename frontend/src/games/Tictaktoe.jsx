/*
 * ══════════════════════════════════════════════════
 *  TicTacToe.jsx  —  STEP 4: Game State with useState
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPTS:
 * ------------------
 * 1. Multiple useState hooks — each piece of state
 *    gets its own hook. Keep state small and focused.
 *
 * 2. Derived state — don't store things you can
 *    CALCULATE from existing state. `isGameOver`
 *    is derived, not stored separately.
 *
 * 3. Immutable state updates — NEVER mutate state
 *    directly. Create a new array with the spread
 *    operator: [...board] then modify the copy.
 *
 * 4. Pure helper functions — checkWinner() is a
 *    pure function (no side effects, same input →
 *    same output). Keep game logic pure & testable.
 */

import { useState } from 'react'
import GamePageHeader from '../components/GamePageHeader'

// ── CONSTANTS (never change, so outside component) ──
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
]

// ── PURE HELPER: returns winning combo or null ──
function checkWinner(board) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c]
    }
  }
  return null
}

// ── INITIAL STATE FACTORY ──
// Using a function avoids recreating this object on every render
const makeBoard = () => Array(9).fill(null)

export default function TicTacToe({ onNavigate }) {
  /*
   * LEARNING: Multiple useState hooks
   * Each logical piece of state is separate.
   * This makes updates cleaner and more readable.
   */
  const [board,    setBoard]   = useState(makeBoard)
  const [turn,     setTurn]    = useState('X')       // whose turn
  const [scores,   setScores]  = useState({ X: 0, O: 0, D: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [message,  setMessage] = useState({ text: "X's Turn", cls: 'turn-x' })

  // Derived: which cells are in the winning combo (for highlighting)
  const winCombo = checkWinner(board)

  const handleCellClick = (index) => {
    // Guard: ignore clicks on taken cells or when game is over
    if (gameOver || board[index]) return

    /*
     * LEARNING: Immutable state update
     * We NEVER do board[index] = turn (mutation).
     * Instead we create a NEW array with the spread operator,
     * then update the copy, then call setBoard with the copy.
     */
    const newBoard = [...board]
    newBoard[index] = turn

    const winner = checkWinner(newBoard)

    if (winner) {
      // Someone won
      setBoard(newBoard)
      setGameOver(true)
      setMessage({
        text: `${turn} WINS!`,
        cls:  `win-${turn.toLowerCase()}`,
      })
      /*
       * LEARNING: Functional setState
       * When the new state depends on the old state,
       * pass a function to the setter. This guarantees
       * you're reading the latest state value.
       */
      setScores(prev => ({ ...prev, [turn]: prev[turn] + 1 }))
    } else if (newBoard.every(Boolean)) {
      // Draw
      setBoard(newBoard)
      setGameOver(true)
      setMessage({ text: 'DRAW!', cls: 'draw' })
      setScores(prev => ({ ...prev, D: prev.D + 1 }))
    } else {
      // Continue — switch turn
      const nextTurn = turn === 'X' ? 'O' : 'X'
      setBoard(newBoard)
      setTurn(nextTurn)
      setMessage({
        text: `${nextTurn}'s Turn`,
        cls:  `turn-${nextTurn.toLowerCase()}`,
      })
    }
  }

  const resetRound = () => {
    setBoard(makeBoard())
    setTurn('X')
    setGameOver(false)
    setMessage({ text: "X's Turn", cls: 'turn-x' })
  }

  return (
    <div className="ttt-page">
      <GamePageHeader title="TIC TAC TOE" color="cyan" onBack={() => onNavigate('home')} />

      <div className="game-container">
        {/* ── SCOREBOARD ── */}
        <div className="ttt-status-bar">
          <div
            className={`ttt-score-box player-x ${turn === 'X' && !gameOver ? 'active-player' : ''}`}
          >
            <div className="score-label">Player X</div>
            <div className="score-val">{scores.X}</div>
          </div>

          <div className="ttt-score-box draws">
            <div className="score-label">Draws</div>
            <div className="score-val">{scores.D}</div>
          </div>

          <div
            className={`ttt-score-box player-o ${turn === 'O' && !gameOver ? 'active-player' : ''}`}
          >
            <div className="score-label">Player O</div>
            <div className="score-val">{scores.O}</div>
          </div>
        </div>

        {/* ── STATUS MESSAGE ── */}
        <div className={`ttt-message ${message.cls}`}>{message.text}</div>

        {/* ── BOARD ── */}
        <div className="ttt-board">
          {/*
           * LEARNING: Array.from() to generate a list
           * board is an array of 9 items. We map each
           * to a cell element. Index is used for the key.
           */}
          {board.map((cell, i) => (
            <div
              key={i}
              className={[
                'ttt-cell',
                cell ? cell.toLowerCase() : '',   // 'x' or 'o' for styling
                cell ? 'taken' : '',
                winCombo?.includes(i) ? 'win-cell' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCellClick(i)}
            >
              {cell}
            </div>
          ))}
        </div>

        <button className="ttt-reset btn-cyan" onClick={resetRound}>
          New Round
        </button>
      </div>
    </div>
  )
}