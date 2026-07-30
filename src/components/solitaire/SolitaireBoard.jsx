import { useState, useEffect, useRef, useCallback } from 'react'
import './solitaire.css'

// ── Constants ────────────────────────────────────────────────────

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = new Set(['♥', '♦'])

function isRed(suit) { return RED_SUITS.has(suit) }

// ── Deck helpers ─────────────────────────────────────────────────

function buildDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false, id: `${rank}${suit}` })
    }
  }
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rankIndex(rank) { return RANKS.indexOf(rank) }

// ── Game initialisation ──────────────────────────────────────────

function initGame() {
  const deck = shuffle(buildDeck())
  const tableau = Array.from({ length: 7 }, () => [])
  let idx = 0
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] }
      card.faceUp = row === col
      tableau[col].push(card)
    }
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }))
  return {
    tableau,
    stock,
    waste: [],
    foundations: [[], [], [], []], // ♠ ♥ ♦ ♣
  }
}

// ── Move validation ──────────────────────────────────────────────

function canPlaceOnFoundation(card, foundation) {
  if (foundation.length === 0) return card.rank === 'A'
  const top = foundation[foundation.length - 1]
  return top.suit === card.suit && rankIndex(card.rank) === rankIndex(top.rank) + 1
}

function canPlaceOnTableau(card, column) {
  if (column.length === 0) return card.rank === 'K'
  const top = column[column.length - 1]
  if (!top.faceUp) return false
  return isRed(card.suit) !== isRed(top.suit) && rankIndex(card.rank) === rankIndex(top.rank) - 1
}

// ── Stat pill ────────────────────────────────────────────────────

function StatPill({ label, value }) {
  return (
    <div className="solitaire-stat-pill">
      <span className="solitaire-stat-value">{value}</span>
      <span className="solitaire-stat-label">{label}</span>
    </div>
  )
}

// ── Playing card visual ──────────────────────────────────────────

function Card({ card, selected, onClick, onDoubleClick, style }) {
  if (!card.faceUp) {
    return (
      <div
        className="playing-card face-down"
        style={style}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />
    )
  }
  const colorClass = isRed(card.suit) ? 'red-card' : 'black-card'
  return (
    <div
      className={`playing-card ${colorClass}${selected ? ' selected' : ''}`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="card-corner">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{card.suit}</span>
      </div>
      <div className="card-center-suit">{card.suit}</div>
      <div className="card-corner card-corner-bottom">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{card.suit}</span>
      </div>
    </div>
  )
}

// ── Win screen ───────────────────────────────────────────────────

function WinScreen({ moves, elapsed, onPlayAgain }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return (
    <div className="solitaire-win spring-pop">
      <div className="solitaire-win-icon">🏆</div>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--label-primary)' }}>
          You Win!
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--label-tertiary)', marginTop: 4 }}>
          All 52 cards on the foundations!
        </p>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        {[{ label: 'Moves', value: moves }, { label: 'Time', value: `${mm}:${ss}` }].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--label-primary)' }}>{value}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--label-tertiary)' }}>{label}</span>
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{ width: '100%' }} onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}

// ── Main board ───────────────────────────────────────────────────

