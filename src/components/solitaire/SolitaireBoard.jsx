import { useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'

// ── Card suits and values ─────────────────────────────────────────
const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUIT_COLORS = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' }

// ── Card component ────────────────────────────────────────────────
function Card({ card, onClick, isDragging, style }) {
  if (!card) {
    return (
      <div
        className="card-placeholder"
        style={{
          width: 70,
          height: 95,
          borderRadius: 8,
          border: '2px dashed var(--fill-tertiary)',
          background: 'transparent',
          ...style,
        }}
      />
    )
  }

  const isRed = SUIT_COLORS[card.suit] === 'red'

  return (
    <div
      onClick={onClick}
      className={clsx('card', isDragging && 'dragging')}
      style={{
        width: 70,
        height: 95,
        borderRadius: 8,
        background: card.faceUp ? 'white' : 'var(--accent)',
        border: '1px solid var(--fill-tertiary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.1s ease',
        color: isRed ? '#ff3b30' : '#1d1d1f',
        fontWeight: 600,
        fontSize: '1rem',
        ...style,
      }}
    >
      {card.faceUp ? (
        <>
          <div style={{ fontSize: '0.75rem' }}>{card.value}</div>
          <div style={{ fontSize: '1.5rem' }}>{card.suit}</div>
        </>
      ) : (
        <div style={{ fontSize: '1.5rem', color: 'white' }}>🂠</div>
      )}
    </div>
  )
}

// ── Game logic helpers ────────────────────────────────────────────
function createDeck() {
  const deck = []
  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push({ suit, value, faceUp: false })
    }
  }
  return deck
}

function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCardValue(card) {
  const valueMap = { A: 1, J: 11, Q: 12, K: 13 }
  return valueMap[card.value] || parseInt(card.value)
}

function canPlaceOnTableau(card, targetCard) {
  if (!targetCard) return getCardValue(card) === 13 // Only King on empty
  
  const cardValue = getCardValue(card)
  const targetValue = getCardValue(targetCard)
  const cardColor = SUIT_COLORS[card.suit]
  const targetColor = SUIT_COLORS[targetCard.suit]
  
  return cardValue === targetValue - 1 && cardColor !== targetColor
}

function canPlaceOnFoundation(card, foundation) {
  if (foundation.length === 0) return getCardValue(card) === 1 // Only Ace on empty
  
  const topCard = foundation[foundation.length - 1]
  return (
    card.suit === topCard.suit &&
    getCardValue(card) === getCardValue(topCard) + 1
  )
}

// ── Win screen ────────────────────────────────────────────────────
function WinScreen({ moves, onPlayAgain }) {
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
          background: 'linear-gradient(145deg, #34c759, #34c759dd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          boxShadow: '0 8px 24px #34c75940',
        }}
      >
        🎉
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
          You Won!
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--label-tertiary)' }}>
          Completed in {moves} moves
        </p>
      </div>

      <button onClick={onPlayAgain} className="btn-primary w-full">
        Play Again
      </button>
    </div>
  )
}

