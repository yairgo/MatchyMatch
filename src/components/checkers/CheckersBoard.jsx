import { useState, useCallback } from 'react'

// ── Constants ─────────────────────────────────────────────────────

const EMPTY = null
const RED = 'red'
const BLACK = 'black'
const RED_KING = 'red-king'
const BLACK_KING = 'black-king'

// ── Board initialisation ──────────────────────────────────────────

function createInitialBoard() {
  // 8x8 board; pieces on dark squares (row+col odd)
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(EMPTY))

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row][col] = BLACK
        else if (row > 4) board[row][col] = RED
      }
    }
  }
  return board
}

// ── Helpers ───────────────────────────────────────────────────────

function isRed(piece) {
  return piece === RED || piece === RED_KING
}
function isBlack(piece) {
  return piece === BLACK || piece === BLACK_KING
}
function isKing(piece) {
  return piece === RED_KING || piece === BLACK_KING
}
function belongsTo(piece, player) {
  return player === 'red' ? isRed(piece) : isBlack(piece)
}

function promote(piece, row) {
  if (piece === RED && row === 0) return RED_KING
  if (piece === BLACK && row === 7) return BLACK_KING
  return piece
}

// Returns all valid moves for a piece at (r,c).
// A move is { fromR, fromC, toR, toC, captures: [[r,c], ...] }
function getMovesForPiece(board, r, c, mustCapture = false) {
  const piece = board[r][c]
  if (!piece) return []

  const dirs = []
  if (isRed(piece) || isKing(piece)) dirs.push([-1, -1], [-1, 1])   // red moves up
  if (isBlack(piece) || isKing(piece)) dirs.push([1, -1], [1, 1])   // black moves down

  const jumps = []
  const steps = []

  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue

    const neighbour = board[nr][nc]
    if (neighbour === EMPTY) {
      steps.push({ fromR: r, fromC: c, toR: nr, toC: nc, captures: [] })
    } else if (
      (isRed(piece) && isBlack(neighbour)) ||
      (isBlack(piece) && isRed(neighbour))
    ) {
      // Try to jump
      const jr = nr + dr
      const jc = nc + dc
      if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && board[jr][jc] === EMPTY) {
        jumps.push({
          fromR: r,
          fromC: c,
          toR: jr,
          toC: jc,
          captures: [[nr, nc]],
        })
      }
    }
  }

  if (mustCapture) return jumps
  return jumps.length > 0 ? jumps : steps
}

// Get all valid moves for a player, enforcing mandatory capture rule.
function getAllMoves(board, player) {
  const jumps = []
  const steps = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (belongsTo(board[r][c], player)) {
        const pieceMoves = getMovesForPiece(board, r, c)
        for (const m of pieceMoves) {
          if (m.captures.length > 0) jumps.push(m)
          else steps.push(m)
        }
      }
    }
  }

  return jumps.length > 0 ? jumps : steps
}

// After a jump, check if the piece can continue jumping (multi-jump).
function getContinuationJumps(board, r, c, alreadyCaptured) {
  const piece = board[r][c]
  if (!piece) return []

  const dirs = []
  if (isRed(piece) || isKing(piece)) dirs.push([-1, -1], [-1, 1])
  if (isBlack(piece) || isKing(piece)) dirs.push([1, -1], [1, 1])

  const jumps = []
  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue
    const neighbour = board[nr][nc]
    if (!neighbour) continue
    // Can't re-capture same piece
    if (alreadyCaptured.some(([cr, cc]) => cr === nr && cc === nc)) continue

    if (
      (isRed(piece) && isBlack(neighbour)) ||
      (isBlack(piece) && isRed(neighbour))
    ) {
      const jr = nr + dr
      const jc = nc + dc
      if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && board[jr][jc] === EMPTY) {
        jumps.push({
          fromR: r,
          fromC: c,
          toR: jr,
          toC: jc,
          captures: [[nr, nc]],
        })
      }
    }
  }
  return jumps
}

// Apply a single move to a board copy, return new board.
function applyMove(board, move) {
  const newBoard = board.map((row) => [...row])
  const piece = newBoard[move.fromR][move.fromC]
  newBoard[move.fromR][move.fromC] = EMPTY
  newBoard[move.toR][move.toC] = promote(piece, move.toR)
  for (const [cr, cc] of move.captures) {
    newBoard[cr][cc] = EMPTY
  }
  return newBoard
}

// ── Piece SVG ─────────────────────────────────────────────────────

