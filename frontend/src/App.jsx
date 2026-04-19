
import { useState } from 'react'
import './App.css'

// ── Import all page/game components
import HomePage    from './components/HomePage'
import TicTacToe   from './games/Tictaktoe'
import Snake       from './games/Snake'
import MemoryMatch from './games/MemoryMatch'
import Game2048    from './games/Game2048'


export default function App() {

  const [currentPage, setCurrentPage] = useState('home')


  const navigate = (page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }
  
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