// ── Main board ────────────────────────────────────────────────────
export default function SolitaireBoard() {
  const [stock, setStock] = useState([])
  const [waste, setWaste] = useState([])
  const [foundations, setFoundations] = useState([[], [], [], []])
  const [tableau, setTableau] = useState([[], [], [], [], [], [], []])
  const [selectedCard, setSelectedCard] = useState(null)
  const [moves, setMoves] = useState(0)
  const [gameState, setGameState] = useState('playing')

  // Initialize game
  const initGame = useCallback(() => {
    const deck = shuffleDeck(createDeck())
    const newTableau = [[], [], [], [], [], [], []]
    
    let deckIndex = 0
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[deckIndex++]
        card.faceUp = row === col
        newTableau[col].push(card)
      }
    }
    
    const remainingDeck = deck.slice(deckIndex)
    
    setTableau(newTableau)
    setStock(remainingDeck)
    setWaste([])
    setFoundations([[], [], [], []])
    setSelectedCard(null)
    setMoves(0)
    setGameState('playing')
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing') {
      const allFoundationsComplete = foundations.every(f => f.length === 13)
      if (allFoundationsComplete) {
        setGameState('won')
      }
    }
  }, [foundations, gameState])

  const handleStockClick = () => {
    if (stock.length > 0) {
      const card = stock[stock.length - 1]
      card.faceUp = true
      setWaste([...waste, card])
      setStock(stock.slice(0, -1))
      setMoves(m => m + 1)
    } else if (waste.length > 0) {
      // Reset stock from waste
      const resetCards = waste.map(c => ({ ...c, faceUp: false }))
      setStock(resetCards.reverse())
      setWaste([])
      setMoves(m => m + 1)
    }
  }

  const handleWasteClick = () => {
    if (waste.length > 0) {
      const card = waste[waste.length - 1]
      setSelectedCard({ card, from: 'waste' })
    }
  }

  const handleTableauClick = (colIndex) => {
    const column = tableau[colIndex]
    if (column.length === 0) {
      // Empty column - can place King
      if (selectedCard && getCardValue(selectedCard.card) === 13) {
        moveCard(selectedCard, 'tableau', colIndex)
      }
      return
    }

    const topCard = column[column.length - 1]
    
    if (!topCard.faceUp) return

    if (selectedCard) {
      // Try to place selected card
      if (canPlaceOnTableau(selectedCard.card, topCard)) {
        moveCard(selectedCard, 'tableau', colIndex)
      }
    } else {
      // Select this card
      setSelectedCard({ card: topCard, from: 'tableau', colIndex })
    }
  }

  const handleFoundationClick = (foundationIndex) => {
    if (selectedCard) {
      const foundation = foundations[foundationIndex]
      if (canPlaceOnFoundation(selectedCard.card, foundation)) {
        moveCard(selectedCard, 'foundation', foundationIndex)
      }
    }
  }

  const moveCard = (selected, toType, toIndex) => {
    setMoves(m => m + 1)

    if (selected.from === 'waste') {
      const newWaste = waste.slice(0, -1)
      setWaste(newWaste)
    } else if (selected.from === 'tableau') {
      const newTableau = [...tableau]
      newTableau[selected.colIndex] = newTableau[selected.colIndex].slice(0, -1)
      
      // Flip top card if exists
      if (newTableau[selected.colIndex].length > 0) {
        const topCard = newTableau[selected.colIndex][newTableau[selected.colIndex].length - 1]
        topCard.faceUp = true
      }
      
      setTableau(newTableau)
    }

    if (toType === 'tableau') {
      const newTableau = [...tableau]
      newTableau[toIndex] = [...newTableau[toIndex], selected.card]
      setTableau(newTableau)
    } else if (toType === 'foundation') {
      const newFoundations = [...foundations]
      newFoundations[toIndex] = [...newFoundations[toIndex], selected.card]
      setFoundations(newFoundations)
    }

    setSelectedCard(null)
  }

  // Auto-move to foundation on double-click
  const tryAutoMoveToFoundation = (card) => {
    for (let i = 0; i < 4; i++) {
      if (canPlaceOnFoundation(card, foundations[i])) {
        return i
      }
    }
    return -1
  }

  if (gameState === 'won') {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        <WinScreen moves={moves} onPlayAgain={initGame} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-12">
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
        Solitaire ♠️
      </h1>

      {/* Moves counter */}
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--label-secondary)',
          textAlign: 'center',
        }}
      >
        Moves: {moves}
      </div>

      {/* Top row: Stock, Waste, and Foundations */}
      <div className="flex gap-3 justify-between w-full max-w-2xl">
        <div className="flex gap-3">
          {/* Stock */}
          <div onClick={handleStockClick}>
            {stock.length > 0 ? (
              <Card card={{ suit: '♠', value: '', faceUp: false }} />
            ) : (
              <Card card={null} />
            )}
          </div>

          {/* Waste */}
          <div onClick={handleWasteClick}>
            {waste.length > 0 ? (
              <Card 
                card={waste[waste.length - 1]} 
                style={{
                  border: selectedCard?.from === 'waste' ? '3px solid #0a84ff' : undefined
                }}
              />
            ) : (
              <Card card={null} />
            )}
          </div>
        </div>

        {/* Foundations */}
        <div className="flex gap-3">
          {foundations.map((foundation, i) => (
            <div key={i} onClick={() => handleFoundationClick(i)}>
              {foundation.length > 0 ? (
                <Card card={foundation[foundation.length - 1]} />
              ) : (
                <Card card={null} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="flex gap-3 w-full max-w-2xl overflow-x-auto">
        {tableau.map((column, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-1 flex-1 min-w-[70px]"
            onClick={() => handleTableauClick(colIndex)}
          >
            {column.length === 0 ? (
              <Card card={null} />
            ) : (
              column.map((card, cardIndex) => (
                <Card
                  key={cardIndex}
                  card={card}
                  style={{
                    marginTop: cardIndex > 0 ? -70 : 0,
                    border:
                      selectedCard?.from === 'tableau' &&
                      selectedCard?.colIndex === colIndex &&
                      cardIndex === column.length - 1
                        ? '3px solid #0a84ff'
                        : undefined,
                  }}
                />
              ))
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <p
        className="text-center"
        style={{
          fontSize: '0.78rem',
          color: 'var(--label-tertiary)',
          letterSpacing: '-0.01em',
          maxWidth: 500,
        }}
      >
        Click cards to select and move them. Build foundations from Ace to King by suit.
        Arrange tableau in descending order with alternating colors.
      </p>

      {/* New game button */}
      <button onClick={initGame} className="btn-ghost">
        🔀 New Game
      </button>
    </div>
  )
}
