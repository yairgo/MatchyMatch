import DarkModeToggle from './DarkModeToggle'

export default function Header({ activeGame, onGoHome, dark, onToggleDark }) {
  return (
    <header
      style={{
        background: "var(--bg-base)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "0.5px solid var(--separator)",
        opacity: 0.95,
      }}
      className="w-full sticky top-0 z-40"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Left: back button (when in a game) or spacer */}
        <div className="w-24 flex items-center">
          {activeGame ? (
            <button
              onClick={onGoHome}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-sm"
              aria-label="Back to game picker"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Games
            </button>
          ) : null}
        </div>

        {/* Centre: Wordmark */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 shrink-0 min-w-0 bg-transparent border-none cursor-pointer"
          aria-label="Go to game picker"
        >
          {/* App icon */}
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0, filter: "drop-shadow(0 3px 10px rgba(88,86,214,0.45))" }}
          >
            <defs>
              <linearGradient id="logo-bg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5e5ce6"/>
                <stop offset="100%" stopColor="#007aff"/>
              </linearGradient>
              <linearGradient id="logo-shine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </linearGradient>
              <clipPath id="logo-clip">
                <rect width="34" height="34" rx="9" ry="9"/>
              </clipPath>
            </defs>

            {/* Background */}
            <rect width="34" height="34" rx="9" ry="9" fill="url(#logo-bg)"/>

            {/* Shine overlay */}
            <rect width="34" height="17" rx="0" fill="url(#logo-shine)" clipPath="url(#logo-clip)"/>

            {/* Top-left tile — solid white (matched) */}
            <rect x="5" y="5" width="10" height="10" rx="2.5" fill="white" opacity="0.95"/>

            {/* Bottom-right tile — solid white (matched) */}
            <rect x="19" y="19" width="10" height="10" rx="2.5" fill="white" opacity="0.95"/>

            {/* Top-right tile — ghost (unmatched) */}
            <rect x="19" y="5" width="10" height="10" rx="2.5" fill="white" opacity="0.30"/>

            {/* Bottom-left tile — ghost (unmatched) */}
            <rect x="5" y="19" width="10" height="10" rx="2.5" fill="white" opacity="0.30"/>

            {/* Connecting arc between the two matched tiles */}
            <path
              d="M15 10 Q17 10 17 12 L17 22 Q17 24 19 24"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </svg>

          {/* Wordmark text */}
          <h1
            className="select-none leading-none"
            style={{
              fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #5e5ce6 0%, #007aff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Puzzlr
          </h1>
        </button>

        {/* Right: dark mode toggle (always visible) */}
        <div className="w-24 flex items-center justify-end">
          <DarkModeToggle dark={dark} onToggle={onToggleDark} />
        </div>

      </div>
    </header>
  )
}
