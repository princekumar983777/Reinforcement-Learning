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

import { useState, useEffect, useCallback } from 'react'
import GamePageHeader from '../components/GamePageHeader'
import tictactoeAPI from '../services/tictactoeAPI.js'
import '../css/TicTacToe.css'

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
  const [message,  setMessage] = useState({ text: "Welcome! Select who goes first.", cls: 'turn-x' })
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [stats, setStats] = useState({ states_learned: 0 })
  const [showStats, setShowStats] = useState(false)
  const [isAiTurn, setIsAiTurn] = useState(false)

  // Derived: which cells are in the winning combo (for highlighting)
  const winCombo = checkWinner(board)

  // Handle page unload - cleanup user sessions
  useEffect(() => {
    const handlePageUnload = () => {
      try {
        // Use navigator.sendBeacon for reliable cleanup during page unload
        // Note: sendBeacon doesn't support custom headers, so we'll use a simple approach
        const cleanupUrl = `${tictactoeAPI.baseURL}/tictactoe/cleanup/user`
        const data = new Blob([JSON.stringify({})], {
          type: 'application/json'
        })
        
        // sendBeacon automatically includes credentials for same-origin requests
        navigator.sendBeacon(cleanupUrl, data)
      } catch (error) {
        console.error('Failed to cleanup sessions on page unload:', error)
      }
    }

    const handleBeforeUnload = (event) => {
      // Call cleanup immediately
      handlePageUnload()
      
      // For modern browsers, we can also try async cleanup
      if (event.returnValue === undefined) {
        // Modern browser - we can try async cleanup
        tictactoeAPI.cleanupUserSessions().catch(console.error)
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handlePageUnload)

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handlePageUnload)
      
      // Also cleanup when component unmounts (user navigates away)
      if (gameStarted && tictactoeAPI.hasActiveSession()) {
        tictactoeAPI.cleanupUserSessions().catch(console.error)
      }
    }
  }, [gameStarted])

  const startNewGame = async (userFirst = true) => {
    try {
      setLoading(true)
      const response = await tictactoeAPI.startGame()
      
      setGameStarted(true)
      setBoard(Array(9).fill(null))
      setGameOver(false)
      
      if (userFirst) {
        setTurn('X')
        setMessage({ text: "Your turn (X)", cls: 'turn-x' })
        setIsAiTurn(false)
      } else {
        setTurn('O')
        setMessage({ text: "AI's turn (O)", cls: 'turn-o' })
        setIsAiTurn(true)
        // AI makes first move
        setTimeout(() => makeAiMove(Array(9).fill(null)), 500)
      }
      
      await loadStats()
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, cls: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const makeAiMove = async (currentBoard) => {
    if (gameOver) return
    
    try {
      setLoading(true)
      const response = await tictactoeAPI.makeMove(currentBoard)
      
      const newBoard = response.board
      setBoard(newBoard)
      
      if (response.game_over) {
        handleGameEnd(response)
      } else {
        setTurn('X')
        setMessage({ text: "Your turn (X)", cls: 'turn-x' })
        setIsAiTurn(false)
      }
    } catch (error) {
      setMessage({ text: `AI Error: ${error.message}`, cls: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = async (index) => {
    // Guard: ignore clicks on taken cells, when game is over, during AI turn, or before game starts
    if (gameOver || board[index] || isAiTurn || !gameStarted || loading) return

    /*
     * LEARNING: Immutable state update
     * We NEVER do board[index] = turn (mutation).
     * Instead we create a NEW array with the spread operator,
     * then update the copy, then call setBoard with the copy.
     */
    const newBoard = [...board]
    newBoard[index] = 'X' // Human is always X

    const winner = checkWinner(newBoard)

    if (winner) {
      // Human won
      setBoard(newBoard)
      setGameOver(true)
      setMessage({
        text: "You WIN!",
        cls:  'win-x',
      })
      setScores(prev => ({ ...prev, X: prev.X + 1 }))
      await endGameWithResult('win')
    } else if (newBoard.every(Boolean)) {
      // Draw
      setBoard(newBoard)
      setGameOver(true)
      setMessage({ text: 'DRAW!', cls: 'draw' })
      setScores(prev => ({ ...prev, D: prev.D + 1 }))
      await endGameWithResult('draw')
    } else {
      // Continue — AI's turn
      setBoard(newBoard)
      setTurn('O')
      setMessage({ text: "AI's turn (O)", cls: 'turn-o' })
      setIsAiTurn(true)
      // Make AI move after a short delay
      setTimeout(() => makeAiMove(newBoard), 500)
    }
  }

  const handleGameEnd = (response) => {
    setGameOver(true)
    
    if (response.result === 'ai_win') {
      setMessage({ text: "AI WINS!", cls: 'win-o' })
      setScores(prev => ({ ...prev, O: prev.O + 1 }))
    } else if (response.result === 'draw') {
      setMessage({ text: 'DRAW!', cls: 'draw' })
      setScores(prev => ({ ...prev, D: prev.D + 1 }))
    }
  }

  const endGameWithResult = async (result) => {
    try {
      await tictactoeAPI.endGame(result)
      await loadStats()
    } catch (error) {
      console.error('Failed to end game:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await tictactoeAPI.getStats()
      setStats(response)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const resetQTable = async () => {
    if (!confirm('Are you sure you want to reset the AI learning? This cannot be undone.')) {
      return
    }
    
    try {
      setLoading(true)
      await tictactoeAPI.resetQTable()
      setMessage({ text: 'AI learning reset successfully!', cls: 'success' })
      await loadStats()
    } catch (error) {
      setMessage({ text: `Reset Error: ${error.message}`, cls: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const resetRound = () => {
    tictactoeAPI.clearSession()
    setGameStarted(false)
    setBoard(Array(9).fill(null))
    setTurn('X')
    setGameOver(false)
    setMessage({ text: "Welcome! Select who goes first.", cls: 'turn-x' })
    setIsAiTurn(false)
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
            <div className="score-label">You (X)</div>
            <div className="score-val">{scores.X}</div>
          </div>

          <div className="ttt-score-box draws">
            <div className="score-label">Draws</div>
            <div className="score-val">{scores.D}</div>
          </div>

          <div
            className={`ttt-score-box player-o ${turn === 'O' && !gameOver ? 'active-player' : ''}`}
          >
            <div className="score-label">AI (O)</div>
            <div className="score-val">{scores.O}</div>
          </div>
        </div>

        {/* ── STATUS MESSAGE ── */}
        <div className={`ttt-message ${message.cls}`}>
          {loading && <span className="loading-spinner">⏳ </span>}
          {message.text}
        </div>

        {/* ── GAME START SELECTION ── */}
        {!gameStarted && (
          <div className="game-start-selection">
            <p className="selection-prompt">Who should go first?</p>
            <div className="selection-buttons">
              <button 
                className="btn-cyan" 
                onClick={() => startNewGame(true)}
                disabled={loading}
              >
                You First (X)
              </button>
              <button 
                className="btn-purple" 
                onClick={() => startNewGame(false)}
                disabled={loading}
              >
                AI First (O)
              </button>
            </div>
          </div>
        )}

        {/* ── BOARD ── */}
        {gameStarted && (
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
                  loading || isAiTurn ? 'disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleCellClick(i)}
              >
                {cell}
              </div>
            ))}
          </div>
        )}

        {/* ── GAME CONTROLS ── */}
        {gameStarted && (
          <div className="game-controls">
            <button className="ttt-reset btn-cyan" onClick={resetRound}>
              New Game
            </button>
            
            <button 
              className="btn-stats" 
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
            
            <button 
              className="btn-reset-ai btn-red" 
              onClick={resetQTable}
              disabled={loading}
            >
              Reset AI
            </button>
          </div>
        )}

        {/* ── STATS DISPLAY ── */}
        {showStats && (
          <div className="stats-panel">
            <h3>AI Learning Stats</h3>
            <p>States Learned: <strong>{stats.states_learned}</strong></p>
            <p>User ID: <strong>{stats.user_id || 'Guest'}</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}