import { useState, useCallback } from 'react'
import Confetti from '../Confetti'

// ── Constants ─────────────────────────────────────────────────────
const RED = 'red'
const BLACK = 'black'
const EMPTY = null

// ── Board initialisation ──────────────────────────────────────────
function createInitialBoard() {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(EMPTY))

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row][col] = { color: BLACK, king: false }
        if (row > 4) board[row][col] = { color: RED, king: false }
      }
    }
  }
  return board
}

// ── Move helpers ──────────────────────────────────────────────────
function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8
}

/**
 * Returns all jump sequences available from (row, col).
 * Each sequence is an array of { toRow, toCol, captureRow, captureCol }.
 */
function getJumpSequences(board, row, col, piece, visited = new Set()) {
  const dirs = piece.king
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === RED
    ? [[-1, -1], [-1, 1]]
    : [[1, -1], [1, 1]]

  const sequences = []
  const key = `${row},${col}`
  visited.add(key)

  for (const [dr, dc] of dirs) {
    const midR = row + dr
    const midC = col + dc
    const toR = row + 2 * dr
    const toC = col + 2 * dc

    if (!inBounds(toR, toC)) continue
    const mid = board[midR][midC]
    const dest = board[toR][toC]
    if (!mid || mid.color === piece.color) continue
    if (dest !== EMPTY) continue

    const midKey = `${midR},${midC}`
    if (visited.has(midKey)) continue

    // Simulate the jump to look for further jumps
    const newBoard = board.map((r) => r.slice())
    newBoard[toR][toC] = { ...piece }
    newBoard[midR][midC] = EMPTY
    newBoard[row][col] = EMPTY

    // Check for king promotion mid-sequence
    const promoted =
      (piece.color === RED && toR === 0) ||
      (piece.color === BLACK && toR === 7)
    const nextPiece = promoted ? { ...piece, king: true } : piece

    const step = { toRow: toR, toCol: toC, captureRow: midR, captureCol: midC }

    const further = getJumpSequences(
      newBoard,
      toR,
      toC,
      nextPiece,
      new Set(visited).add(midKey)
    )

    if (further.length === 0) {
      sequences.push([step])
    } else {
      for (const seq of further) {
        sequences.push([step, ...seq])
      }
    }
  }

  return sequences
}

/**
 * Returns all legal moves for a piece at (row, col).
 * Each move: { fromRow, fromCol, steps: [{toRow,toCol,captureRow?,captureCol?}] }
 */
function getMovesForPiece(board, row, col) {
  const piece = board[row][col]
  if (!piece) return []

  // Jumps first
  const jumpSeqs = getJumpSequences(board, row, col, piece)
  if (jumpSeqs.length > 0) {
    return jumpSeqs.map((seq) => ({ fromRow: row, fromCol: col, steps: seq }))
  }

  // Simple moves
  const dirs = piece.king
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === RED
    ? [[-1, -1], [-1, 1]]
    : [[1, -1], [1, 1]]

  const moves = []
  for (const [dr, dc] of dirs) {
    const toR = row + dr
    const toC = col + dc
    if (inBounds(toR, toC) && board[toR][toC] === EMPTY) {
      moves.push({
        fromRow: row,
        fromCol: col,
        steps: [{ toRow: toR, toCol: toC }],
      })
    }
  }
  return moves
}

/**
 * Returns all legal moves for a given color.
 * Mandatory capture: if any jump exists, only jumps are returned.
 */
function getAllMoves(board, color) {
  const allMoves = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === color) {
        allMoves.push(...getMovesForPiece(board, r, c))
      }
    }
  }

  const hasJump = allMoves.some((m) => m.steps[0].captureRow !== undefined)
  if (hasJump) return allMoves.filter((m) => m.steps[0].captureRow !== undefined)
  return allMoves
}

/**
 * Apply a full move (all steps) to the board and return the new board.
 */
function applyMove(board, move) {
  let b = board.map((r) => r.slice())
  let piece = { ...b[move.fromRow][move.fromCol] }
  b[move.fromRow][move.fromCol] = EMPTY

  for (const step of move.steps) {
    if (step.captureRow !== undefined) {
      b[step.captureRow][step.captureCol] = EMPTY
    }
    b[step.toRow][step.toCol] = { ...piece }
    piece = { ...b[step.toRow][step.toCol] }

    // King promotion
    if (piece.color === RED && step.toRow === 0) piece.king = true
    if (piece.color === BLACK && step.toRow === 7) piece.king = true
    b[step.toRow][step.toCol] = piece
  }

  return b
}

