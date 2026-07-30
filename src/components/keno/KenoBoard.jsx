import { useState, useCallback } from 'react'
import Confetti from '../Confetti'

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_NUMBERS = 80
const DRAW_COUNT = 20
const MAX_PICKS = 10

// Payout table: [picks][matches] → multiplier
const PAYOUTS = {
  1:  { 1: 3 },
  2:  { 2: 12 },
  3:  { 2: 1, 3: 40 },
  4:  { 2: 1, 3: 5, 4: 100 },
  5:  { 3: 2, 4: 20, 5: 300 },
  6:  { 3: 1, 4: 8, 5: 50, 6: 1000 },
  7:  { 3: 1, 4: 4, 5: 20, 6: 100, 7: 5000 },
  8:  { 4: 2, 5: 10, 6: 50, 7: 500, 8: 10000 },
  9:  { 4: 1, 5: 5, 6: 25, 7: 100, 8: 2000, 9: 25000 },
  10: { 5: 2, 6: 10, 7: 50, 8: 500, 9: 5000, 10: 100000 },
}

function getPayout(picks, matches) {
  const table = PAYOUTS[picks]
  if (!table) return 0
  return table[matches] || 0
}

function drawNumbers() {
  const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
  const drawn = []
  for (let i = 0; i < DRAW_COUNT; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    drawn.push(pool[idx])
    pool.splice(idx, 1)
  }
  return new Set(drawn)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NumberBall({ num, picked, drawn, revealed }) {
  const isHit = picked && drawn && drawn.has(num)
  const isMiss = picked && drawn && !drawn.has(num)
  const isDrawnOnly = !picked && drawn && drawn.has(num)

  let bg = 'var(--fill-tertiary)'
  let color = 'var(--label-primary)'
  let border = '1.5px solid var(--separator)'
  let shadow = 'none'

  if (revealed) {
    if (isHit) {
      bg = '#30d158'
      color = '#fff'
      border = '1.5px solid #28b84e'
      shadow = '0 2px 8px rgba(48,209,88,0.4)'
    } else if (isMiss) {
      bg = 'var(--fill-secondary)'
      color = 'var(--label-tertiary)'
      border = '1.5px solid var(--separator)'
    } else if (isDrawnOnly) {
      bg = 'rgba(255,159,10,0.18)'
      color = '#ff9f0a'
      border = '1.5px solid rgba(255,159,10,0.4)'
    }
  } else if (picked) {
    bg = 'var(--accent)'
    color = '#fff'
    border = '1.5px solid var(--accent)'
    shadow = '0 2px 8px rgba(0,122,255,0.3)'
  }

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color,
        border,
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        transition: 'all 0.25s ease',
        cursor: revealed ? 'default' : 'pointer',
        userSelect: 'none',
      }}
    >
      {num}
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
      style={{ background: 'var(--fill-tertiary)', minWidth: 72 }}
    >
      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--label-primary)' }}>
        {value}
      </span>
      <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--label-tertiary)' }}>
        {label}
      </span>
    </div>
  )
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function KenoBoard() {
  const [picked, setPicked] = useState(new Set())
  const [drawn, setDrawn] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [credits, setCredits] = useState(100)
  const [lastWin, setLastWin] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [roundsPlayed, setRoundsPlayed] = useState(0)

  const handleToggle = useCallback((num) => {
    if (revealed) return
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(num)) {
        next.delete(num)
      } else if (next.size < MAX_PICKS) {
        next.add(num)
      }
      return next
    })
  }, [revealed])

  const handlePlay = () => {
    if (picked.size === 0 || credits < 1) return
    const drawnSet = drawNumbers()
    setDrawn(drawnSet)
    setRevealed(true)
    setCredits((c) => c - 1)
    setRoundsPlayed((r) => r + 1)

    const matches = [...picked].filter((n) => drawnSet.has(n)).length
    const multiplier = getPayout(picked.size, matches)
    const winAmount = multiplier
    setLastWin(winAmount)
    if (winAmount > 0) {
      setCredits((c) => c + winAmount)
      if (winAmount >= 50) setShowConfetti(true)
    }
  }

  const handleNewRound = () => {
    setPicked(new Set())
    setDrawn(null)
    setRevealed(false)
    setLastWin(null)
    setShowConfetti(false)
  }

  const handleReset = () => {
    setPicked(new Set())
    setDrawn(null)
    setRevealed(false)
    setLastWin(null)
    setShowConfetti(false)
    setCredits(100)
    setRoundsPlayed(0)
  }

  const matches = revealed && drawn ? [...picked].filter((n) => drawn.has(n)).length : 0
  const pickedCount = picked.size
  const canPlay = pickedCount > 0 && credits >= 1 && !revealed

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      {/* Title */}
      <div className="w-full flex flex-col items-center gap-1">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--label-primary)' }}>
          Keno
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--label-tertiary)', textAlign: 'center' }}>
          Pick up to {MAX_PICKS} numbers, then draw {DRAW_COUNT} from {TOTAL_NUMBERS}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <StatPill label="Credits" value={credits} />
        <StatPill label="Picked" value={`${pickedCount}/${MAX_PICKS}`} />
        <StatPill label="Rounds" value={roundsPlayed} />
        {revealed && <StatPill label="Matches" value={matches} />}
      </div>

      {/* Result banner */}
      {revealed && (
        <div
          className="w-full rounded-2xl px-5 py-3 text-center"
          style={{
            background: lastWin > 0 ? 'rgba(48,209,88,0.12)' : 'var(--fill-tertiary)',
            border: lastWin > 0 ? '1px solid rgba(48,209,88,0.3)' : '1px solid var(--separator)',
          }}
        >
          {lastWin > 0 ? (
            <p style={{ fontWeight: 700, color: '#30d158', fontSize: '1.1rem' }}>
              🎉 {matches} match{matches !== 1 ? 'es' : ''}! You won {lastWin} credit{lastWin !== 1 ? 's' : ''}!
            </p>
          ) : (
            <p style={{ fontWeight: 600, color: 'var(--label-secondary)', fontSize: '1rem' }}>
              {matches} match{matches !== 1 ? 'es' : ''} — no win this round.
            </p>
          )}
        </div>
      )}

      {/* Number grid */}
      <div
        className="w-full rounded-3xl p-4"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 6,
          }}
        >
          {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleToggle(num)}
              disabled={revealed || (!picked.has(num) && pickedCount >= MAX_PICKS)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label={`Number ${num}`}
            >
              <NumberBall
                num={num}
                picked={picked.has(num)}
                drawn={drawn}
                revealed={revealed}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      {revealed && (
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#30d158' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)' }}>Your hit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,159,10,0.5)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)' }}>Drawn (not picked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--fill-secondary)', border: '1px solid var(--separator)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)' }}>Your miss</span>
          </div>
        </div>
      )}

      {/* Payout table */}
      {pickedCount > 0 && (
        <div
          className="w-full rounded-2xl p-4"
          style={{ background: 'var(--fill-tertiary)' }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--label-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payouts for {pickedCount} pick{pickedCount !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PAYOUTS[pickedCount] || {}).map(([m, payout]) => (
              <div
                key={m}
                className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{
                  background: revealed && matches === Number(m) && payout > 0
                    ? 'rgba(48,209,88,0.2)'
                    : 'var(--fill-secondary)',
                  border: revealed && matches === Number(m) && payout > 0
                    ? '1px solid rgba(48,209,88,0.4)'
                    : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--label-tertiary)' }}>{m} match{Number(m) !== 1 ? 'es' : ''}:</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--label-primary)' }}>{payout}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        {!revealed ? (
          <button
            onClick={handlePlay}
            disabled={!canPlay}
            className="btn-primary flex-1"
          >
            {credits < 1 ? 'No Credits' : pickedCount === 0 ? 'Pick Numbers' : `Draw! (−1 credit)`}
          </button>
        ) : (
          <button onClick={handleNewRound} className="btn-primary flex-1">
            Next Round
          </button>
        )}
        <button onClick={handleReset} className="btn-ghost">
          Reset
        </button>
      </div>

      {credits === 0 && !revealed && (
        <p style={{ fontSize: '0.85rem', color: 'var(--label-tertiary)', textAlign: 'center' }}>
          Out of credits! Hit Reset to start fresh.
        </p>
      )}

      {showConfetti && <Confetti />}
    </div>
  )
}
