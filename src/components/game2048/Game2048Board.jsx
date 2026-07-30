import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import "./game2048.css";
import {
  TILE_STYLES,
  DEFAULT_TILE_STYLE,
  GRID_SIZE,
  emptyGrid,
  spawnTile,
  applyMove,
  hasMovesLeft,
  maxTile,
} from "../../data/game2048Data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initGrid() {
  let g = emptyGrid();
  g = spawnTile(g);
  g = spawnTile(g);
  return g;
}

// ── Single tile ───────────────────────────────────────────────────────────────

function Tile({ value, isNew, isMerged }) {
  const style = value ? (TILE_STYLES[value] ?? DEFAULT_TILE_STYLE) : null;

  const fontSize =
    value >= 1024
      ? "clamp(1rem, 3.5vw, 1.35rem)"
      : value >= 128
      ? "clamp(1.1rem, 4vw, 1.55rem)"
      : "clamp(1.2rem, 4.5vw, 1.75rem)";

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-2xl font-extrabold select-none",
        isNew && "tile-new",
        isMerged && "tile-merged"
      )}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        background: style ? style.bg : "var(--fill-quaternary)",
        color: style ? style.text : "transparent",
        boxShadow: style ? style.shadow : "none",
        fontSize,
        letterSpacing: "-0.03em",
        transition: "background 0.1s ease, color 0.1s ease",
      }}
    >
      {value ?? ""}
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ label, value, accent }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
      style={{ background: accent ? "var(--accent-light)" : "var(--fill-tertiary)", minWidth: 72 }}
    >
      <span
        style={{
          fontSize: "1.1rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: accent ? "var(--accent)" : "var(--label-primary)",
        }}
      >
        {value.toLocaleString()}
      </span>
      <span
        style={{
          fontSize: "0.62rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--label-tertiary)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Swipe detection hook ──────────────────────────────────────────────────────

function useSwipe(onSwipe) {
  const startRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (!startRef.current) return;
      const t  = e.changedTouches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;
      startRef.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return; // too small

      if (absDx > absDy) {
        onSwipe(dx > 0 ? "right" : "left");
      } else {
        onSwipe(dy > 0 ? "down" : "up");
      }
    },
    [onSwipe]
  );

  return { onTouchStart, onTouchEnd };
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function Game2048Board() {
  const [grid, setGrid]         = useState(initGrid);
  const [score, setScore]       = useState(0);
  const [best, setBest]         = useState(() => {
    try { return parseInt(localStorage.getItem("2048_best") ?? "0", 10) || 0; }
    catch { return 0; }
  });
  const [gameState, setGameState] = useState("playing"); // 'playing' | 'won' | 'over'
  const [wonAcked, setWonAcked]   = useState(false);     // player clicked "Keep going"
  const [newCells, setNewCells]   = useState(new Set());
  const [mergedCells, setMergedCells] = useState(new Set());

  // Persist best score
  useEffect(() => {
    try { localStorage.setItem("2048_best", String(best)); } catch {
        // localStorage may be unavailable in some environments
        }
  }, [best]);

  const move = useCallback(
    (direction) => {
      if (gameState === "over") return;
      if (gameState === "won" && !wonAcked) return;

      setGrid((prev) => {
        const { grid: next, score: gained, moved } = applyMove(prev, direction);
        if (!moved) return prev;

        // Spawn a new tile
        const spawned = spawnTile(next);

        // Track which cells are new (spawned) or merged
        const newSet    = new Set();
        const mergedSet = new Set();
        spawned.forEach((v, i) => {
          if (prev[i] === null && v !== null) newSet.add(i);
          if (prev[i] !== null && v !== null && v !== prev[i] && v === prev[i] * 2) {
            mergedSet.add(i);
          }
        });
        setNewCells(newSet);
        setMergedCells(mergedSet);
        setTimeout(() => { setNewCells(new Set()); setMergedCells(new Set()); }, 200);

        // Update score
        if (gained > 0) {
          setScore((s) => {
            const ns = s + gained;
            setBest((b) => Math.max(b, ns));
            return ns;
          });
        }

        // Check win (2048 tile reached)
        if (!wonAcked && maxTile(spawned) >= 2048) {
          setGameState("won");
        } else if (!hasMovesLeft(spawned)) {
          setGameState("over");
        }

        return spawned;
      });
    },
    [gameState, wonAcked]
  );

  // Keyboard handler
  useEffect(() => {
    const MAP = {
      ArrowLeft:  "left",
      ArrowRight: "right",
      ArrowUp:    "up",
      ArrowDown:  "down",
      a: "left", d: "right", w: "up", s: "down",
      A: "left", D: "right", W: "up", S: "down",
    };
    const handler = (e) => {
      const dir = MAP[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const swipeHandlers = useSwipe(move);

  const handleNewGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameState("playing");
    setWonAcked(false);
    setNewCells(new Set());
    setMergedCells(new Set());
  };

  const handleKeepGoing = () => {
    setWonAcked(true);
    setGameState("playing");
  };

  const highest = maxTile(grid);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto px-4 sm:px-6 pt-4 pb-12">

      {/* Header row */}
      <div className="w-full flex items-center justify-between gap-3">
        {/* Title */}
        <div className="flex flex-col gap-0">
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              color: "#f65e3b",
              lineHeight: 1,
            }}
          >
            2048
          </h1>
          <p style={{ fontSize: "0.7rem", color: "var(--label-tertiary)", letterSpacing: "-0.01em" }}>
            Reach the&nbsp;<strong style={{ color: "var(--label-secondary)" }}>2048</strong>&nbsp;tile!
          </p>
        </div>

        {/* Score badges */}
        <div className="flex gap-2">
          <ScoreBadge label="Score" value={score} accent />
          <ScoreBadge label="Best"  value={best} />
        </div>
      </div>

      {/* Controls row */}
      <div className="w-full flex items-center justify-between gap-2">
        <p style={{ fontSize: "0.72rem", color: "var(--label-tertiary)", letterSpacing: "-0.01em" }}>
          Use arrow keys or swipe to move tiles
        </p>
        <button onClick={handleNewGame} className="btn-ghost" style={{ fontSize: "0.8rem", padding: "7px 14px" }}>
          New Game
        </button>
      </div>

      {/* Grid */}
      <div
        {...swipeHandlers}
        style={{
          width: "100%",
          padding: "clamp(8px, 2vw, 12px)",
          borderRadius: 20,
          background: "#bbada0",
          boxShadow: "0 8px 32px rgba(187,173,160,0.4)",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: "clamp(6px, 1.5vw, 10px)",
          }}
        >
          {grid.map((value, i) => (
            <Tile
              key={i}
              value={value}
              isNew={newCells.has(i)}
              isMerged={mergedCells.has(i)}
            />
          ))}
        </div>
      </div>

      {/* Highest tile badge */}
      {highest >= 128 && (
        <div
          className="fade-in flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: TILE_STYLES[highest]
              ? TILE_STYLES[highest].bg + "33"
              : "var(--fill-tertiary)",
            border: `1px solid ${TILE_STYLES[highest] ? TILE_STYLES[highest].bg : "transparent"}`,
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--label-secondary)" }}>
            Highest tile:
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: TILE_STYLES[highest] ? TILE_STYLES[highest].bg : "var(--label-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {highest.toLocaleString()}
          </span>
        </div>
      )}

      {/* How to play */}
      <div
        className="w-full rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
      >
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--label-tertiary)" }}>
          How to play
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--label-secondary)", lineHeight: 1.5 }}>
          Slide tiles with <strong>arrow keys</strong> (or swipe on mobile). When two tiles with the same number touch, they <strong>merge into one</strong>. Reach <strong>2048</strong> to win!
        </p>
      </div>

      {/* Win overlay */}
      {gameState === "won" && !wonAcked && (
        <div
          className="spring-pop fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm"
            style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-xl)" }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: "linear-gradient(145deg, #edc22e, #f59563)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                boxShadow: "0 8px 28px rgba(237,194,46,0.5)",
              }}
            >
              🏆
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--label-primary)" }}>
                You reached 2048!
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--label-tertiary)" }}>
                Score: <strong style={{ color: "var(--label-primary)" }}>{score.toLocaleString()}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full">
              <button onClick={handleKeepGoing} className="btn-primary">
                Keep Going
              </button>
              <button onClick={handleNewGame} className="btn-ghost">
                New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameState === "over" && (
        <div
          className="spring-pop fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm"
            style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-xl)" }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: "linear-gradient(145deg, #ff6b6b, #ff3b30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                boxShadow: "0 8px 24px rgba(255,59,48,0.4)",
              }}
            >
              😵
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--label-primary)" }}>
                Game Over
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--label-tertiary)" }}>
                No moves left. Final score:{" "}
                <strong style={{ color: "var(--label-primary)" }}>{score.toLocaleString()}</strong>
              </p>
              {highest >= 1024 && (
                <p style={{ fontSize: "0.82rem", color: "var(--label-tertiary)", marginTop: 4 }}>
                  You reached{" "}
                  <strong style={{ color: TILE_STYLES[highest]?.bg ?? "var(--label-primary)" }}>
                    {highest.toLocaleString()}
                  </strong>
                  !
                </p>
              )}
            </div>
            <button onClick={handleNewGame} className="btn-primary" style={{ width: "100%" }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