// ── Sub-components ────────────────────────────────────────────────

function Piece({ color, king }) {
  const outer = color === RED ? '#c0392b' : '#2c2c2e'
  const inner = color === RED ? '#e74c3c' : '#48484a'
  const border = color === RED ? '#922b21' : '#1c1c1e'

  return (
    <div
      style={{
        width: '76%',
        height: '76%',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${inner}, ${outer})`,
        border: `3px solid ${border}`,
        boxShadow: `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(0.7rem, 2vw, 1rem)',
        userSelect: 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {king && (
        <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
          👑
        </span>
      )}
    </div>
  )
}

function Square({ row, col, piece, selected, highlighted, dot, onClick }) {
  const isDark = (row + col) % 2 === 1
  let bg = isDark ? '#6b4226' : '#f0d9b5'
  if (selected) bg = '#baca44'
  else if (highlighted) bg = '#a8d8a8'
  else if (dot) bg = isDark ? '#8b5e3c' : '#f0d9b5'

  return (
    <button
      onClick={onClick}
      aria-label={`Square ${row},${col}${piece ? ` ${piece.color}${piece.king ? ' king' : ''}` : ''}`}
      style={{
        aspectRatio: '1 / 1',
        background: bg,
        border: 'none',
        cursor: isDark ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'background 0.15s ease',
        padding: 0,
      }}
    >
      {dot && !piece && isDark && (
        <div
          style={{
            width: '28%',
            height: '28%',
            borderRadius: '50%',
            background: 'rgba(100,180,100,0.7)',
            boxShadow: '0 0 0 2px rgba(100,180,100,0.4)',
          }}
        />
      )}
      {piece && <Piece color={piece.color} king={piece.king} />}
    </button>
  )
}

function ScoreBar({ redWins, blackWins, draws }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {[
        { label: '🔴 Red', value: redWins, color: '#c0392b' },
        { label: 'Draws', value: draws, color: '#ff9f0a' },
        { label: '⚫ Black', value: blackWins, color: '#48484a' },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '8px 16px',
            borderRadius: 12,
            background: 'var(--fill-tertiary)',
          }}
        >
          <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</span>
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
  const [turn, setTurn] = useState(RED)
  const [selected, setSelected] = useState(null) // {row, col}
  const [legalMoves, setLegalMoves] = useState([]) // all legal moves this turn
  const [winner, setWinner] = useState(null) // RED | BLACK | 'draw'
  const [redWins, setRedWins] = useState(0)
  const [blackWins, setBlackWins] = useState(0)
  const [draws, setDraws] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // Moves available for the selected piece
  const selectedMoves = selected
    ? legalMoves.filter(
        (m) => m.fromRow === selected.row && m.fromCol === selected.col
      )
    : []

  // Squares reachable from selected piece (final destination of each move)
  const reachableSquares = selectedMoves.map((m) => {
    const last = m.steps[m.steps.length - 1]
    return { row: last.toRow, col: last.toCol }
  })

  // Pieces that have at least one legal move
  const movablePieces = new Set(legalMoves.map((m) => `${m.fromRow},${m.fromCol}`))

  const startGame = useCallback((b = createInitialBoard(), t = RED) => {
    setBoard(b)
    setTurn(t)
    setSelected(null)
    setLegalMoves(getAllMoves(b, t))
    setWinner(null)
    setShowConfetti(false)
    setMoveCount(0)
  }, [])

  // Initialise legal moves on first render
  useState(() => {
    setLegalMoves(getAllMoves(createInitialBoard(), RED))
  })

  const handleSquareClick = useCallback(
    (row, col) => {
      if (winner) return

      const piece = board[row][col]

      // Clicking a reachable destination → execute move
      const destMove = selectedMoves.find((m) => {
        const last = m.steps[m.steps.length - 1]
        return last.toRow === row && last.toCol === col
      })

      if (destMove) {
        const newBoard = applyMove(board, destMove)
        const nextTurn = turn === RED ? BLACK : RED
        const nextMoves = getAllMoves(newBoard, nextTurn)
        const newMoveCount = moveCount + 1

        setBoard(newBoard)
        setSelected(null)

        if (nextMoves.length === 0) {
          // Current player wins (opponent has no moves)
          const w = turn
          setWinner(w)
          setShowConfetti(true)
          if (w === RED) setRedWins((n) => n + 1)
          else setBlackWins((n) => n + 1)
          setLegalMoves([])
        } else {
          setTurn(nextTurn)
          setLegalMoves(nextMoves)
          setMoveCount(newMoveCount)
        }
        return
      }

      // Clicking own piece → select it
      if (piece && piece.color === turn && movablePieces.has(`${row},${col}`)) {
        setSelected({ row, col })
        return
      }

      // Clicking elsewhere → deselect
      setSelected(null)
    },
    [board, turn, winner, selectedMoves, movablePieces, moveCount]
  )

  const handleNewGame = () => startGame()
  const handleResetScore = () => {
    setRedWins(0)
    setBlackWins(0)
    setDraws(0)
    startGame()
  }

  // Count pieces for display
  const redCount = board.flat().filter((p) => p && p.color === RED).length
  const blackCount = board.flat().filter((p) => p && p.color === BLACK).length

  // ── Win screen ─────────────────────────────────────────────────
  if (winner) {
    const label =
      winner === RED ? '🔴 Red Wins!' : winner === BLACK ? '⚫ Black Wins!' : "It's a Draw!"
    const color = winner === RED ? '#c0392b' : winner === BLACK ? '#2c2c2e' : '#ff9f0a'
    const emoji = winner === RED ? '🔴' : winner === BLACK ? '⚫' : '🤝'

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          padding: '24px 16px 48px',
        }}
      >
        {showConfetti && <Confetti />}

        <div
          className="spring-pop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: 32,
            borderRadius: 24,
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background: `linear-gradient(145deg, ${color}, ${color}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              boxShadow: `0 8px 24px ${color}40`,
            }}
          >
            {emoji}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--label-primary)',
              }}
            >
              {label}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--label-tertiary)', marginTop: 4 }}>
              Game over in {moveCount} move{moveCount !== 1 ? 's' : ''}
            </p>
          </div>

          <button onClick={handleNewGame} className="btn-primary" style={{ width: '100%' }}>
            Play Again
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <ScoreBar redWins={redWins} blackWins={blackWins} draws={draws} />
        </div>

        <button onClick={handleResetScore} className="btn-ghost">
          Reset Score
        </button>
      </div>
    )
  }

  // ── Playing screen ─────────────────────────────────────────────
  const turnColor = turn === RED ? '#c0392b' : '#2c2c2e'
  const turnLabel = turn === RED ? '🔴 Red' : '⚫ Black'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        padding: '8px 16px 48px',
      }}
    >
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
        Checkers
      </h1>

      {/* Score */}
      <ScoreBar redWins={redWins} blackWins={blackWins} draws={draws} />

      {/* Turn indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          borderRadius: 12,
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
          border: `2px solid ${turnColor}`,
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: turnColor }}>
          {turnLabel}'s turn
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--label-tertiary)' }}>
          🔴 {redCount} · ⚫ {blackCount}
        </span>
      </div>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          width: '100%',
          maxWidth: 480,
          aspectRatio: '1 / 1',
          border: '3px solid var(--label-primary)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {board.map((rowArr, row) =>
          rowArr.map((piece, col) => {
            const isDark = (row + col) % 2 === 1
            const isSelected =
              selected && selected.row === row && selected.col === col
            const isReachable = reachableSquares.some(
              (s) => s.row === row && s.col === col
            )
            const isMovable =
              isDark &&
              piece &&
              piece.color === turn &&
              movablePieces.has(`${row},${col}`)

            return (
              <Square
                key={`${row}-${col}`}
                row={row}
                col={col}
                piece={piece}
                selected={isSelected}
                highlighted={isReachable}
                dot={isReachable}
                onClick={() => handleSquareClick(row, col)}
              />
            )
          })
        )}
      </div>

      {/* Hint */}
      <p
        style={{
          fontSize: '0.78rem',
          color: 'var(--label-tertiary)',
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        {selected
          ? 'Tap a highlighted square to move'
          : `${turnLabel} — tap one of your pieces to select it`}
      </p>

      {/* New game */}
      <button onClick={handleNewGame} className="btn-ghost">
        🔀 New Game
      </button>
    </div>
  )
}