export default function SolitaireBoard() {
  const [state, setState] = useState(() => initGame())
  const [selected, setSelected] = useState(null) // { area, colIdx, cardIdx }
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [won, setWon] = useState(false)
  const timerRef = useRef(null)

  // Timer
  useEffect(() => {
    if (won) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [won])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  // ── Check win ──────────────────────────────────────────────────
  const checkWin = useCallback((foundations) => {
    return foundations.every(f => f.length === 13)
  }, [])

  // ── New game ───────────────────────────────────────────────────
  const handleNewGame = () => {
    setState(initGame())
    setSelected(null)
    setMoves(0)
    setElapsed(0)
    setWon(false)
  }

  // ── Stock click ────────────────────────────────────────────────
  const handleStockClick = () => {
    setSelected(null)
    setState(prev => {
      if (prev.stock.length === 0) {
        if (prev.waste.length === 0) return prev
        return {
          ...prev,
          stock: [...prev.waste].reverse().map(c => ({ ...c, faceUp: false })),
          waste: [],
        }
      }
      const card = { ...prev.stock[prev.stock.length - 1], faceUp: true }
      return {
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, card],
      }
    })
  }

  // ── Get the "selected" cards (may be a stack from tableau) ─────
  function getSelectedCards(st, sel) {
    if (!sel) return []
    if (sel.area === 'waste') return [st.waste[st.waste.length - 1]]
    if (sel.area === 'foundation') return [st.foundations[sel.colIdx][st.foundations[sel.colIdx].length - 1]]
    if (sel.area === 'tableau') return st.tableau[sel.colIdx].slice(sel.cardIdx)
    return []
  }

  // ── Try to auto-move a card to a foundation ────────────────────
  function tryAutoFoundation(st, card, sourceArea, sourceCol, sourceCardIdx) {
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, st.foundations[fi])) {
        const newFoundations = st.foundations.map((f, i) => i === fi ? [...f, card] : f)
        let newState = { ...st, foundations: newFoundations }
        if (sourceArea === 'waste') {
          newState.waste = st.waste.slice(0, -1)
        } else if (sourceArea === 'tableau') {
          const newTab = st.tableau.map((col, i) => {
            if (i !== sourceCol) return col
            const newCol = col.slice(0, sourceCardIdx)
            if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
              newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true }
            }
            return newCol
          })
          newState.tableau = newTab
        }
        return newState
      }
    }
    return null
  }

  // ── Card click handler ─────────────────────────────────────────
  const handleCardClick = (area, colIdx, cardIdx, card) => {
    if (!selected) {
      if (!card || !card.faceUp) {
        // Flip top face-down card in tableau
        if (area === 'tableau' && card) {
          const col = state.tableau[colIdx]
          if (cardIdx === col.length - 1) {
            setState(prev => ({
              ...prev,
              tableau: prev.tableau.map((c, i) =>
                i === colIdx
                  ? c.map((cd, j) => j === cardIdx ? { ...cd, faceUp: true } : cd)
                  : c
              ),
            }))
          }
        }
        return
      }
      setSelected({ area, colIdx, cardIdx })
      return
    }

    // Something is already selected — try to move it
    const cards = getSelectedCards(state, selected)
    if (cards.length === 0) { setSelected(null); return }

    // Clicked the same card → deselect
    if (selected.area === area && selected.colIdx === colIdx && selected.cardIdx === cardIdx) {
      setSelected(null)
      return
    }

    // Try to place on foundation (only single cards)
    if (area === 'foundation' && cards.length === 1) {
      if (canPlaceOnFoundation(cards[0], state.foundations[colIdx])) {
        setState(prev => {
          const newFoundations = prev.foundations.map((f, i) =>
            i === colIdx ? [...f, cards[0]] : f
          )
          let newState = { ...prev, foundations: newFoundations }
          if (selected.area === 'waste') {
            newState.waste = prev.waste.slice(0, -1)
          } else if (selected.area === 'tableau') {
            newState.tableau = prev.tableau.map((col, i) => {
              if (i !== selected.colIdx) return col
              const newCol = col.slice(0, selected.cardIdx)
              if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
                newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true }
              }
              return newCol
            })
          }
          if (checkWin(newState.foundations)) setWon(true)
          return newState
        })
        setMoves(m => m + 1)
        setSelected(null)
        return
      }
    }

    // Try to place on tableau column (including empty slot → card is null)
    if (area === 'tableau') {
      const targetCol = state.tableau[colIdx]
      if (canPlaceOnTableau(cards[0], targetCol)) {
        setState(prev => {
          const newTableau = prev.tableau.map((col, i) => {
            if (i === colIdx) return [...col, ...cards]
            if (i === selected.colIdx && selected.area === 'tableau') {
              const newCol = col.slice(0, selected.cardIdx)
              if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
                newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true }
              }
              return newCol
            }
            return col
          })
          let newState = { ...prev, tableau: newTableau }
          if (selected.area === 'waste') {
            newState.waste = prev.waste.slice(0, -1)
          }
          if (checkWin(newState.foundations)) setWon(true)
          return newState
        })
        setMoves(m => m + 1)
        setSelected(null)
        return
      }
    }

    // Clicked a different face-up card → re-select it
    if (card && card.faceUp) {
      setSelected({ area, colIdx, cardIdx })
    } else {
      setSelected(null)
    }
  }

  // ── Double-click: auto-send to foundation ──────────────────────
  const handleCardDoubleClick = (area, colIdx, cardIdx, card) => {
    if (!card || !card.faceUp) return
    if (area === 'tableau' && cardIdx !== state.tableau[colIdx].length - 1) return
    if (area === 'waste' && cardIdx !== state.waste.length - 1) return

    const newState = tryAutoFoundation(state, card, area, colIdx, cardIdx)
    if (newState) {
      setState(newState)
      setMoves(m => m + 1)
      setSelected(null)
      if (checkWin(newState.foundations)) setWon(true)
    }
  }

  // ── Layout helpers ─────────────────────────────────────────────

  const OVERLAP_FACEDOWN = 0.18
  const OVERLAP_FACEUP   = 0.28

  function getTableauCardTop(col, idx) {
    let top = 0
    for (let i = 0; i < idx; i++) {
      top += col[i].faceUp ? OVERLAP_FACEUP : OVERLAP_FACEDOWN
    }
    return top
  }

  function tableauColumnHeight(col) {
    if (col.length === 0) return 1
    let h = 0
    for (let i = 0; i < col.length - 1; i++) {
      h += col[i].faceUp ? OVERLAP_FACEUP : OVERLAP_FACEDOWN
    }
    return h + 1
  }

  // ── Render ─────────────────────────────────────────────────────

  if (won) {
    return (
      <div className="solitaire-wrapper">
        <WinScreen moves={moves} elapsed={elapsed} onPlayAgain={handleNewGame} />
      </div>
    )
  }

  return (
    <div className="solitaire-wrapper">
      {/* Stats */}
      <div className="solitaire-stats">
        <StatPill label="Moves" value={moves} />
        <StatPill label="Time" value={`${mm}:${ss}`} />
        <StatPill label="Stock" value={state.stock.length} />
        <button
          className="btn-ghost"
          style={{ padding: '6px 16px', fontSize: '0.82rem' }}
          onClick={handleNewGame}
        >
          🔀 New Game
        </button>
      </div>

      {/* Top row: stock | waste | gap | 4 foundations */}
      <div className="solitaire-top-row">
        {/* Stock */}
        <div className="stock-pile" onClick={handleStockClick} title="Click to draw">
          {state.stock.length > 0 ? (
            <Card card={{ faceUp: false, suit: '?', rank: '?' }} />
          ) : (
            <div className="card-slot" style={{ cursor: 'pointer', fontSize: '1.6rem' }}>↺</div>
          )}
        </div>

        {/* Waste */}
        <div>
          {state.waste.length > 0 ? (
            <Card
              card={state.waste[state.waste.length - 1]}
              selected={selected?.area === 'waste'}
              onClick={() => {
                const card = state.waste[state.waste.length - 1]
                handleCardClick('waste', 0, state.waste.length - 1, card)
              }}
              onDoubleClick={() => {
                const card = state.waste[state.waste.length - 1]
                handleCardDoubleClick('waste', 0, state.waste.length - 1, card)
              }}
            />
          ) : (
            <div className="card-slot" />
          )}
        </div>

        {/* Spacer */}
        <div />

        {/* Foundations */}
        {state.foundations.map((foundation, fi) => {
          const topCard = foundation.length > 0 ? foundation[foundation.length - 1] : null
          const suitLabel = SUITS[fi]
          return (
            <div
              key={fi}
              onClick={() => {
                if (selected && selected.area !== 'foundation') {
                  handleCardClick('foundation', fi, foundation.length - 1, topCard)
                }
              }}
            >
              {topCard ? (
                <Card
                  card={topCard}
                  selected={false}
                  onClick={() => {
                    if (selected && selected.area !== 'foundation') {
                      handleCardClick('foundation', fi, foundation.length - 1, topCard)
                    }
                  }}
                />
              ) : (
                <div
                  className={`card-slot${selected ? ' drop-target' : ''}`}
                  style={{
                    fontSize: '1.3rem',
                    color: isRed(suitLabel) ? '#e53e3e' : 'var(--label-tertiary)',
                    cursor: selected ? 'pointer' : 'default',
                  }}
                >
                  {suitLabel}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tableau */}
      <div className="solitaire-tableau">
        {state.tableau.map((col, ci) => {
          const colHeight = tableauColumnHeight(col)
          return (
            <div key={ci} className="tableau-column" style={{ position: 'relative' }}>
              {/* Empty slot — drop target */}
              <div
                className={`card-slot${selected ? ' drop-target' : ''}`}
                style={{
                  visibility: col.length > 0 ? 'hidden' : 'visible',
                  position: col.length > 0 ? 'absolute' : 'relative',
                  width: '100%',
                  cursor: selected ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (selected) handleCardClick('tableau', ci, 0, null)
                }}
              />

              {/* Stacked cards */}
              {col.length > 0 && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: `${colHeight * 140}%`,
                  }}
                >
                  {col.map((card, cardIdx) => {
                    const topFraction = getTableauCardTop(col, cardIdx)
                    const isSel =
                      selected?.area === 'tableau' &&
                      selected.colIdx === ci &&
                      cardIdx >= selected.cardIdx
                    return (
                      <Card
                        key={card.id}
                        card={card}
                        selected={isSel}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          top: `${topFraction * 140}%`,
                          zIndex: cardIdx + 1,
                        }}
                        onClick={() => handleCardClick('tableau', ci, cardIdx, card)}
                        onDoubleClick={() => handleCardDoubleClick('tableau', ci, cardIdx, card)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--label-tertiary)' }}>
        Tap a card to select it, then tap a destination to move. Double-tap to auto-send to foundation.
      </p>
    </div>
  )
}