function PieceSVG({ piece }) {
  const isR = isRed(piece)
  const king = isKing(piece)
  const fill = isR ? '#e53e3e' : '#2d3748'
  const shine = isR ? '#fc8181' : '#718096'
  const crown = '#ffd700'

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Shadow */}
      <ellipse cx="20" cy="34" rx="14" ry="4" fill="rgba(0,0,0,0.25)" />
      {/* Body */}
      <circle cx="20" cy="20" r="14" fill={fill} />
      {/* Shine */}
      <circle cx="15" cy="15" r="5" fill={shine} opacity="0.35" />
      {/* King crown */}
      {king && (
        <text
          x="20"
          y="25"
          textAnchor="middle"
          fontSize="14"
          fill={crown}
          style={{ userSelect: 'none' }}
        >
          ♛
        </text>
      )}
    </svg>
  )
}

// ── Square ────────────────────────────────────────────────────────

function Square({ row, col, piece, selected, isValidTarget, isLastMove, onClick }) {
  const isDark = (row + col) % 2 === 1
  let bg = isDark ? '#769656' : '#eeeed2'

  if (selected) bg = '#f6f669'
  else if (isLastMove) bg = '#cdd26a'
  else if (isValidTarget && isDark) bg = '#baca44'

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isValidTarget || (piece && isDark) ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      {/* Valid move dot */}
      {isValidTarget && !piece && (
        <div
          style={{
            width: '28%',
            height: '28%',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.25)',
          }}
        />
      )}
      {/* Valid capture ring */}
      {isValidTarget && piece && (
        <div
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: '50%',
            border: '3px solid rgba(255,200,0,0.8)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Piece */}
      {piece && (
        <div
          style={{
            width: '78%',
            height: '78%',
            filter: selected ? 'drop-shadow(0 0 6px rgba(255,255,0,0.9))' : undefined,
            transition: 'filter 0.15s',
          }}
        >
          <PieceSVG piece={piece} />
        </div>
      )}
    </div>
  )
}

// ── Status banner ─────────────────────────────────────────────────

function StatusBanner({ currentPlayer, gameOver, winner, inMultiJump }) {
  if (gameOver) {
    const label = winner === 'red' ? '🔴 Red wins!' : '⚫ Black wins!'
    return (
      <div
        style={{
          padding: '10px 20px',
          borderRadius: 12,
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-md)',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--label-primary)',
          textAlign: 'center',
        }}
      >
        {label}
      </div>
    )
  }

  const isRed = currentPlayer === 'red'
  const color = isRed ? '#e53e3e' : '#2d3748'
  const label = isRed ? '🔴 Red's turn' : '⚫ Black's turn'

  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: 12,
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-md)',
        fontWeight: 600,
        fontSize: '0.95rem',
        color,
        textAlign: 'center',
      }}
    >
      {inMultiJump ? '⚡ Continue jumping!' : label}
    </div>
  )
}

// ── Score bar ─────────────────────────────────────────────────────

