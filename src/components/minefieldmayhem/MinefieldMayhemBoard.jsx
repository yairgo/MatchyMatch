import { useState, useCallback, useEffect, useRef } from 'react'
import './minefieldmayhem.css'
import {
  DIFFICULTIES,
  MAYHEM_INTERVAL_MS,
  ADJ_COLORS,
  buildEmptyGrid,
  placeMines,
  driftOneMine,
  revealFrom,
  revealAllMines,
  checkWin,
  flagsRemaining,
} from '../../data/minefieldMayhemData'

// ── Single cell ───────────────────────────────────────────────────────────────

function Cell({ cell, onReveal, onFlag, gameOver, flashKey }) {
  // Long-press support for mobile flagging
  const pressTimer = useRef(null)

  const handleTouchStart = (e) => {
    if (cell.revealed || gameOver) return
    pressTimer.current = setTimeout(() => {
      onFlag(cell.row, cell.col)
    }, 500)
  }

  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current)
  }

  const handleClick = (e) => {
    e.preventDefault()
    if (!cell.revealed && !cell.flagged && !gameOver) onReveal(cell.row, cell.col)
  }

  const handleContext = (e) => {
    e.preventDefault()
    if (!cell.revealed && !gameOver) onFlag(cell.row, cell.col)
  }

  let content = null
  let bg = 'var(--fill-tertiary)'
  let border = '2px solid var(--separator)'
  let cursor = 'pointer'

  if (cell.revealed) {
    bg = 'var(--bg-surface)'
    border = '1px solid var(--separator)'
    cursor = 'default'
    if (cell.mine) {
      bg = '#ff3b30'
      content = '💣'
    } else if (cell.adjacent > 0) {
      content = (
        <span style={{ color: ADJ_COLORS[cell.adjacent] ?? '#333', fontWeight: 800 }}>
          {cell.adjacent}
        </span>
      )
    }
  } else if (cell.flagged) {
    content = '🚩'
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className={flashKey ? 'drift-flash' : ''}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border,
        borderRadius: 4,
        cursor,
        fontSize: 'clamp(0.55rem, 2.2vw, 0.85rem)',
        fontWeight: 700,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background 0.1s ease',
      }}
    >
      {content}
    </div>
  )
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function MinefieldMayhemBoard() {
  const [diffIdx, setDiffIdx] = useState(0)
  const diff = DIFFICULTIES[diffIdx]

  const [grid, setGrid] = useState(() => buildEmptyGrid(diff.rows, diff.cols))
  const [minesPlaced, setMinesPlaced] = useState(false)
  const [gameState, setGameState] = useState('playing') // 'playing' | 'won' | 'lost'
  const [time, setTime] = useState(0)
  const [mayhemOn, setMayhemOn] = useState(false)
  const [driftCount, setDriftCount] = useState(0)

  // Refs so interval callbacks always see fresh values without re-registering
  const timerIdRef = useRef(null)
  const mayhemIdRef = useRef(null)
  const gridRef = useRef(grid)
  const gameStateRef = useRef(gameState)
  const diffRef = useRef(diff)

  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { diffRef.current = diff }, [diff])

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerIdRef.current) return
    timerIdRef.current = setInterval(() => setTime((t) => t + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    clearInterval(timerIdRef.current)
    timerIdRef.current = null
  }, [])

  // ── Mayhem drift interval ──────────────────────────────────────────────────
  const startMayhem = useCallback(() => {
    if (mayhemIdRef.current) return
    mayhemIdRef.current = setInterval(() => {
      if (gameStateRef.current !== 'playing') return
      const d = diffRef.current
      setGrid((prev) => {
        const next = driftOneMine(prev, d.rows, d.cols)
        gridRef.current = next
        return next
      })
      setDriftCount((n) => n + 1)
    }, MAYHEM_INTERVAL_MS)
  }, [])

  const stopMayhem = useCallback(() => {
    clearInterval(mayhemIdRef.current)
    mayhemIdRef.current = null
  }, [])

  // Keep mayhem interval in sync with the toggle
  useEffect(() => {
    if (mayhemOn && minesPlaced && gameState === 'playing') {
      startMayhem()
    } else {
      stopMayhem()
    }
    return stopMayhem
  }, [mayhemOn, minesPlaced, gameState, startMayhem, stopMayhem])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = useCallback(
    (newDiffIdx = diffIdx, keepMayhem = mayhemOn) => {
      stopTimer()
      stopMayhem()
      const d = DIFFICULTIES[newDiffIdx]
      const fresh = buildEmptyGrid(d.rows, d.cols)
      setGrid(fresh)
      gridRef.current = fresh
      setMinesPlaced(false)
      setGameState('playing')
      gameStateRef.current = 'playing'
      setTime(0)
      setDriftCount(0)
      // Mayhem restarts automatically via the useEffect above once minesPlaced flips
      if (!keepMayhem) stopMayhem()
    },
    [diffIdx, mayhemOn, stopTimer, stopMayhem]
  )

  const handleDiffChange = (idx) => {
    setDiffIdx(idx)
    resetGame(idx, mayhemOn)
  }

  const handleMayhemToggle = () => {
    setMayhemOn((prev) => !prev)
  }

  // ── Reveal ─────────────────────────────────────────────────────────────────
  const handleReveal = useCallback(
    (row, col) => {
      if (gameState !== 'playing') return

      let currentGrid = grid

      // First click — place mines and start timer
      if (!minesPlaced) {
        currentGrid = placeMines(
          grid,
          diff.rows,
          diff.cols,
          diff.mines,
          row,
          col
        )
        setMinesPlaced(true)
        startTimer()
        // Mayhem starts via useEffect watching minesPlaced
      }

      if (currentGrid[row][col].mine) {
        const blasted = revealAllMines(currentGrid)
        setGrid(blasted)
        setGameState('lost')
        gameStateRef.current = 'lost'
        stopTimer()
        stopMayhem()
        return
      }

      const next = revealFrom(currentGrid, diff.rows, diff.cols, row, col)
      setGrid(next)
      gridRef.current = next

      if (checkWin(next)) {
        setGameState('won')
        gameStateRef.current = 'won'
        stopTimer()
        stopMayhem()
      }
    },
    [gameState, grid, minesPlaced, diff, startTimer, stopTimer, stopMayhem]
  )

  // ── Flag ───────────────────────────────────────────────────────────────────
  const handleFlag = useCallback(
    (row, col) => {
      if (gameState !== 'playing') return
      setGrid((prev) =>
        prev.map((r) =>
          r.map((cell) =>
            cell.row === row && cell.col === col
              ? { ...cell, flagged: !cell.flagged }
              : cell
          )
        )
      )
    },
    [gameState]
  )

  // Cleanup on unmount
  useEffect(() => () => { stopTimer(); stopMayhem() }, [stopTimer, stopMayhem])

  const flags = flagsRemaining(grid, diff.mines)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-4xl mx-auto px-2 sm:px-4 pt-4 pb-12">

      {/* Title row */}
      <div className="w-full flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: '#c62828',
                lineHeight: 1,
              }}
            >
              Minefield Mayhem
            </h1>
            {/* Mayhem toggle badge */}
            <button
              className={`mayhem-badge mayhem-toggle ${mayhemOn ? '' : 'mayhem-badge--off'}`}
              onClick={handleMayhemToggle}
              title="Toggle Mayhem mode — mines drift every few seconds!"
            >
              {mayhemOn ? '🌪 MAYHEM ON' : '🌪 MAYHEM OFF'}
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--label-tertiary)' }}>
            Right-click / long-press to flag · {mayhemOn ? `Mines drift every ${MAYHEM_INTERVAL_MS / 1000}s 😈` : 'Toggle MAYHEM for drifting mines'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3 items-center flex-wrap">
          {mayhemOn && (
            <div
              className="flex flex-col items-center px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,59,48,0.12)', minWidth: 56 }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#c62828' }}>
                🌪 {driftCount}
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--label-tertiary)' }}>
                Drifts
              </span>
            </div>
          )}
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--fill-tertiary)', minWidth: 56 }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--label-primary)' }}>
              🚩 {flags}
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--label-tertiary)' }}>
              Flags
            </span>
          </div>
          <div
            className="flex flex-col items-center px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--fill-tertiary)', minWidth: 56 }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--label-primary)' }}>
              ⏱ {time}s
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--label-tertiary)' }}>
              Time
            </span>
          </div>
        </div>
      </div>

      {/* Difficulty + New Game */}
      <div className="w-full flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTIES.map((d, i) => (
            <button
              key={d.label}
              onClick={() => handleDiffChange(i)}
              className={i === diffIdx ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => resetGame()}
          className="btn-ghost"
          style={{ fontSize: '0.8rem', padding: '7px 14px' }}
        >
          New Game
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${diff.cols}, minmax(0, 1fr))`,
            gap: 2,
            minWidth: diff.cols * 24,
          }}
        >
          {grid.flat().map((cell) => (
            <Cell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              onReveal={handleReveal}
              onFlag={handleFlag}
              gameOver={gameState !== 'playing'}
              flashKey={null}
            />
          ))}
        </div>
      </div>

      {/* Won overlay */}
      {gameState === 'won' && (
        <div
          className="spring-pop fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div
              style={{
                width: 80, height: 80, borderRadius: 22,
                background: 'linear-gradient(145deg, #34c759, #30d158)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, boxShadow: '0 8px 28px rgba(52,199,89,0.45)',
              }}
            >
              🎉
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--label-primary)' }}>
                Cleared it!
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--label-tertiary)' }}>
                {diff.label}{mayhemOn ? ' · Mayhem' : ''} · {time}s
                {mayhemOn && driftCount > 0 && ` · ${driftCount} drift${driftCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={() => resetGame()} className="btn-primary" style={{ width: '100%' }}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Lost overlay */}
      {gameState === 'lost' && (
        <div
          className="spring-pop fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div
              style={{
                width: 80, height: 80, borderRadius: 22,
                background: 'linear-gradient(145deg, #ff6b6b, #ff3b30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, boxShadow: '0 8px 24px rgba(255,59,48,0.4)',
              }}
            >
              💣
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--label-primary)' }}>
                BOOM!
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--label-tertiary)' }}>
                {mayhemOn ? 'A drifting mine got you. 😈' : 'You hit a mine. Better luck next time.'}
              </p>
            </div>
            <button onClick={() => resetGame()} className="btn-primary" style={{ width: '100%' }}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* How to play */}
      <div
        className="w-full rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--label-tertiary)' }}>
          How to play
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--label-secondary)', lineHeight: 1.5 }}>
          <strong>Click</strong> a cell to reveal it. <strong>Right-click</strong> (or long-press on mobile) to plant a 🚩 flag on a suspected mine. Reveal every safe cell to win — without hitting a 💣!
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--label-secondary)', lineHeight: 1.5 }}>
          🌪 <strong>Mayhem mode:</strong> toggle the badge above to activate drifting mines — every {MAYHEM_INTERVAL_MS / 1000} seconds one hidden mine silently moves to a random unrevealed cell. Numbers update instantly. Flagged cells are safe from drifting.
        </p>
      </div>
    </div>
  )
}

