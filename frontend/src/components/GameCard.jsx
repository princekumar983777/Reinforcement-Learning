/*
 * ══════════════════════════════════════════════════
 *  GameCard.jsx  —  STEP 2: Reusable Components
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPT: Props & Reusability
 * -------------------------------------------------
 * Instead of copy-pasting 4 game cards in HTML,
 * we build ONE GameCard component and pass different
 * data to each instance via props.
 *
 * Props are like function arguments — they let the
 * parent customize each child component.
 *
 * USAGE:
 *   <GameCard
 *     accent="cyan"
 *     tag="Strategy"
 *     title="Tic Tac Toe"
 *     description="Classic X vs O..."
 *     icon="✕○"
 *     badge="2 Players"
 *     gameId="tictactoe"
 *     onNavigate={navigate}
 *     delay={0}
 *   />
 */

export default function GameCard({
  accent,       // color theme: "cyan" | "pink" | "green" | "purple"
  tag,          // category label e.g. "Strategy"
  title,        // game name
  description,  // short desc
  icon,         // emoji or text icon
  badge,        // e.g. "2 Players"
  gameId,       // page id to navigate to
  onNavigate,   // function from App to change page
  delay = 0,    // animation stagger delay in seconds
}) {
  return (
    /*
     * LEARNING: data-* attributes
     * We use data-accent on the element so CSS can
     * target it with [data-accent="cyan"] selectors.
     * This drives all the color theming from CSS.
     */
    <div
      className="game-card"
      data-accent={accent}
      onClick={() => onNavigate(gameId)}
      /*
       * LEARNING: Inline styles for dynamic values
       * The animation delay is different per card,
       * so we set it as an inline style.
       * CSS classes handle everything static.
       */
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-art" data-accent={accent}>
        <span
          className="art-icon"
          style={{
            color: `var(--${accent})`,
            fontFamily: accent === 'pink' ? "'Orbitron', sans-serif" : undefined,
            fontSize:   accent === 'pink' ? '2rem' : undefined,
            fontWeight: accent === 'pink' ? '900'  : undefined,
          }}
        >
          {icon}
        </span>
      </div>

      <div className="card-body">
        <div className="card-tag">{tag}</div>
        <div className="card-title">{title}</div>
        <div className="card-desc">{description}</div>
        <div className="card-footer">
          <span className="badge">{badge}</span>
          {/*
           * LEARNING: stopPropagation
           * The whole card has an onClick that navigates.
           * Without stopPropagation, clicking this button
           * would ALSO trigger the card's onClick — double fire.
           * stopPropagation stops the click from "bubbling up."
           */}
          <button
            className="play-btn"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(gameId)
            }}
          >
            Play Now
          </button>
        </div>
      </div>
    </div>
  )
}