// Initialize the chess board with standard starting position
export function initializeBoard() {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // Black pieces (top)
  board[0][0] = { type: 'rook', color: 'black' }
  board[0][1] = { type: 'knight', color: 'black' }
  board[0][2] = { type: 'bishop', color: 'black' }
  board[0][3] = { type: 'queen', color: 'black' }
  board[0][4] = { type: 'king', color: 'black' }
  board[0][5] = { type: 'bishop', color: 'black' }
  board[0][6] = { type: 'knight', color: 'black' }
  board[0][7] = { type: 'rook', color: 'black' }

  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' }
  }

  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' }
  }

  board[7][0] = { type: 'rook', color: 'white' }
  board[7][1] = { type: 'knight', color: 'white' }
  board[7][2] = { type: 'bishop', color: 'white' }
  board[7][3] = { type: 'queen', color: 'white' }
  board[7][4] = { type: 'king', color: 'white' }
  board[7][5] = { type: 'bishop', color: 'white' }
  board[7][6] = { type: 'knight', color: 'white' }
  board[7][7] = { type: 'rook', color: 'white' }

  return board
}

// Get all valid moves for a piece at a given square
export function getValidMoves(board, row, col, currentTurn) {
  const piece = board[row][col]
  if (!piece || piece.color !== currentTurn) return []

  const moves = []

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, row, col, piece.color))
      break
    case 'rook':
      moves.push(...getRookMoves(board, row, col, piece.color))
      break
    case 'knight':
      moves.push(...getKnightMoves(board, row, col, piece.color))
      break
    case 'bishop':
      moves.push(...getBishopMoves(board, row, col, piece.color))
      break
    case 'queen':
      moves.push(...getQueenMoves(board, row, col, piece.color))
      break
    case 'king':
      moves.push(...getKingMoves(board, row, col, piece.color))
      break
  }

  // Filter out moves that would leave king in check
  return moves.filter((move) => {
    const testBoard = board.map((r) => [...r])
    const movingPiece = testBoard[row][col]
    testBoard[move.row][move.col] = movingPiece
    testBoard[row][col] = null
    return !isCheck(testBoard, piece.color)
  })
}

function getPawnMoves(board, row, col, color) {
  const moves = []
  const direction = color === 'white' ? -1 : 1
  const startRow = color === 'white' ? 6 : 1

  // Forward move
  const nextRow = row + direction
  if (nextRow >= 0 && nextRow < 8 && !board[nextRow][col]) {
    moves.push({ row: nextRow, col })

    // Double move from start
    if (row === startRow) {
      const doubleRow = row + 2 * direction
      if (!board[doubleRow][col]) {
        moves.push({ row: doubleRow, col })
      }
    }
  }

  // Captures
  for (const dcol of [-1, 1]) {
    const captureRow = row + direction
    const captureCol = col + dcol
    if (
      captureRow >= 0 &&
      captureRow < 8 &&
      captureCol >= 0 &&
      captureCol < 8
    ) {
      const target = board[captureRow][captureCol]
      if (target && target.color !== color) {
        moves.push({ row: captureRow, col: captureCol })
      }
    }
  }

  return moves
}

function getRookMoves(board, row, col, color) {
  const moves = []
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  for (const [dr, dc] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break

      const target = board[newRow][newCol]
      if (!target) {
        moves.push({ row: newRow, col: newCol })
      } else if (target.color !== color) {
        moves.push({ row: newRow, col: newCol })
        break
      } else {
        break
      }
    }
  }

  return moves
}

function getKnightMoves(board, row, col, color) {
  const moves = []
  const offsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ]

  for (const [dr, dc] of offsets) {
    const newRow = row + dr
    const newCol = col + dc

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol]
      if (!target || target.color !== color) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }

  return moves
}

