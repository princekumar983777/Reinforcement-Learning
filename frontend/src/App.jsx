/*
 * ══════════════════════════════════════════════════
 *  App.jsx  —  STEP 1: The Root Component
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPT: "Lifting State Up"
 * -------------------------------------------------
 * Instead of using React Router (which adds complexity),
 * we manage which page is visible using a single
 * useState hook right here in App.
 *
 * Any child component that needs to navigate just
 * calls onNavigate('home') — the page string bubbles
 * up and App decides what to render.
 *
 * This pattern is great for small apps and teaches
 * the core React concept of "lifting state up."
 */

import { useState } from 'react'
import './App.css'

// ── Import all page/game components
import HomePage    from './components/HomePage'
import TicTacToe   from './games/Tictaktoe'
import Snake       from './games/Snake'
import MemoryMatch from './games/MemoryMatch'
import Game2048    from './games/Game2048'

export default function App() {
  /*
   * LEARNING: useState
   * useState(initialValue) returns [currentValue, setter]
   * When you call setPage('snake'), React re-renders
   * the component and currentPage becomes 'snake'.
   */
  const [currentPage, setCurrentPage] = useState('home')

  /*
   * This function is passed DOWN to child components
   * as a prop called onNavigate. Children call it to
   * change which page is displayed.
   */
  const navigate = (page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  /*
   * LEARNING: Conditional Rendering
   * We render different components based on currentPage.
   * This is simpler than a router for a small app.
   */
  return (
    <div className="page-enter">
      {currentPage === 'home'     && <HomePage    onNavigate={navigate} />}
      {currentPage === 'tictactoe'&& <TicTacToe   onNavigate={navigate} />}
      {currentPage === 'snake'    && <Snake        onNavigate={navigate} />}
      {currentPage === 'memory'   && <MemoryMatch  onNavigate={navigate} />}
      {currentPage === 'game2048' && <Game2048     onNavigate={navigate} />}
    </div>
  )
}