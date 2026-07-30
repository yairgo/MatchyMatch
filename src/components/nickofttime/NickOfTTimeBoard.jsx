import { useState, useEffect, useRef, useCallback } from 'react'

// ── Constants ─────────────────────────────────────────────────────

const TOTAL_ROUNDS = 5
const BAR_DURATION = 2500   // ms for the bar to travel full width
const TARGET_WIDTH = 0.14   // target zone width as fraction of bar
const TARGET_START = 0.43   // target zone start as fraction of bar

// Difficulty speeds up each round
const ROUND_SPEEDS = [1.0, 1.15, 1.3, 1.5, 1.75]

// Score based on how centred the hit is
function calcScore(fraction) {
  const targetCentre = TARGET_START + TARGET_WIDTH / 2
  const dist = Math.abs(fraction - targetCentre)
  const maxDist = TARGET_WIDTH / 2
  if (dist > maxDist) return 0
  const closeness = 1 - dist / maxDist   // 1 = perfect centre, 0 = edge
  if (closeness > 0.85) return 100
  if (closeness > 0.6) return 75
  if (closeness > 0.3) return 50
  return 25
}

function getRating(total) {
  if (total >= 450) return { emoji: '⚡', label: 'Lightning Nick!', color: '#ffd700' }
  if (total >= 350) return { emoji: '🎯', label: 'Sharp as a Nick!', color: '#34c759' }
  if (total >= 200) return { emoji: '⏱️', label: 'Just in the Nick!', color: '#0a84ff' }
  return { emoji: '🐢', label: 'Too Slow, Nick!', color: '#ff6b6b' }
}

// ── Sub-components ────────────────────────────────────────────────

function TimingBar({ progress, hit }) {
  // progress: 0–1 (current marker position)
  // hit: null | 'perfect' | 'great' | 'good' | 'miss'
  const markerLeft = `${progress * 100}%`
  const targetLeft = `${TARGET_START * 100}%`
  const targetWidth = `${TARGET_WIDTH * 100}%`

  const hitColor =
    hit === null
      ? '#0a84ff'
      : hit === 'miss'
        ? '#ff3b30'
        : '#34c759'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 48,
        borderRadius: 24,
        background: 'var(--fill-tertiary)',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      {/* Target zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: targetLeft,
          width: targetWidth,
          height: '100%',
          background: 'rgba(52,199,89,0.28)',
          borderLeft: '2px solid #34c759',
          borderRight: '2px solid #34c759',
          transition: 'background 0.15s',
        }}
      />

      {/* Nick zone label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `calc(${targetLeft} + ${targetWidth} / 2)`,
          transform: 'translate(-50%, -50%)',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#34c759',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        NICK IT
      </div>

      {/* Moving marker */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: markerLeft,
          width: 6,
          borderRadius: 3,
          background: hitColor,
          transform: 'translateX(-50%)',
          boxShadow: `0 0 10px ${hitColor}88`,
          transition: hit ? 'background 0.15s' : 'none',
        }}
      />

      {/* Hit flash overlay */}
      {hit && hit !== 'miss' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(52,199,89,0.15)',
            animation: 'nick-flash 0.35s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

function ResultBadge({ hit, points }) {
  if (!hit) return null
  const isMiss = hit === 'miss'
  return (
    <div
      style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: isMiss ? '#ff3b30' : '#34c759',
        animation: 'nick-badge 0.4s ease-out',
        minHeight: 28,
      }}
    >
      {isMiss ? '❌ Missed!' : `✅ +${points} pts`}
    </div>
  )
}

