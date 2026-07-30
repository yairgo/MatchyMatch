import { useState, useCallback, useRef } from "react";
import { PUZZLES, getWordCells } from "../../data/wordSearchPuzzles";
import Toast from "../Toast";

// ── Helpers ───────────────────────────────────────────────────────

/** Convert a selection of cells into a word string (reading order) */
function cellsToWord(cells, grid) {
  return cells.map(({ row, col }) => grid[row][col]).join("");
}

/** Check if two cell arrays cover the same positions */
function sameCells(a, b) {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.row === b[i].row && c.col === b[i].col);
}

/** Are cells in a straight line (H, V, or diagonal ↘)? Returns sorted cells or null. */
function normaliseLine(cells) {
  if (cells.length < 2) return cells;
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  const minR = Math.min(...rows), maxR = Math.max(...rows);
  const minC = Math.min(...cols), maxC = Math.max(...cols);
  const dr = maxR - minR;
  const dc = maxC - minC;

  // Horizontal
  if (dr === 0 && dc === cells.length - 1) {
    return [...cells].sort((a, b) => a.col - b.col);
  }
  // Vertical
  if (dc === 0 && dr === cells.length - 1) {
    return [...cells].sort((a, b) => a.row - b.row);
  }
  // Diagonal ↘
  if (dr === cells.length - 1 && dc === cells.length - 1) {
    return [...cells].sort((a, b) => a.row - b.row);
  }
  return null; // not a straight line
}

// ── Theme picker ──────────────────────────────────────────────────

function ThemePicker({ puzzles, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {puzzles.map((p) => {
        const active = selected.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: active ? "var(--accent)" : "var(--fill-tertiary)",
              color: active ? "#fff" : "var(--label-secondary)",
              boxShadow: active ? "0 2px 8px rgba(0,122,255,0.3)" : "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: active ? 600 : 500,
            }}
          >
            <span>{p.emoji}</span>
            <span>{p.theme}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Word list ─────────────────────────────────────────────────────

function WordList({ words, found }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {words.map((w) => {
        const done = found.includes(w);
        return (
          <span
            key={w}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: "0.82rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: done ? "rgba(52,199,89,0.15)" : "var(--fill-tertiary)",
              color: done ? "#34c759" : "var(--label-secondary)",
              textDecoration: done ? "line-through" : "none",
              transition: "all 0.25s ease",
            }}
          >
            {done && <span style={{ marginRight: 4 }}>✓</span>}
            {w}
          </span>
        );
      })}
    </div>
  );
}

// ── Win screen ────────────────────────────────────────────────────

function WinScreen({ puzzle, found, onPlayAgain, onNewTheme }) {
  return (
    <div
      className="spring-pop flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-auto"
      style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-xl)" }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: "linear-gradient(145deg, #34c759, #30d158)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 8px 24px rgba(52,199,89,0.35)",
        }}
      >
        🔍
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--label-primary)",
          }}
        >
          All found!
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--label-tertiary)" }}>
          You found all {found.length} words in the {puzzle.theme} puzzle.
        </p>
      </div>

      <WordList words={puzzle.words} found={found} />

      <div className="flex flex-col gap-2.5 w-full">
        <button onClick={onPlayAgain} className="btn-primary w-full">
          Play Again
        </button>
        <button onClick={onNewTheme} className="btn-ghost w-full">
          Change Theme
        </button>
      </div>
    </div>
  );
}

// ── Grid cell ─────────────────────────────────────────────────────