function getBishopMoves(board, row, col, color) {
  const moves = []
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]

  for (const [dr, dc] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + dr * i
      const newCol = col + dc * i

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break

      const target = board[newRow][newCol]
      if (!target) {
        moves.push({ row: newRow, col: newCol })
      } else if (target.color !== color) {
        moves.push({ row: newRow, col: newCol })
        break
      } else {
        break
      }
    }
  }

  return moves
}

function getQueenMoves(board, row, col, color) {
  return [
    ...getRookMoves(board, row, col, color),
    ...getBishopMoves(board, row, col, color),
  ]
}

function getKingMoves(board, row, col, color) {
  const moves = []
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]

  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol]
      if (!target || target.color !== color) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }

  return moves
}

// Check if a move is valid
export function isValidMove(board, from, to, currentTurn) {
  const piece = board[from.row][from.col]
  if (!piece || piece.color !== currentTurn) return false

  const validMoves = getValidMoves(board, from.row, from.col, currentTurn)
  return validMoves.some((move) => move.row === to.row && move.col === to.col)
}

// Make a move and return the new board state
export function makeMove(board, from, to) {
  const newBoard = board.map((row) => [...row])
  const piece = newBoard[from.row][from.col]
  const capturedPiece = newBoard[to.row][to.col]

  newBoard[to.row][to.col] = piece
  newBoard[from.row][from.col] = null

  // Handle pawn promotion
  if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    newBoard[to.row][to.col] = { ...piece, type: 'queen' }
  }

  const notation = getNotation(from, to, piece, capturedPiece)

  return { newBoard, capturedPiece, notation }
}

// Get algebraic notation for a move
function getNotation(from, to, piece, capturedPiece) {
  const files = 'abcdefgh'
  const ranks = '87654321'
  const toSquare = files[to.col] + ranks[to.row]

  let notation = ''

  if (piece.type === 'pawn') {
    if (capturedPiece) {
      notation = `${files[from.col]}x${toSquare}`
    } else {
      notation = toSquare
    }
  } else {
    const pieceSymbol = piece.type.charAt(0).toUpperCase()
    if (capturedPiece) {
      notation = `${pieceSymbol}x${toSquare}`
    } else {
      notation = `${pieceSymbol}${toSquare}`
    }
  }

  return notation
}

// Find the king position
function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col }
      }
    }
  }
  return null
}

// Check if a square is under attack
function isSquareUnderAttack(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === byColor) {
        const moves = getValidMovesWithoutCheckFilter(board, r, c, byColor)
        if (moves.some((move) => move.row === row && move.col === col)) {
          return true
        }
      }
    }
  }
  return false
}

// Get valid moves without filtering for check (to avoid infinite recursion)
function getValidMovesWithoutCheckFilter(board, row, col, color) {
  const piece = board[row][col]
  if (!piece || piece.color !== color) return []

  const moves = []

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, row, col, color))
      break
    case 'rook':
      moves.push(...getRookMoves(board, row, col, color))
      break
    case 'knight':
      moves.push(...getKnightMoves(board, row, col, color))
      break
    case 'bishop':
      moves.push(...getBishopMoves(board, row, col, color))
      break
    case 'queen':
      moves.push(...getQueenMoves(board, row, col, color))
      break
    case 'king':
      moves.push(...getKingMoves(board, row, col, color))
      break
  }

  return moves
}

// Check if king is in check
export function isCheck(board, color) {
  const kingPos = findKing(board, color)
  if (!kingPos) return false

  const opponentColor = color === 'white' ? 'black' : 'white'
  return isSquareUnderAttack(board, kingPos.row, kingPos.col, opponentColor)
}

// Check if it's checkmate
export function isCheckmate(board, color) {
  if (!isCheck(board, color)) return false

  // Check if there are any legal moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, row, col, color)
        if (moves.length > 0) return false
      }
    }
  }

  return true
}

// Check if it's stalemate
export function isStalemate(board, color) {
  if (isCheck(board, color)) return false

  // Check if there are any legal moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, row, col, color)
        if (moves.length > 0) return false
      }
    }
  }

  return true
}
