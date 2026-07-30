import { useState, useEffect, useCallback, useRef } from "react";
import Toast from "../Toast";

// ── Puzzle data ──────────────────────────────────────────────────────────────
// Each puzzle: 5×5 grid of letters (null = black square), plus across/down clues.
// Clue keys are "A{n}" (across) or "D{n}" (down), matching the numbered cells.

const PUZZLES = [
  {
    // Grid layout (5 rows × 5 cols). null = black cell.
    grid: [
      ["S", "T", "A", "R", "S"],
      ["H", null, "L", null, "E"],
      ["A", "R", "O", "M", "A"],
      ["R", null, "N", null, "L"],
      ["E", "A", "E", "S", "T"],
    ],
    clues: {
      across: {
        1: "Celestial bodies that twinkle",
        6: "Pleasant scent",
        7: "Compass direction (abbr.)",
      },
      down: {
        1: "Part of a blade",
        2: "Fragrant wood used in incense",
        3: "Solitary",
        4: "Aquatic mammal with flippers",
      },
    },
    // Map clue numbers to their starting [row, col]
    clueStarts: {
      A1: [0, 0], A6: [2, 0], A7: [4, 0],
      D1: [0, 0], D2: [0, 2], D3: [0, 4], D4: [0, 3],
    },
  },
  {
    grid: [
      ["B", "R", "A", "V", "E"],
      ["L", null, "P", null, "L"],
      ["U", "N", "E", "A", "S"],
      ["E", null, "S", null, "E"],
      ["S", "O", "T", "O", "S"],
    ],
    clues: {
      across: {
        1: "Courageous",
        6: "Not comfortable",
        7: "Musical notes (pl.)",
      },
      down: {
        1: "Primary colour of sky",
        2: "Ape relative (abbr.)",
        3: "Bees make this",
        4: "Volcanic rock",
      },
    },
    clueStarts: {
      A1: [0, 0], A6: [2, 0], A7: [4, 0],
      D1: [0, 0], D2: [0, 2], D3: [0, 4], D4: [0, 3],
    },
  },
  {
    grid: [
      ["F", "L", "O", "S", "S"],
      ["R", null, "V", null, "T"],
      ["O", "C", "E", "A", "N"],
      ["S", null, "N", null, "O"],
      ["T", "R", "S", "E", "W"],
    ],
    clues: {
      across: {
        1: "Dental cleaning thread",
        6: "Vast body of salt water",
        7: "Sewed (past tense)",
      },
      down: {
        1: "Ice crystals on grass",
        2: "Baked clay vessel",
        3: "Opposite of odd",
        4: "Celestial body orbiting a planet",
      },
    },
    clueStarts: {
      A1: [0, 0], A6: [2, 0], A7: [4, 0],
      D1: [0, 0], D2: [0, 2], D3: [0, 4], D4: [0, 3],
    },
  },
  {
    grid: [
      ["G", "L", "O", "W", "S"],
      ["R", null, "R", null, "T"],
      ["A", "T", "E", "A", "M"],
      ["P", null, "S", null, "P"],
      ["E", "A", "T", "E", "N"],
    ],
    clues: {
      across: {
        1: "Shines softly",
        6: "Group working together",
        7: "Consumed food (past tense)",
      },
      down: {
        1: "Fruit used in wine",
        2: "Spoken (past tense of 'say')",
        3: "Compass direction",
        4: "Stamp on a letter",
      },
    },
    clueStarts: {
      A1: [0, 0], A6: [2, 0], A7: [4, 0],
      D1: [0, 0], D2: [0, 2], D3: [0, 4], D4: [0, 3],
    },
  },
  {
    grid: [
      ["C", "H", "E", "S", "S"],
      ["L", null, "L", null, "T"],
      ["O", "V", "A", "L", "E"],
      ["U", null, "N", null, "E"],
      ["D", "E", "E", "P", "S"],
    ],
    clues: {
      across: {
        1: "Board game with kings and queens",
        6: "Egg-shaped",
        7: "Far down; profound",
      },
      down: {
        1: "Overcast sky feature",
        2: "Flexible tube for water",
        3: "Opposite of odd",
        4: "Pace faster than a walk",
      },
    },
    clueStarts: {
      A1: [0, 0], A6: [2, 0], A7: [4, 0],
      D1: [0, 0], D2: [0, 2], D3: [0, 4], D4: [0, 3],
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickPuzzle() {
  const day = Math.floor(Date.now() / 86400000);
  return PUZZLES[day % PUZZLES.length];
}

/** Return all [row,col] cells that belong to a given clue key */
function getClueCells(clueKey, puzzle) {
  const start = puzzle.clueStarts[clueKey];
  if (!start) return [];
  const [sr, sc] = start;
  const cells = [];
  if (clueKey.startsWith("A")) {
    for (let c = sc; c < 5; c++) {
      if (puzzle.grid[sr][c] === null) break;
      cells.push([sr, c]);
    }
  } else {
    for (let r = sr; r < 5; r++) {
      if (puzzle.grid[r][sc] === null) break;
      cells.push([r, sc]);
    }
  }
  return cells;
}

/** Given a cell, find which across & down clue it belongs to */
function getCluesForCell(row, col, puzzle) {
  const result = { across: null, down: null };
  for (const key of Object.keys(puzzle.clueStarts)) {
    const cells = getClueCells(key, puzzle);
    if (cells.some(([r, c]) => r === row && c === col)) {
      if (key.startsWith("A")) result.across = key;
      else result.down = key;
    }
  }
  return result;
}

/** Build a map of cell → clue number label */
function buildCellNumbers(puzzle) {
  const map = {};
  for (const [key, [r, c]] of Object.entries(puzzle.clueStarts)) {
    const num = key.slice(1);
    const existing = map[`${r},${c}`];
    if (!existing || parseInt(num) < parseInt(existing)) {
      map[`${r},${c}`] = num;
    }
  }
  return map;
}

// ── Cell component ───────────────────────────────────────────────────────────

function Cell({ letter, state, cellNum, onClick, inputRef, onKeyDown }) {
  // state: 'idle' | 'active-word' | 'active-cell' | 'correct' | 'black'
  const isBlack = state === "black";
  const isActiveCell = state === "active-cell";
  const isActiveWord = state === "active-word";
  const isCorrect = state === "correct";

  const bgColor = isBlack
    ? "var(--label-primary)"
    : isCorrect
    ? "#d1fae5"
    : isActiveCell
    ? "var(--accent-light)"
    : isActiveWord
    ? "#f0f6ff"
    : "var(--bg-surface)";

  const borderColor = isBlack
    ? "var(--label-primary)"
    : isActiveCell
    ? "var(--accent)"
    : isCorrect
    ? "#6ee7b7"
    : "rgba(0,0,0,0.12)";

  return (
    <div
      onClick={isBlack ? undefined : onClick}
      className="relative flex items-center justify-center select-none"
      style={{
        width: "100%",
        aspectRatio: "1",
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 6,
        cursor: isBlack ? "default" : "pointer",
        transition: "background 0.15s ease, border-color 0.15s ease",
        boxShadow: isActiveCell ? "0 0 0 3px rgba(0,122,255,0.18)" : undefined,
      }}
    >
      {/* Clue number */}
      {cellNum && !isBlack && (
        <span
          style={{
            position: "absolute",
            top: 2,
            left: 3,
            fontSize: "clamp(7px, 1.8vw, 10px)",
            fontWeight: 700,
            color: isActiveCell ? "var(--accent)" : "var(--label-tertiary)",
            lineHeight: 1,
          }}
        >
          {cellNum}
        </span>
      )}
      {/* Hidden input for mobile keyboard */}
      {isActiveCell && (
        <input
          ref={inputRef}
          value=""
          onChange={() => {}}
          onKeyDown={onKeyDown}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
        />
      )}
      {/* Letter */}
      {!isBlack && (
        <span
          style={{
            fontSize: "clamp(0.9rem, 3.5vw, 1.25rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: isCorrect
              ? "#059669"
              : isActiveCell
              ? "var(--accent)"
              : "var(--label-primary)",
          }}
        >
          {letter || ""}
        </span>
      )}
    </div>
  );
}

// ── Clue list ────────────────────────────────────────────────────────────────

function ClueList({ title, clues, activeClue, onClueClick, solvedClues }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--label-tertiary)",
        }}
      >
        {title}
      </p>
      {Object.entries(clues).map(([num, text]) => {
        const key = `${title[0]}${num}`;
        const isActive = activeClue === key;
        const isSolved = solvedClues.has(key);
        return (
          <button
            key={key}
            onClick={() => onClueClick(key)}
            className="text-left rounded-xl px-3 py-2 transition-all"
            style={{
              background: isActive
                ? "var(--accent-light)"
                : "transparent",
              border: isActive
                ? "1px solid var(--accent-mid)"
                : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: isActive ? 600 : 400,
                color: isSolved
                  ? "#059669"
                  : isActive
                  ? "var(--accent)"
                  : "var(--label-secondary)",
                textDecoration: isSolved ? "line-through" : "none",
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ fontWeight: 700, marginRight: 4 }}>{num}.</span>
              {text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main board ───────────────────────────────────────────────────────────────

export default function CrosswordBoard() {
  const [puzzle] = useState(pickPuzzle);
  const [gameKey, setGameKey] = useState(0);

  return (
    <CrosswordGame
      key={gameKey}
      puzzle={puzzle}
      onNewGame={() => setGameKey((k) => k + 1)}
    />
  );
}

function CrosswordGame({ puzzle, onNewGame }) {
  // letters[row][col] = string typed by user
  const [letters, setLetters] = useState(() =>
    Array.from({ length: 5 }, () => Array(5).fill(""))
  );
  const [activeClue, setActiveClue] = useState("A1");
  const [activeCell, setActiveCell] = useState([0, 0]);
  const [gameState, setGameState] = useState("playing"); // 'playing' | 'won'
  const [toast, setToast] = useState(null);
  const [solvedClues, setSolvedClues] = useState(new Set());
  const inputRef = useRef(null);

  const cellNumbers = buildCellNumbers(puzzle);

  // Cells belonging to the active clue
  const activeClueCells = getClueCells(activeClue, puzzle);

  // Check if a clue is fully and correctly filled
  const isClueCorrect = useCallback(
    (clueKey, currentLetters) => {
      const cells = getClueCells(clueKey, puzzle);
      return cells.every(([r, c]) => currentLetters[r][c].toUpperCase() === puzzle.grid[r][c]);
    },
    [puzzle]
  );

  // Check win condition
  const checkWin = useCallback(
    (currentLetters) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (puzzle.grid[r][c] === null) continue;
          if (currentLetters[r][c].toUpperCase() !== puzzle.grid[r][c]) return false;
        }
      }
      return true;
    },
    [puzzle]
  );

  // Update solved clues whenever letters change
  const updateSolvedClues = useCallback(
    (currentLetters) => {
      const newSolved = new Set();
      for (const key of Object.keys(puzzle.clueStarts)) {
        if (isClueCorrect(key, currentLetters)) newSolved.add(key);
      }
      setSolvedClues(newSolved);
      return newSolved;
    },
    [puzzle, isClueCorrect]
  );

  // Advance to next empty cell in the active clue, or next clue
  const advanceCell = useCallback(
    (currentLetters, fromCell) => {
      const cells = getClueCells(activeClue, puzzle);
      const idx = cells.findIndex(([r, c]) => r === fromCell[0] && c === fromCell[1]);
      // Try next cells in clue
      for (let i = idx + 1; i < cells.length; i++) {
        const [r, c] = cells[i];
        if (!currentLetters[r][c]) {
          setActiveCell([r, c]);
          return;
        }
      }
      // Move to next cell regardless
      if (idx + 1 < cells.length) {
        setActiveCell(cells[idx + 1]);
      }
    },
    [activeClue, puzzle]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (gameState !== "playing") return;
      const key = e.key.toUpperCase();

      if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        const [r, c] = activeCell;
        if (letters[r][c]) {
          // Clear current cell
          const next = letters.map((row) => [...row]);
          next[r][c] = "";
          setLetters(next);
          updateSolvedClues(next);
        } else {
          // Move back
          const cells = getClueCells(activeClue, puzzle);
          const idx = cells.findIndex(([cr, cc]) => cr === r && cc === c);
          if (idx > 0) setActiveCell(cells[idx - 1]);
        }
        return;
      }

      if (key === "TAB" || key === "ARROWRIGHT" || key === "ARROWDOWN") {
        e.preventDefault();
        // Cycle to next clue
        const allKeys = Object.keys(puzzle.clueStarts);
        const idx = allKeys.indexOf(activeClue);
        const nextKey = allKeys[(idx + 1) % allKeys.length];
        setActiveClue(nextKey);
        setActiveCell(puzzle.clueStarts[nextKey]);
        return;
      }

      if (key === "ARROWLEFT" || key === "ARROWUP") {
        e.preventDefault();
        const allKeys = Object.keys(puzzle.clueStarts);
        const idx = allKeys.indexOf(activeClue);
        const prevKey = allKeys[(idx - 1 + allKeys.length) % allKeys.length];
        setActiveClue(prevKey);
        setActiveCell(puzzle.clueStarts[prevKey]);
        return;
      }

      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        const [r, c] = activeCell;
        const next = letters.map((row) => [...row]);
        next[r][c] = key;
        setLetters(next);
        updateSolvedClues(next);
        if (checkWin(next)) {
          setTimeout(() => setGameState("won"), 200);
          return;
        }
        advanceCell(next, [r, c]);
      }
    },
    [gameState, activeCell, letters, activeClue, puzzle, advanceCell, updateSolvedClues, checkWin]
  );

  // Physical keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKeyDown(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKeyDown]);

  // Focus hidden input when active cell changes
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [activeCell]);

  const handleCellClick = (row, col) => {
    if (puzzle.grid[row][col] === null) return;
    // If clicking the already-active cell, toggle direction
    if (activeCell[0] === row && activeCell[1] === col) {
      const { across, down } = getCluesForCell(row, col, puzzle);
      if (activeClue.startsWith("A") && down) setActiveClue(down);
      else if (activeClue.startsWith("D") && across) setActiveClue(across);
    } else {
      setActiveCell([row, col]);
      // Pick a clue direction for this cell
      const { across, down } = getCluesForCell(row, col, puzzle);
      if (activeClue.startsWith("A") && across) setActiveClue(across);
      else if (activeClue.startsWith("D") && down) setActiveClue(down);
      else if (across) setActiveClue(across);
      else if (down) setActiveClue(down);
    }
  };

  const handleClueClick = (key) => {
    setActiveClue(key);
    setActiveCell(puzzle.clueStarts[key]);
  };

  const getCellState = (row, col) => {
    if (puzzle.grid[row][col] === null) return "black";
    if (activeCell[0] === row && activeCell[1] === col) return "active-cell";
    if (activeClueCells.some(([r, c]) => r === row && c === col)) return "active-word";
    // Check if cell is part of any solved clue
    const { across, down } = getCluesForCell(row, col, puzzle);
    if ((across && solvedClues.has(across)) || (down && solvedClues.has(down))) return "correct";
    return "idle";
  };

  const filledCount = letters.flat().filter(Boolean).length;
  const totalCells = puzzle.grid.flat().filter((c) => c !== null).length;
  const progress = Math.round((filledCount / totalCells) * 100);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-12">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Active clue banner */}
      <div
        className="w-full rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-sm)",
          minHeight: 52,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>
            {activeClue.replace(/\d+/, "")}
            {activeClue.replace(/\D/g, "")}
          </span>
        </div>
        <p
          style={{
            fontSize: "0.88rem",
            fontWeight: 500,
            color: "var(--label-secondary)",
            letterSpacing: "-0.01em",
            lineHeight: 1.35,
          }}
        >
          {activeClue.startsWith("A")
            ? puzzle.clues.across[activeClue.slice(1)]
            : puzzle.clues.down[activeClue.slice(1)]}
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 4,
          width: "100%",
          maxWidth: 320,
        }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((answer, c) => (
            <Cell
              key={`${r}-${c}`}
              letter={letters[r][c]}
              answer={answer}
              state={getCellState(r, c)}
              cellNum={cellNumbers[`${r},${c}`]}
              onClick={() => handleCellClick(r, c)}
              inputRef={activeCell[0] === r && activeCell[1] === c ? inputRef : null}
              onKeyDown={handleKeyDown}
            />
          ))
        )}
      </div>

      {/* Progress bar */}
      {gameState === "playing" && (
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: "var(--fill-tertiary)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--accent)",
                borderRadius: 99,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--label-tertiary)",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            {filledCount} / {totalCells} letters filled
          </p>
        </div>
      )}

      {/* Clue lists */}
      {gameState === "playing" && (
        <div
          className="w-full grid gap-5"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <ClueList
            title="Across"
            clues={puzzle.clues.across}
            activeClue={activeClue}
            onClueClick={handleClueClick}
            solvedClues={solvedClues}
          />
          <ClueList
            title="Down"
            clues={puzzle.clues.down}
            activeClue={activeClue}
            onClueClick={handleClueClick}
            solvedClues={solvedClues}
          />
        </div>
      )}

      {/* Win state */}
      {gameState === "won" && (
        <div
          className="spring-pop flex flex-col items-center gap-6 mt-2 p-8 rounded-3xl w-full"
          style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-xl)" }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(145deg, #007aff, #5856d6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              boxShadow: "0 8px 24px rgba(0,122,255,0.35)",
            }}
          >
            ✏️
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--label-primary)",
              }}
            >
              Solved it!
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--label-tertiary)",
                letterSpacing: "-0.01em",
                textAlign: "center",
              }}
            >
              You filled in all {totalCells} letters correctly. Nice work!
            </p>
          </div>
          {/* Completed grid preview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 3,
              width: 160,
            }}
          >
            {puzzle.grid.map((row, r) =>
              row.map((answer, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 4,
                    background: answer === null ? "var(--label-primary)" : "#d1fae5",
                    border: answer === null ? "none" : "1.5px solid #6ee7b7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {answer !== null ? answer : ""}
                </div>
              ))
            )}
          </div>
          <button onClick={onNewGame} className="btn-primary">
            New Puzzle
          </button>
        </div>
      )}
    </div>
  );
}
