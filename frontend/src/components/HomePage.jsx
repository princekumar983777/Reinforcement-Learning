/*
 * ══════════════════════════════════════════════════
 *  HomePage.jsx  —  STEP 3: The Home Screen
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPT: Component Composition
 * -------------------------------------------------
 * HomePage is made of smaller components:
 *   - <nav> for the top bar
 *   - Hero section (JSX directly here)
 *   - <GameCard /> instances (imported component)
 *
 * We also define GAMES_DATA as a constant array
 * and use .map() to render all cards — rather than
 * writing each card by hand.
 *
 * LEARNING CONCEPT: Array.map() in JSX
 * -------------------------------------------------
 * .map() transforms each item in an array into JSX.
 * React needs a unique `key` prop on mapped elements
 * so it can efficiently update the DOM.
 */

import GameCard from './GameCard'

/*
 * Data lives outside the component — it never changes,
 * so there's no reason to put it inside.
 * Keeping static data separate keeps components clean.
 */
const GAMES_DATA = [
  {
    id:          'tictactoe',
    accent:      'cyan',
    tag:         'Strategy',
    title:       'Tic Tac Toe',
    description: 'Classic X vs O — battle a friend or rack up your wins in the neon grid.',
    icon:        '✕○',
    badge:       '2 Players',
  },
  {
    id:          'snake',
    accent:      'green',
    tag:         'Arcade',
    title:       'Snake',
    description: 'Guide the neon serpent through the grid. Eat, grow, survive.',
    icon:        '🐍',
    badge:       '1 Player',
  },
  {
    id:          'memory',
    accent:      'purple',
    tag:         'Puzzle',
    title:       'Memory Match',
    description: 'Flip cards, find pairs, test your recall. How few moves can you finish in?',
    icon:        '🧠',
    badge:       'Solo',
  },
  {
    id:          'game2048',
    accent:      'pink',
    tag:         'Strategy',
    title:       '2048',
    description: 'Slide and merge tiles to reach the legendary 2048 tile. Addictive and ruthless.',
    icon:        '2048',
    badge:       '1 Player',
  },
]

/*
 * LEARNING: Destructured Props
 * { onNavigate } unpacks the prop directly.
 * Same as writing: function HomePage(props) { props.onNavigate }
 */
export default function HomePage({ onNavigate }) {
  const scrollToGames = () => {
    document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home-page">
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="logo">GAME<span style={{ color: 'var(--cyan)' }}>VERSE</span></div>
        <div className="nav-links">
          <a>Arcade</a>
          <a>Leaderboard</a>
          <a>About</a>
          <a>Login</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Decorative background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: -1,
          }}
        >
          <svg
            viewBox="0 0 1400 400"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', opacity: 0.07 }}
          >
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,240,255,1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1400" height="400" fill="url(#grid)" />
          </svg>
        </div>

        <div className="hero-eyebrow">Arcade Collection</div>

        <h1>
          PLAY <span className="glow-cyan">BOLD</span>,<br />
          WIN <span className="glow-pink">LOUDER</span>
        </h1>

        <p>
          Four iconic games, one electric arena. No downloads, no logins — just pure pixel glory.
        </p>

        <button className="hero-btn" onClick={scrollToGames}>
          ▶ Browse Games
        </button>
      </section>

      {/* ── GAMES SECTION ── */}
      <div style={{ padding: '0 48px 16px' }} id="games-section">
        <div className="section-title">// Available Games</div>
      </div>

      {/*
       * LEARNING: .map() to render a list
       * For each game in GAMES_DATA, we return a <GameCard>.
       * The `key` prop must be unique — we use game.id.
       * `delay` staggers the float animation per card.
       */}
      <div className="games-grid">
        {GAMES_DATA.map((game, index) => (
          <GameCard
            key={game.id}
            accent={game.accent}
            tag={game.tag}
            title={game.title}
            description={game.description}
            icon={game.icon}
            badge={game.badge}
            gameId={game.id}
            onNavigate={onNavigate}
            delay={index * 0.5}
          />
        ))}
      </div>
    </div>
  )
}