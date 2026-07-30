import { useState } from 'react'
import Toast from '../Toast'
import Confetti from '../Confetti'

export default function DiceRollBoard() {
  const TARGET = 7
  const MAX_ROLLS = 10
  const [dice, setDice] = useState([0, 0])
  const [rolls, setRolls] = useState(0)
  const [gameState, setGameState] = useState('playing') // 'playing', 'won', 'lost'
  const [message, setMessage] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [rollHistory, setRollHistory] = useState([])

  const handleRoll = () => {
    if (gameState !== 'playing') return

    const d1 = Math.floor(Math.random() * 6) + 1
    const d2 = Math.floor(Math.random() * 6) + 1
    const sum = d1 + d2
    const newRollCount = rolls + 1

    setDice([d1, d2])
    setRolls(newRollCount)
    setRollHistory([...rollHistory, { d1, d2, sum }])

    if (sum === TARGET) {
      setGameState('won')
      setMessage(`🎉 You got ${TARGET}! Won in ${newRollCount} roll${newRollCount === 1 ? '' : 's'}!`)
      setShowConfetti(true)
    } else if (newRollCount >= MAX_ROLLS) {
      setGameState('lost')
      setMessage(`Game Over! You didn't reach ${TARGET} in ${MAX_ROLLS} rolls.`)
    } else {
      setMessage(`Rolled ${sum}. Keep going!`)
    }
  }

  const handleReset = () => {
    setDice([0, 0])
    setRolls(0)
    setGameState('playing')
    setMessage('')
    setShowConfetti(false)
    setRollHistory([])
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--label-primary)' }}
        >
          Dice Roll
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--label-secondary)' }}
        >
          Roll two dice and try to hit {TARGET}
        </p>
      </div>

      {/* Status */}
      <div
        className="text-center p-4 rounded-lg mb-6 font-semibold"
        style={{ backgroundColor: 'var(--fill-tertiary)', color: 'var(--label-primary)' }}
      >
        <p>Rolls: {rolls} / {MAX_ROLLS}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--label-secondary)' }}>
          Target: {TARGET}
        </p>
      </div>

      {/* Dice Display */}
      <div className="flex justify-center gap-6 mb-8">
        <div className="w-24 h-24 flex items-center justify-center rounded-lg font-bold text-4xl"
          style={{ backgroundColor: 'var(--fill-secondary)', color: 'var(--label-primary)' }}
        >
          {dice[0] === 0 ? '?' : dice[0]}
        </div>
        <div className="w-24 h-24 flex items-center justify-center rounded-lg font-bold text-4xl"
          style={{ backgroundColor: 'var(--fill-secondary)', color: 'var(--label-primary)' }}
        >
          {dice[1] === 0 ? '?' : dice[1]}
        </div>
      </div>

      {/* Sum Display */}
      {rolls > 0 && (
        <div className="text-center mb-6">
          <p className="text-2xl font-bold" style={{ color: 'var(--label-primary)' }}>
            Sum: {dice[0] + dice[1]}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleRoll}
          disabled={gameState !== 'playing'}
          className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {gameState === 'playing' ? 'Roll Dice' : gameState === 'won' ? '✓ Won!' : '✗ Game Over'}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-6 py-3 rounded-lg font-semibold"
          style={{ backgroundColor: 'var(--fill-tertiary)', color: 'var(--label-primary)' }}
        >
          New Game
        </button>
      </div>

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: 'var(--fill-tertiary)' }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--label-primary)' }}>
            History
          </p>
          <div className="flex flex-wrap gap-2">
            {rollHistory.map((roll, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs rounded font-mono"
                style={{
                  backgroundColor: roll.sum === TARGET ? '#30d158' : 'var(--fill-secondary)',
                  color: roll.sum === TARGET ? 'white' : 'var(--label-primary)',
                }}
              >
                {roll.d1}+{roll.d2}={roll.sum}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <Toast message={message} />
      )}

      {/* Confetti */}
      {showConfetti && (
        <Confetti />
      )}
    </div>
  )
}
