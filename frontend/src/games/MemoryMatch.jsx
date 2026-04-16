

import { useState, useEffect, useRef } from 'react'
import GamePageHeader from '../components/GamePageHeader'

const ICONS = ['🎮', '🚀', '⚡', '🔥', '💎', '🌈', '🎯', '🏆']

// ── Create shuffled deck ──
function makeDeck() {
  return [...ICONS, ...ICONS]
    .sort(() => Math.random() - 0.5)
    .map((icon, i) => ({
      id:      i,       // unique id per card
      icon,             // which emoji
      flipped: false,   // is face-up?
      matched: false,   // is permanently matched?
    }))
}

export default function MemoryMatch({ onNavigate }) {
  const [cards,   setCards]   = useState(makeDeck)
  const [flipped, setFlipped] = useState([])   // ids of currently face-up cards
  const [moves,   setMoves]   = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [locked,  setLocked]  = useState(false)

  // Refs for cleanup
  const timerRef   = useRef(null)
  const timeoutRef = useRef(null)

  // Derived state — count matched pairs
  const matchedCount = cards.filter(c => c.matched).length / 2

  // ── TIMER ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)  // cleanup on unmount
  }, [])

  // Stop timer when all pairs found
  useEffect(() => {
    if (matchedCount === ICONS.length) {
      clearInterval(timerRef.current)
    }
  }, [matchedCount])

  // ── CARD CLICK HANDLER ──
  const handleCardClick = (card) => {
    // Guard: ignore locked board, already flipped, or matched
    if (locked || card.flipped || card.matched) return

    /*
     * Flip this card face-up
     * LEARNING: .map() to update one item in an array.
     * We create a new array where only the clicked card
     * is changed — everything else stays the same.
     */
    const newCards = cards.map(c =>
      c.id === card.id ? { ...c, flipped: true } : c
    )
    setCards(newCards)

    const newFlipped = [...flipped, card.id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)

      const [id1, id2] = newFlipped
      const card1 = newCards.find(c => c.id === id1)
      const card2 = newCards.find(c => c.id === id2)

      if (card1.icon === card2.icon) {
        // MATCH — mark both as matched
        setCards(prev =>
          prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, matched: true } : c
          )
        )
        setFlipped([])
        setLocked(false)
      } else {
        // NO MATCH — flip back after delay
        timeoutRef.current = setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === id1 || c.id === id2 ? { ...c, flipped: false } : c
            )
          )
          setFlipped([])
          setLocked(false)
        }, 900)
      }
    }
  }

  // ── NEW GAME ──
  const newGame = () => {
    clearInterval(timerRef.current)
    clearTimeout(timeoutRef.current)
    setCards(makeDeck())
    setFlipped([])
    setMoves(0)
    setSeconds(0)
    setLocked(false)
    // Restart timer
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="memory-page">
      <GamePageHeader title="MEMORY MATCH" color="purple" onBack={() => onNavigate('home')} />

      <div className="game-container">
        {/* HUD */}
        <div className="memory-hud">
          <div className="memory-stat">
            <div className="memory-stat-label">Moves</div>
            <div className="memory-stat-val">{moves}</div>
          </div>
          <div className="memory-stat">
            <div className="memory-stat-label">Pairs</div>
            <div className="memory-stat-val">{matchedCount}/{ICONS.length}</div>
          </div>
          <div className="memory-stat">
            <div className="memory-stat-label">Time</div>
            <div className="memory-stat-val">{seconds}s</div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="memory-grid">
          {cards.map(card => (
            <div
              key={card.id}
              className={`mem-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              {/* Back face (shows when card is face-down) */}
              <div className="mem-card-face mem-card-back" />
              {/* Front face (shows when card is flipped) */}
              <div className="mem-card-face mem-card-front">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        <button className="memory-reset" onClick={newGame}>
          New Game
        </button>
      </div>
    </div>
  )
}