function GridCell({ letter, isSelected, isFound, isHint, onPointerDown, onPointerEnter }) {
  let bg = "var(--bg-surface)";
  let color = "var(--label-primary)";
  let shadow = "var(--shadow-sm)";
  let scale = "scale(1)";

  if (isFound) {
    bg = "linear-gradient(145deg, rgba(52,199,89,0.25), rgba(48,209,88,0.15))";
    color = "#34c759";
    shadow = "0 2px 8px rgba(52,199,89,0.2)";
  } else if (isSelected) {
    bg = "linear-gradient(145deg, var(--accent), #5856d6)";
    color = "#fff";
    shadow = "0 4px 12px rgba(0,122,255,0.35)";
    scale = "scale(1.08)";
  } else if (isHint) {
    bg = "rgba(255,159,10,0.18)";
    color = "#ff9f0a";
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        background: bg,
        color,
        boxShadow: shadow,
        fontWeight: 700,
        fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
        letterSpacing: "0.04em",
        userSelect: "none",
        cursor: "pointer",
        transform: scale,
        transition: "background 0.15s ease, color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease",
        aspectRatio: "1 / 1",
        border: isSelected
          ? "1.5px solid rgba(0,122,255,0.5)"
          : isFound
          ? "1.5px solid rgba(52,199,89,0.35)"
          : "0.5px solid var(--separator)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
      }}
    >
      {letter}
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────

export default function WordSearchBoard() {
  const [selectedPuzzle, setSelectedPuzzle] = useState(PUZZLES[0]);
  const [gameKey, setGameKey] = useState(0);

  const handleThemeChange = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setGameKey((k) => k + 1);
  };

  return (
    <Game
      key={`${selectedPuzzle.id}-${gameKey}`}
      puzzle={selectedPuzzle}
      onPlayAgain={() => setGameKey((k) => k + 1)}
      selectedPuzzle={selectedPuzzle}
      onThemeChange={handleThemeChange}
    />
  );
}