function RoundDots({ current, total, results }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const res = results[i]
        const isActive = i === current
        const color =
          res === undefined
            ? isActive
              ? '#0a84ff'
              : 'var(--fill-tertiary)'
            : res > 0
              ? '#34c759'
              : '#ff3b30'
        return (
          <div
            key={i}
            style={{
              width: isActive ? 14 : 10,
              height: isActive ? 14 : 10,
              borderRadius: '50%',
              background: color,
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 8px ${color}88` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// ── Main Board ────────────────────────────────────────────────────

export default function NickOfTTimeBoard() {
  const [phase, setPhase] = useState('menu')   // menu | countdown | playing | result | gameover
  const [round, setRound] = useState(0)
  const [progress, setProgress] = useState(0)  // 0–1
  const [hit, setHit] = useState(null)          // null | 'hit' | 'miss'
  const [hitFraction, setHitFraction] = useState(null)
  const [roundPoints, setRoundPoints] = useState(0)
  const [results, setResults] = useState([])   // array of points per round
  const [countdown, setCountdown] = useState(3)
  const [totalScore, setTotalScore] = useState(0)

  const animFrameRef = useRef(null)
  const startTimeRef = useRef(null)
  const progressRef = useRef(0)
  const hitRef = useRef(false)

  // ── Animation loop ────────────────────────────────────────────
  const startAnimation = useCallback((roundIndex) => {
    hitRef.current = false
    const speed = ROUND_SPEEDS[roundIndex] ?? 1.75
    const duration = BAR_DURATION / speed

    startTimeRef.current = performance.now()

    const tick = (now) => {
      const elapsed = now - startTimeRef.current
      const frac = Math.min(elapsed / duration, 1)
      progressRef.current = frac
      setProgress(frac)

      if (frac < 1 && !hitRef.current) {
        animFrameRef.current = requestAnimationFrame(tick)
      } else if (frac >= 1 && !hitRef.current) {
        // Ran out — auto miss
        hitRef.current = true
        setHit('miss')
        setRoundPoints(0)
        setResults((r) => [...r, 0])
        setPhase('result')
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }, [])

  // ── Countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      setPhase('playing')
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, countdown])

  // ── Start animation when playing ──────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    setHit(null)
    setHitFraction(null)
    setRoundPoints(0)
    startAnimation(round)
    return () => stopAnimation()
  }, [phase, round, startAnimation, stopAnimation])

  // ── Auto-advance after result ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'result') return
    const id = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('gameover')
      } else {
        setRound(nextRound)
        setPhase('playing')
      }
    }, 1400)
    return () => clearTimeout(id)
  }, [phase, round])

  // ── Handle tap / click ────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== 'playing' || hitRef.current) return
    hitRef.current = true
    stopAnimation()

    const frac = progressRef.current
    setHitFraction(frac)

    const pts = calcScore(frac)
    setRoundPoints(pts)
    setHit(pts > 0 ? 'hit' : 'miss')
    setResults((r) => [...r, pts])
    setTotalScore((s) => s + pts)
    setPhase('result')
  }, [phase, stopAnimation])

  // ── Keyboard support ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        if (phase === 'playing') handleTap()
        if (phase === 'menu') startGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleTap])

  const startGame = () => {
    setRound(0)
    setResults([])
    setTotalScore(0)
    setProgress(0)
    setHit(null)
    setCountdown(3)
    setPhase('countdown')
  }

  // ── Render: Menu ──────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div
        className="spring-pop flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-auto"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
            boxShadow: '0 8px 24px rgba(10,132,255,0.35)',
          }}
        >
          ⏱️
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--label-primary)',
            }}
          >
            Nick of T-Time
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--label-secondary)', lineHeight: 1.5 }}>
            Tap the button when the marker lands in the{' '}
            <span style={{ color: '#34c759', fontWeight: 700 }}>green zone</span>.
            <br />
            The closer to the centre, the more points!
          </p>
        </div>

        <div
          className="w-full rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: 'var(--fill-tertiary)' }}
        >
          {[
            { label: 'Rounds', value: TOTAL_ROUNDS },
            { label: 'Max score', value: `${TOTAL_ROUNDS * 100} pts` },
            { label: 'Controls', value: 'Tap / Space / Enter' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--label-tertiary)' }}>{label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--label-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <button onClick={startGame} className="btn-primary w-full">
          Let's Nick It! ⚡
        </button>
      </div>
    )
  }

  // ── Render: Countdown ─────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-sm mx-auto py-16">
        <p style={{ fontSize: '1rem', color: 'var(--label-tertiary)', fontWeight: 600 }}>
          Get ready…
        </p>
        <div
          key={countdown}
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            color: 'var(--label-primary)',
            animation: 'nick-countdown 0.9s ease-out',
            letterSpacing: '-0.04em',
          }}
        >
          {countdown === 0 ? 'GO!' : countdown}
        </div>
      </div>
    )
  }

  // ── Render: Game Over ─────────────────────────────────────────
  if (phase === 'gameover') {
    const rating = getRating(totalScore)
    return (
      <div
        className="spring-pop flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-auto"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: `linear-gradient(145deg, ${rating.color}, ${rating.color}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            boxShadow: `0 8px 24px ${rating.color}44`,
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
            {TOTAL_ROUNDS} rounds complete
          </p>
        </div>

        {/* Per-round breakdown */}
        <div
          className="w-full rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: 'var(--fill-tertiary)' }}
        >
          {results.map((pts, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--label-tertiary)' }}>
                Round {i + 1}
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: pts > 0 ? '#34c759' : '#ff3b30',
                }}
              >
                {pts > 0 ? `+${pts}` : 'Miss'}
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: '1px solid var(--fill-secondary)',
              paddingTop: 8,
              marginTop: 4,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--label-primary)' }}>
              Total
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0a84ff' }}>
              {totalScore} / {TOTAL_ROUNDS * 100}
            </span>
          </div>
        </div>

        <button onClick={startGame} className="btn-primary w-full">
          Play Again
        </button>
      </div>
    )
  }

  // ── Render: Playing / Result ──────────────────────────────────
  return (
    <div
      className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4 sm:px-6 pt-4 pb-12"
      onClick={phase === 'playing' ? handleTap : undefined}
      style={{ cursor: phase === 'playing' ? 'pointer' : 'default', userSelect: 'none' }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--label-primary)',
          }}
        >
          Nick of T-Time
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--label-tertiary)', fontWeight: 500 }}>
          Round {round + 1} of {TOTAL_ROUNDS} · Speed ×{ROUND_SPEEDS[round].toFixed(2)}
        </p>
      </div>

      {/* Round dots */}
      <RoundDots current={round} total={TOTAL_ROUNDS} results={results} />

      {/* Timing bar */}
      <div className="w-full">
        <TimingBar
          progress={progress}
          hit={hit}
          hitFraction={hitFraction}
          speed={ROUND_SPEEDS[round]}
        />
      </div>

      {/* Result badge */}
      <div style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
        <ResultBadge hit={hit} points={roundPoints} />
      </div>

      {/* Tap button / instruction */}
      {phase === 'playing' ? (
        <button
          onClick={(e) => { e.stopPropagation(); handleTap() }}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '2.5rem',
            boxShadow: '0 8px 32px rgba(10,132,255,0.4)',
            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.93)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,132,255,0.3)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,132,255,0.4)'
          }}
          aria-label="Nick it!"
        >
          ⏱️
        </button>
      ) : (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: hit === 'miss' ? 'linear-gradient(145deg,#ff3b30,#ff453a)' : 'linear-gradient(145deg,#34c759,#30d158)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            boxShadow: hit === 'miss' ? '0 8px 32px rgba(255,59,48,0.35)' : '0 8px 32px rgba(52,199,89,0.35)',
            animation: 'nick-badge 0.3s ease-out',
          }}
        >
          {hit === 'miss' ? '❌' : '✅'}
        </div>
      )}

      {/* Score */}
      <div
        className="flex flex-col items-center gap-0.5 px-6 py-3 rounded-2xl"
        style={{ background: 'var(--fill-tertiary)' }}
      >
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0a84ff', letterSpacing: '-0.02em' }}>
          {totalScore}
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--label-tertiary)' }}>
          Score
        </span>
      </div>

      {phase === 'playing' && (
        <p style={{ fontSize: '0.8rem', color: 'var(--label-tertiary)', marginTop: -16 }}>
          Tap anywhere · Space · Enter
        </p>
      )}
    </div>
  )
}