function ScoreBar({ redWins, blackWins }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {[
        { label: '🔴 Red', value: redWins, color: '#e53e3e' },
        { label: '⚫ Black', value: blackWins, color: '#2d3748' },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl"
          style={{ background: 'var(--fill-tertiary)' }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color }}>
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

// ── Main component ────────────────────────────────────────────────

export default function CheckersBoard() {
  const [board, setBoard] = useState(createInitialBoard)
  const [currentPlayer, setCurrentPlayer] = useState('red')
  const [selected, setSelected] = useState(null)       // { r, c }
  const [validMoves, setValidMoves] = useState([])     // move objects for selected piece
  const [allMoves, setAllMoves] = useState(() => getAllMoves(createInitialBoard(), 'red'))
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [redWins, setRedWins] = useState(0)
  const [blackWins, setBlackWins] = useState(0)
  const [lastMove, setLastMove] = useState(null)       // { fromR, fromC, toR, toC }
  const [multiJump, setMultiJump] = useState(null)     // { r, c, captured } during multi-jump

  const handleSquareClick = useCallback(
    (r, c) => {
      if (gameOver) return

      const piece = board[r][c]

      // ── Multi-jump in progress ──────────────────────────────────
      if (multiJump) {
        const continuations = getContinuationJumps(board, multiJump.r, multiJump.c, multiJump.captured)
        const move = continuations.find((m) => m.toR === r && m.toC === c)
        if (move) {
          const newBoard = applyMove(board, move)
          const allCaptured = [...multiJump.captured, ...move.captures]
          setBoard(newBoard)
          setLastMove({ fromR: multiJump.r, fromC: multiJump.c, toR: r, toC: c })

          // Check for further jumps
          const further = getContinuationJumps(newBoard, r, c, allCaptured)
          if (further.length > 0) {
            setMultiJump({ r, c, captured: allCaptured })
            setValidMoves(further)
            setSelected({ r, c })
          } else {
            // End of turn
            finishTurn(newBoard, currentPlayer)
          }
        }
        return
      }

      // ── Normal selection / move ─────────────────────────────────

      // Clicking a valid destination
      if (selected) {
        const move = validMoves.find((m) => m.toR === r && m.toC === c)
        if (move) {
          const newBoard = applyMove(board, move)
          setLastMove({ fromR: move.fromR, fromC: move.fromC, toR: r, toC: c })

          if (move.captures.length > 0) {
            // Check for multi-jump
            const further = getContinuationJumps(newBoard, r, c, move.captures)
            if (further.length > 0) {
              setBoard(newBoard)
              setMultiJump({ r, c, captured: move.captures })
              setValidMoves(further)
              setSelected({ r, c })
              return
            }
          }

          finishTurn(newBoard, currentPlayer)
          return
        }
      }

      // Clicking own piece to select it
      if (piece && belongsTo(piece, currentPlayer)) {
        const pieceMoves = allMoves.filter((m) => m.fromR === r && m.fromC === c)
        setSelected({ r, c })
        setValidMoves(pieceMoves)
        return
      }

      // Clicking elsewhere — deselect
      setSelected(null)
      setValidMoves([])
    },
    [board, currentPlayer, selected, validMoves, allMoves, gameOver, multiJump]
  )

  function finishTurn(newBoard, player) {
    const next = player === 'red' ? 'black' : 'red'
    const nextMoves = getAllMoves(newBoard, next)

    setBoard(newBoard)
    setSelected(null)
    setValidMoves([])
    setMultiJump(null)

    if (nextMoves.length === 0) {
      // Next player has no moves — current player wins
      setGameOver(true)
      setWinner(player)
      if (player === 'red') setRedWins((w) => w + 1)
      else setBlackWins((w) => w + 1)
    } else {
      setCurrentPlayer(next)
      setAllMoves(nextMoves)
    }
  }

  function handleNewGame() {
    const initial = createInitialBoard()
    setBoard(initial)
    setCurrentPlayer('red')
    setSelected(null)
    setValidMoves([])
    setAllMoves(getAllMoves(initial, 'red'))
    setGameOver(false)
    setWinner(null)
    setLastMove(null)
    setMultiJump(null)
  }

  function handleReset() {
    handleNewGame()
    setRedWins(0)
    setBlackWins(0)
  }

  // Build set of valid target squares for quick lookup
  const targetSquares = new Set(validMoves.map((m) => `${m.toR},${m.toC}`))

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-12">
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
        Checkers 🔴⚫
      </h1>

      {/* Score */}
      <ScoreBar redWins={redWins} blackWins={blackWins} />

      {/* Status */}
      <StatusBanner
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        winner={winner}
        inMultiJump={!!multiJump}
      />

      {/* Board */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          border: '3px solid #8b7355',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Rank labels top */}
        <div style={{ display: 'grid', gridTemplateColumns: '20px repeat(8, 1fr)' }}>
          <div />
          {['a','b','c','d','e','f','g','h'].map((f) => (
            <div
              key={f}
              style={{
                textAlign: 'center',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: '#8b7355',
                padding: '2px 0',
                background: '#f0d9b5',
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {Array(8).fill(null).map((_, row) => (
          <div
            key={row}
            style={{ display: 'grid', gridTemplateColumns: '20px repeat(8, 1fr)' }}
          >
            {/* Rank number */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: '#8b7355',
                background: '#f0d9b5',
              }}
            >
              {8 - row}
            </div>

            {Array(8).fill(null).map((_, col) => {
              const piece = board[row][col]
              const isSelected = selected?.r === row && selected?.c === col
              const isTarget = targetSquares.has(`${row},${col}`)
              const isLast =
                lastMove &&
                ((lastMove.fromR === row && lastMove.fromC === col) ||
                  (lastMove.toR === row && lastMove.toC === col))

              return (
                <Square
                  key={col}
                  row={row}
                  col={col}
                  piece={piece}
                  selected={isSelected}
                  isValidTarget={isTarget}
                  isLastMove={isLast}
                  onClick={() => handleSquareClick(row, col)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Hint */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--label-tertiary)',
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        Click a piece to select it, then click a highlighted square to move.
        Captures are mandatory. Kings can move in all directions.
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleNewGame} className="btn-primary">
          🔀 New Game
        </button>
        <button onClick={handleReset} className="btn-ghost">
          Reset Score
        </button>
      </div>
    </div>
  )
}