function Game({ puzzle, onPlayAgain, selectedPuzzle, onThemeChange }) {
  const { grid, words, placements } = puzzle;
  const ROWS = grid.length;
  const COLS = grid[0].length;

  // Cells currently being dragged over
  const [selecting, setSelecting] = useState([]);
  // Words successfully found: array of word strings
  const [found, setFound] = useState([]);
  // Cells that are part of found words (for persistent highlight)
  const [foundCells, setFoundCells] = useState([]);
  // Hint: cells to briefly highlight
  const [hintCells, setHintCells] = useState([]);
  const [toast, setToast] = useState(null);
  const [gameState, setGameState] = useState("playing"); // 'playing' | 'won'

  const isDragging = useRef(false);

  // ── Pointer handlers ─────────────────────────────────────────────

  const handlePointerDown = useCallback((row, col) => {
    isDragging.current = true;
    setSelecting([{ row, col }]);
  }, []);

  const handlePointerEnter = useCallback(
    (row, col) => {
      if (!isDragging.current) return;
      setSelecting((prev) => {
        // Build a straight line from the first cell to this cell
        const first = prev[0];
        if (!first) return prev;
        const dr = row - first.row;
        const dc = col - first.col;
        const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;

        // Determine direction
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

        // Only allow H, V, or diagonal ↘ (stepR === stepC when both non-zero)
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return prev;

        const cells = [];
        for (let i = 0; i < len; i++) {
          cells.push({ row: first.row + i * stepR, col: first.col + i * stepC });
        }
        return cells;
      });
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    setSelecting((currentSelecting) => {
      if (currentSelecting.length < 2) {
        return [];
      }

      const normalised = normaliseLine(currentSelecting);
      if (!normalised) return [];

      const typed = cellsToWord(normalised, grid);
      const typedRev = typed.split("").reverse().join("");

      // Check against placements
      const match = placements.find((p) => {
        const pCells = getWordCells(p);
        const normP = normaliseLine(pCells);
        return (
          normP &&
          (sameCells(normalised, normP) || sameCells(normalised, [...normP].reverse()))
        );
      });

      if (match && !found.includes(match.word)) {
        const newFound = [...found, match.word];
        const newFoundCells = [...foundCells, ...getWordCells(match)];
        setFound(newFound);
        setFoundCells(newFoundCells);
        setToast(`Found "${match.word}"! 🎉`);
        if (newFound.length === words.length) {
          setGameState("won");
        }
      } else if (!match) {
        // Check if typed word is in the list but wrong position (nice feedback)
        if (words.includes(typed) || words.includes(typedRev)) {
          setToast("Almost — keep looking!");
        }
      }

      return [];
    });
  }, [found, foundCells, grid, placements, words]);

  // Attach global pointerup so drag ends even outside the grid
  const gridRef = useRef(null);
  const attachedRef = useRef(false);
  if (!attachedRef.current) {
    attachedRef.current = true;
  }

  // Use a stable ref-based global listener
  const handlePointerUpRef = useRef(handlePointerUp);
  handlePointerUpRef.current = handlePointerUp;

  // Attach once
  const listenerRef = useRef(null);
  if (!listenerRef.current) {
    listenerRef.current = () => handlePointerUpRef.current();
    if (typeof window !== "undefined") {
      window.addEventListener("pointerup", listenerRef.current);
    }
  }

  // ── Hint ─────────────────────────────────────────────────────────

  const handleHint = () => {
    const remaining = placements.filter((p) => !found.includes(p.word));
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    const cells = getWordCells(pick);
    setHintCells(cells);
    setToast(`Hint: look for "${pick.word}"`);
    setTimeout(() => setHintCells([]), 2500);
  };

  // ── Cell state helpers ────────────────────────────────────────────

  const isSelected = (r, c) => selecting.some((s) => s.row === r && s.col === c);
  const isFoundCell = (r, c) => foundCells.some((s) => s.row === r && s.col === c);
  const isHintCell = (r, c) => hintCells.some((s) => s.row === r && s.col === c);

  // ── Won screen ────────────────────────────────────────────────────

  if (gameState === "won") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12">
        <WinScreen
          puzzle={puzzle}
          found={found}
          onPlayAgain={onPlayAgain}
          onNewTheme={() => {}}
        />
        <div className="w-full flex flex-col gap-2">
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--label-tertiary)",
              textAlign: "center",
            }}
          >
            Change Theme
          </p>
          <ThemePicker puzzles={PUZZLES} selected={selectedPuzzle} onChange={onThemeChange} />
        </div>
      </div>
    );
  }

  // ── Playing screen ────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-12"
      style={{ touchAction: "none" }}
    >
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Theme picker */}
      <ThemePicker puzzles={PUZZLES} selected={selectedPuzzle} onChange={onThemeChange} />

      {/* Progress */}
      <div className="w-full flex flex-col gap-1.5">
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 999,
            background: "var(--fill-tertiary)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((found.length / words.length) * 100)}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, #34c759, #30d158)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: "0.68rem", color: "var(--label-tertiary)", fontWeight: 500 }}>
            {found.length} / {words.length} words found
          </span>
          <span style={{ fontSize: "0.68rem", color: "#34c759", fontWeight: 600 }}>
            {Math.round((found.length / words.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Word list */}
      <WordList words={words} found={found} />

      {/* Grid */}
      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: "clamp(4px, 1.2vw, 7px)",
          width: "100%",
          maxWidth: 420,
          touchAction: "none",
        }}
      >
        {grid.map((rowArr, r) =>
          rowArr.map((letter, c) => (
            <GridCell
              key={`${r}-${c}`}
              letter={letter}
              isSelected={isSelected(r, c)}
              isFound={isFoundCell(r, c)}
              isHint={isHintCell(r, c)}
              onPointerDown={() => handlePointerDown(r, c)}
              onPointerEnter={() => handlePointerEnter(r, c)}
            />
          ))
        )}
      </div>

      {/* Hint text */}
      <p
        className="text-center"
        style={{
          fontSize: "0.78rem",
          color: "var(--label-tertiary)",
          letterSpacing: "-0.01em",
          maxWidth: 320,
        }}
      >
        Drag across letters to select a word. Words run horizontally, vertically, or diagonally.
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleHint} className="btn-ghost" style={{ fontSize: "0.82rem" }}>
          💡 Hint
        </button>
        <button onClick={onPlayAgain} className="btn-ghost" style={{ fontSize: "0.82rem" }}>
          🔀 New Game
        </button>
      </div>
    </div>
  );
}
