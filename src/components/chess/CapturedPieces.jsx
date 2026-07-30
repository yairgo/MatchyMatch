const PIECE_SYMBOLS = {
  pawn: { white: '♙', black: '♟' },
  rook: { white: '♖', black: '♜' },
  knight: { white: '♘', black: '♞' },
  bishop: { white: '♗', black: '♝' },
  queen: { white: '♕', black: '♛' },
  king: { white: '♔', black: '♚' },
}

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
}

export default function CapturedPieces({ capturedPieces }) {
  const calculateMaterial = (pieces) => {
    return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
  }

  const whiteMaterial = calculateMaterial(capturedPieces.black)
  const blackMaterial = calculateMaterial(capturedPieces.white)

  const renderPieces = (pieces) => {
    return pieces.map((piece, idx) => (
      <span key={idx} className={`captured-piece piece-${piece.color}`}>
        {PIECE_SYMBOLS[piece.type][piece.color]}
      </span>
    ))
  }

  return (
    <div className="captured-pieces">
      <div className="captured-section">
        <div className="captured-label">White captured</div>
        <div className="captured-list">
          {renderPieces(capturedPieces.black, 'white')}
        </div>
        {whiteMaterial > 0 && (
          <div className="material-count">+{whiteMaterial}</div>
        )}
      </div>

      <div className="captured-section">
        <div className="captured-label">Black captured</div>
        <div className="captured-list">
          {renderPieces(capturedPieces.white, 'black')}
        </div>
        {blackMaterial > 0 && (
          <div className="material-count">+{blackMaterial}</div>
        )}
      </div>
    </div>
  )
}
