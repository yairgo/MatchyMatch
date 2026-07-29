import { useState } from 'react'

export default function KennyBoard() {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const handleClick = () => {
    setScore(score + 1)
  }

  const handleReset = () => {
    setScore(0)
    setGameOver(false)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Kenny's Click Challenge</h1>
        <p className="text-lg mb-6">Click as fast as you can!</p>
      </div>

      <div className="text-6xl font-bold mb-8">{score}</div>

      <button
        onClick={handleClick}
        disabled={gameOver}
        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xl font-bold rounded-lg transition-colors"
      >
        Click Me!
      </button>

      <button
        onClick={handleReset}
        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
      >
        New Game
      </button>
    </div>
  )
}

