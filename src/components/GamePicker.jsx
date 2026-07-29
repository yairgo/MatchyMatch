const GAMES = [
  {
    id: 'matchy',
    emoji: '🟪',
    name: 'Matchy Match',
    description: 'Group 20 words into 5 hidden categories',
    color: '#5e5ce6',
  },
  {
    id: 'wordle',
    emoji: '🟩',
    name: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries',
    color: '#34c759',
  },
  {
    id: 'crunch',
    emoji: '🔢',
    name: 'Number Crunch',
    description: 'Hit the target using 6 numbers & operators',
    color: '#ff9f0a',
  },
  {
    id: 'cross',
    emoji: '✏️',
    name: 'Crossword',
    description: 'Fill in the classic crossword grid',
    color: '#007aff',
  },
  {
    id: 'chain',
    emoji: '🔗',
    name: 'Word Chain',
    description: 'Link words one letter change at a time',
    color: '#30d158',
  },
  {
    id: 'scramble',
    emoji: '🔀',
    name: 'Scramble',
    description: 'Unscramble the jumbled letters',
    color: '#ff6b6b',
  },
  {
    id: 'anagram',
    emoji: '🔤',
    name: 'Anagram',
    description: 'Rearrange letters to find the hidden word',
    color: '#bf5af2',
  },
  {
    id: 'sudoku',
    emoji: '🔲',
    name: 'Sudoku',
    description: 'Fill the 9×9 grid with digits 1–9',
    color: '#636366',
  },
  {
    id: 'trivia',
    emoji: '🧠',
    name: 'Trivia',
    description: 'Test your knowledge across many topics',
    color: '#ff9f0a',
  },
  {
    id: 'memory',
    emoji: '🃏',
    name: 'Memory',
    description: 'Flip cards and find every matching pair',
    color: '#0a84ff',
  },
  {
    id: 'puppyfetch',
    emoji: '🐕',
    name: 'Puppy Fetch',
    description: 'Match all the dog breed pairs to get treats',
    color: '#d4a574',
  },
  {
    id: 'catmatch',
    emoji: '🐱',
    name: 'Cat Match',
    description: 'Match all the kitties in the fewest moves',
    color: '#ff6b6b',
  },
  {
    id: 'typerace',
    emoji: '⌨️',
    name: 'Type Race',
    description: 'Type the passage as fast as you can',
    color: '#30d158',
  },
  {
    id: 'wordsearch',
    emoji: '🔍',
    name: 'Word Search',
    description: 'Hunt for hidden words in the grid',
    color: '#5e5ce6',
  },
  {
    id: 'mathquiz',
    emoji: '➕',
    name: 'Math Quiz',
    description: 'Solve rapid-fire arithmetic questions',
    color: '#ff6b6b',
  },
  {
    id: 'hangman',
    emoji: '🪢',
    name: 'Hangman',
    description: 'Guess the word before the drawing is done',
    color: '#636366',
  },
  {
    id: 'snake',
    emoji: '🐍',
    name: 'Snake',
    description: "Eat, grow, and don't hit the walls",
    color: '#30d158',
  },
  {
    id: 'spellingbee',
    emoji: '🐝',
    name: 'Spelling Bee',
    description: 'Make words from 7 letters — use the centre one',
    color: '#ff9f0a',
  },
  {
    id: '2048',
    emoji: '🟧',
    name: '2048',
    description: 'Slide & merge tiles to reach the 2048 tile',
    color: '#f65e3b',
  },
  {
    id: 'minesweeper',
    emoji: '💣',
    name: "Ryanfield",
    description: "Clear Ryan's field without hitting a bomb",
    color: '#2e7d32',
  },
  {
    id: 'tictactoe',
    emoji: '⭕',
    name: 'Tic Tac Toe with Brian 🧠',
    description: 'Use your brain to beat Brian!',
    color: '#0a84ff',
  },
  {
    id: 'barrysblitz',
    emoji: '⚡',
    name: "Barry's Blitz",
    description: 'Race against time to match words to categories',
    color: '#ff3b30',
  },
  {
    id: 'gregsegg',
    emoji: '🥚',
    name: "Greg's Egg",
    description: "Tap Greg's eggs before they hatch — timing is everything!",
    color: '#f4a22d',
  },
  {
    id: 'nathanielninja',
    emoji: '🥋',
    name: "Nathaniel's Number Ninja",
    description: 'Identify numbers quickly before time runs out!',
    color: '#0a84ff',
  },
  {
    id: 'nickofttime',
    emoji: '⏱️',
    name: "Nick of T-Time",
    description: "Tap in the nick of time — land the marker in the green zone!",
    color: '#5e5ce6',
  },
  {
    id: 'colourclash',
    emoji: '🎨',
    name: 'Colour Clash',
    description: 'Tap the ink colour, not the word — beat the Stroop effect!',
    color: '#ff2d55',
  },
  {
    id: 'flipflop',
    emoji: '🎴',
    name: 'Flip Flop',
    description: 'Match all the fruit pairs in the fewest moves',
    color: '#ff9f0a',
  },
  {
    id: 'diceroll',
    emoji: '🎲',
    name: 'Dice Roll',
    description: 'Roll two dice and try to hit the target sum',
    color: '#ff3b30',
  },
  {
    id: 'chess',
    emoji: '♟️',
    name: 'Chess',
    description: 'Play the classic game of chess against a friend',
    color: '#8b7355',
  },
  {
    id: 'kenny',
    emoji: '🎮',
    name: "Kenny's Click Challenge",
    description: 'Click as fast as you can to rack up points!',
    color: '#0a84ff',
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
