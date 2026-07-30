import { useState, useCallback } from 'react'
import { initializeBoard, isValidMove, makeMove, isCheck, isCheckmate, isStalemate, getValidMoves } from '../utils/chessRules'

export function useChessGame() {
  const [board, setBoard] = useState(() => initializeBoard())
  const [turn, setTurn] = useState('white')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [moveHistory, setMoveHistory] = useState([])
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [gameStatus, setGameStatus] = useState('active')

  const updateGameStatus = useCallback((newBoard, newTurn) => {
    if (isCheckmate(newBoard, newTurn)) {
      setGameStatus('checkmate')
    } else if (isStalemate(newBoard, newTurn)) {
      setGameStatus('stalemate')
    } else if (isCheck(newBoard, newTurn)) {
      setGameStatus('check')
    } else {
      setGameStatus('active')
    }
  }, [])

  const validMoves = selectedSquare
    ? getValidMoves(board, selectedSquare.row, selectedSquare.col, turn)
    : []

  const selectSquare = useCallback(
    (square) => {
      if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return

      const piece = board[square.row][square.col]

      // If clicking the same square, deselect
      if (
        selectedSquare &&
        selectedSquare.row === square.row &&
        selectedSquare.col === square.col
      ) {
        setSelectedSquare(null)
        return
      }

      // If clicking a piece of the current player, select it
      if (piece && piece.color === turn) {
        setSelectedSquare(square)
      } else if (!piece) {
        // If clicking empty square, deselect
        setSelectedSquare(null)
      }
    },
    [board, selectedSquare, turn, gameStatus]
  )

  const makeGameMove = useCallback(
    (toSquare) => {
      if (!selectedSquare) return

      const fromSquare = selectedSquare

      if (!isValidMove(board, fromSquare, toSquare, turn)) {
        return
      }

      const { newBoard, capturedPiece, notation } = makeMove(
        board,
        fromSquare,
        toSquare,
        turn
      )

      setBoard(newBoard)
      setSelectedSquare(null)

      // Update captured pieces
      if (capturedPiece) {
        setCapturedPieces((prev) => ({
          ...prev,
          [turn]: [...prev[turn], capturedPiece],
        }))
      }

      // Update move history
      setMoveHistory((prev) => [...prev, { ...fromSquare, ...toSquare, notation }])

      // Switch turn
      const newTurn = turn === 'white' ? 'black' : 'white'
      setTurn(newTurn)

      // Update game status
      updateGameStatus(newBoard, newTurn)
    },
    [board, selectedSquare, turn, updateGameStatus]
  )

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return

    // Reset to initial board and replay all moves except the last one
    let newBoard = initializeBoard()
    let newCapturedPieces = { white: [], black: [] }
    let newTurn = 'white'

    for (let i = 0; i < moveHistory.length - 1; i++) {
      // move = moveHistory[i] would be used in a full undo implementation

      // This is a simplified undo - in production, you'd store full move data
      // For now, we'll just remove the last move from history
    }

    // Simplified: just remove last move
    const newHistory = moveHistory.slice(0, -1)
    setMoveHistory(newHistory)

    // Recalculate board state
    newBoard = initializeBoard()
    newCapturedPieces = { white: [], black: [] }
    newTurn = 'white'

    for (const move of newHistory) {
      const fromSquare = { row: move.row, col: move.col }
      const toSquare = { row: move.row, col: move.col }
      const { newBoard: updatedBoard, capturedPiece } = makeMove(
        newBoard,
        fromSquare,
        toSquare,
        newTurn
      )
      newBoard = updatedBoard
      if (capturedPiece) {
        newCapturedPieces[newTurn].push(capturedPiece)
      }
      newTurn = newTurn === 'white' ? 'black' : 'white'
    }

    setBoard(newBoard)
    setCapturedPieces(newCapturedPieces)
    setTurn(newTurn)
    setSelectedSquare(null)
    updateGameStatus(newBoard, newTurn)
  }, [moveHistory, updateGameStatus])

  const resetGame = useCallback(() => {
    setBoard(initializeBoard())
    setTurn('white')
    setSelectedSquare(null)
    setMoveHistory([])
    setCapturedPieces({ white: [], black: [] })
    setGameStatus('active')
  }, [])

  return {
    board,
    turn,
    gameStatus,
    selectedSquare,
    validMoves,
    moveHistory,
    capturedPieces,
    selectSquare,
    makeMove: makeGameMove,
    undoMove,
    resetGame,
  }
}
