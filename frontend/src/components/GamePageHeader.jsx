/*
 * ══════════════════════════════════════════════════
 *  GamePageHeader.jsx  —  Shared Header Component
 * ══════════════════════════════════════════════════
 *
 * LEARNING CONCEPT: DRY — Don't Repeat Yourself
 * -------------------------------------------------
 * Every game page has the same sticky header with
 * a back button and a title. Instead of copy-pasting
 * this into all 4 game components, we extract it
 * into one shared component.
 *
 * This is one of the most important habits in React.
 */

export default function GamePageHeader({ title, color, onBack }) {
  return (
    <div className="game-page-header">
      <button className="back-btn" onClick={onBack}>
        {/* Inline SVG arrow — no image files needed */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back
      </button>
      <div className="page-logo" style={{ color: `var(--${color})` }}>
        {title}
      </div>
    </div>
  )
}