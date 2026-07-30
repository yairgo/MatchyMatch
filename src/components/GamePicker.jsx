const GAMES = [
 ...
 ,
  {
    id: 'keno',
    emoji: '🎰',
    name: 'Keno',
    description: 'Pick numbers and hope for the best!',
    color: '#ff9f0a',
  },
]

export default function GamePicker({ onGameSelect }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <p
          className="text-sm font-medium tracking-wide uppercase mb-2"
          style={{ color: 'var(--label-tertiary)' }}
        >
          Pick a game
        </p>
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: 'var(--label-primary)' }}
        >
          What are we playing?
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            className="game-card group text-left"
            style={{ '--card-accent': game.color }}
          >
            {/* Emoji badge */}
            <span className="game-card__emoji">{game.emoji}</span>

            {/* Text */}
            <span className="game-card__name">{game.name}</span>
            <span className="game-card__desc">{game.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

