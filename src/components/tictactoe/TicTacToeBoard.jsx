import { useState, useCallback } from 'react'

// ── Single cell ───────────────────────────────────────────────────

function Cell({ value, onClick, disabled }) {
  const isX = value === 'X'
  const isO = value === 'O'

  return (
    <button
      onClick={onClick}
      disabled={disabled || value !== null}
      aria-label={value || 'Empty cell'}
      className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        cursor: disabled || value !== null ? 'default' : 'pointer',
        borderRadius: 12,
        background: 'var(--bg-surface)',
        border: '2px solid var(--fill-tertiary)',
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        fontWeight: 700,
        color: isX ? '#0a84ff' : isO ? '#ff6b6b' : 'transparent',
        transition: 'all 0.2s ease',
        transform: value ? 'scale(0.95)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && value === null) {
          e.target.style.background = 'var(--fill-secondary)'
          e.target.style.borderColor = 'var(--accent)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && value === null) {
          e.target.style.background = 'var(--bg-surface)'
          e.target.style.borderColor = 'var(--fill-tertiary)'
        }
      }}
    >
      {value}
    </button>
  )
}

// ── Win screen ────────────────────────────────────────────────────

function WinScreen({ winner, onPlayAgain }) {
  const isDraw = winner === 'draw'
  const isXWin = winner === 'X'

  const rating = isXWin
    ? { emoji: '🎉', label: 'You Win!', color: '#0a84ff' }
    : isDraw
      ? { emoji: '🤝', label: "It's a Draw!", color: '#ff9f0a' }
      : { emoji: '🤖', label: 'AI Wins!', color: '#ff6b6b' }

  return (
    <div
      className="spring-pop flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-auto"
      style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: `linear-gradient(145deg, ${rating.color}, ${rating.color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          boxShadow: `0 8px 24px ${rating.color}40`,
        }}
      >
        {rating.emoji}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--label-primary)',
          }}
        >
          {rating.label}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--label-tertiary)' }}>
          {isDraw
            ? 'Great match!'
            : isXWin
              ? 'You beat the AI!'
              : 'Better luck next time!'}
        </p>
      </div>

      <button onClick={onPlayAgain} className="btn-primary w-full">
        Play Again
      </button>
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────

function StatsBar({ playerWins, aiWins, draws }) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {[
        { label: 'You', value: playerWins, color: '#0a84ff' },
        { label: 'Draws', value: draws, color: '#ff9f0a' },
        { label: 'AI', value: aiWins, color: '#ff6b6b' },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
          style={{ background: 'var(--fill-tertiary)' }}
        >
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: color,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--label-tertiary)',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── AI logic ──────────────────────────────────────────────────────

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let line of lines) {
    const [a, b, c] = line
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

function getAIMove(squares) {
  // Check if AI can win
  for (let i = 0; i < 9; i++) {
    if (squares[i] === null) {
      const testSquares = [...squares]
      testSquares[i] = 'O'
      if (calculateWinner(testSquares) === 'O') {
        return i
      }
    }
  }

  // Check if player can win, block them
  for (let i = 0; i < 9; i++) {
    if (squares[i] === null) {
      const testSquares = [...squares]
      testSquares[i] = 'X'
      if (calculateWinner(testSquares) === 'X') {
        return i
      }
    }
  }

  // Take center if available
  if (squares[4] === null) return 4

  // Take corners
  const corners = [0, 2, 6, 8]
  const availableCorners = corners.filter((i) => squares[i] === null)
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)]
  }

  // Take any available space
  const available = squares
    .map((val, idx) => (val === null ? idx : null))
    .filter((val) => val !== null)
  return available[Math.floor(Math.random() * available.length)]
}

// ── Main board ────────────────────────────────────────────────────

export default function TicTacToeBoard() {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [gameState, setGameState] = useState('playing') // 'playing' | 'won'
  const [playerWins, setPlayerWins] = useState(0)
  const [aiWins, setAiWins] = useState(0)
  const [draws, setDraws] = useState(0)
  const [isAIThinking, setIsAIThinking] = useState(false)


  const handleCellClick = useCallback(
    (index) => {
      if (isAIThinking || gameState === 'won' || squares[index] !== null) return

      // Player move
      const newSquares = [...squares]
      newSquares[index] = 'X'
      setSquares(newSquares)

      const playerWinner = calculateWinner(newSquares)
      if (playerWinner === 'X') {
        setGameState('won')
        setPlayerWins((w) => w + 1)
        return
      }

      if (newSquares.every((sq) => sq !== null)) {
        setGameState('won')
        setDraws((d) => d + 1)
        return
      }

      // AI move
      setIsAIThinking(true)
      setTimeout(() => {
        const aiMove = getAIMove(newSquares)
        newSquares[aiMove] = 'O'
        setSquares(newSquares)

        const aiWinner = calculateWinner(newSquares)
        if (aiWinner === 'O') {
          setGameState('won')
          setAiWins((w) => w + 1)
        } else if (newSquares.every((sq) => sq !== null)) {
          setGameState('won')
          setDraws((d) => d + 1)
        }

        setIsAIThinking(false)
      }, 500)
    },
    [squares, gameState, isAIThinking]
  )

  const handlePlayAgain = () => {
    setSquares(Array(9).fill(null))
    setGameState('playing')
    setIsAIThinking(false)
  }

  const handleReset = () => {
    setSquares(Array(9).fill(null))
    setGameState('playing')
    setPlayerWins(0)
    setAiWins(0)
    setDraws(0)
    setIsAIThinking(false)
  }

  // ── Won screen ───────────────────────────────────────────────────
  if (gameState === 'won') {
    let resultWinner = 'draw'
    if (calculateWinner(squares) === 'X') {
      resultWinner = 'X'
    } else if (calculateWinner(squares) === 'O') {
      resultWinner = 'O'
    }

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12">
        <WinScreen winner={resultWinner} onPlayAgain={handlePlayAgain} />

        {/* Stats */}
        <div className="w-full flex flex-col gap-3">
          <p
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--label-tertiary)',
              textAlign: 'center',
            }}
          >
            Score
          </p>
          <StatsBar playerWins={playerWins} aiWins={aiWins} draws={draws} />
        </div>

        <button onClick={handleReset} className="btn-ghost">
          Reset Score
        </button>
      </div>
    )
  }

  // ── Playing screen ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-12">
      {/* Title */}
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--label-primary)',
          textAlign: 'center',
        }}
      >
        Tic Tac Toe with Brian 🧠
      </h1>

      {/* Stats */}
      <StatsBar playerWins={playerWins} aiWins={aiWins} draws={draws} />

      {/* Status */}
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: isAIThinking ? 'var(--label-secondary)' : 'var(--label-primary)',
          textAlign: 'center',
          minHeight: 24,
        }}
      >
        {isAIThinking ? '🤖 AI is thinking...' : 'Your turn (X)'}
      </div>

      {/* Grid — 3x3 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 2vw, 12px)',
          width: '100%',
          maxWidth: 300,
        }}
      >
        {squares.map((value, index) => (
          <Cell
            key={index}
            value={value}
            onClick={() => handleCellClick(index)}
            disabled={isAIThinking || gameState === 'won'}
          />
        ))}
      </div>

      {/* Hint text */}
      <p
        className="text-center"
        style={{
          fontSize: '0.78rem',
          color: 'var(--label-tertiary)',
          letterSpacing: '-0.01em',
          maxWidth: 300,
        }}
      >
        Use your brain to beat Brian! Can you get a perfect score?
      </p>

      {/* New game button */}
      <button onClick={handlePlayAgain} className="btn-ghost">
        🔀 New Game
      </button>
    </div>
  )
}

