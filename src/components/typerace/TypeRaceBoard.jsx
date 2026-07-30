import { useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";
import { pickPhrase } from "../../data/typeRacePhrases";
import Toast from "../Toast";

// ── Helpers ───────────────────────────────────────────────────────

function calcWPM(charCount, elapsedSeconds) {
  if (elapsedSeconds === 0) return 0;
  // Standard: 1 word = 5 characters
  const words = charCount / 5;
  const minutes = elapsedSeconds / 60;
  return Math.round(words / minutes);
}

function calcAccuracy(typed, target) {
  if (typed.length === 0) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}

// ── Category pill ─────────────────────────────────────────────────

function CategoryPill({ label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        background: "var(--accent-light)",
        color: "var(--accent)",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────

function StatChip({ label, value, accent }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
      style={{ background: "var(--fill-tertiary)", minWidth: 72 }}
    >
      <span
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: accent ? "var(--accent)" : "var(--label-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
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

// ── Typed text display ────────────────────────────────────────────

function TypedDisplay({ target, typed }) {
  return (
    <p
      aria-hidden="true"
      style={{
        fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
        fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
        lineHeight: 1.75,
        letterSpacing: "0.01em",
        color: "var(--label-primary)",
        wordBreak: "break-word",
        userSelect: "none",
      }}
    >
      {target.split("").map((char, i) => {
        let color, bg;
        if (i < typed.length) {
          if (typed[i] === char) {
            color = "#34c759";
            bg = "rgba(52,199,89,0.10)";
          } else {
            color = "#ff3b30";
            bg = "rgba(255,59,48,0.12)";
          }
        } else if (i === typed.length) {
          // cursor position
          bg = "var(--accent-mid)";
          color = "var(--label-primary)";
        } else {
          color = "var(--label-quaternary)";
          bg = "transparent";
        }
        return (
          <span
            key={i}
            style={{
              color,
              background: bg,
              borderRadius: 3,
              transition: "color 0.08s ease, background 0.08s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </p>
  );
}

// ── Result screen ─────────────────────────────────────────────────

function ResultScreen({ wpm, accuracy, elapsed, phrase, onPlayAgain, onNewPhrase }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const rating =
    wpm >= 80 ? { emoji: "🚀", label: "Lightning fast!" } :
    wpm >= 60 ? { emoji: "⚡", label: "Speedy!" } :
    wpm >= 40 ? { emoji: "👍", label: "Good pace!" } :
    wpm >= 20 ? { emoji: "🐢", label: "Keep practising!" } :
                { emoji: "🌱", label: "Just getting started!" };

  return (
    <div
      className="spring-pop flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-auto"
      style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-xl)" }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: "linear-gradient(145deg, var(--accent), #5856d6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 8px 24px rgba(0,122,255,0.35)",
        }}
      >
        {rating.emoji}
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
          {rating.label}
        </h2>
        <CategoryPill label={phrase.category} />
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap justify-center">
        <StatChip label="WPM" value={wpm} accent />
        <StatChip label="Accuracy" value={`${accuracy}%`} />
        <StatChip label="Time" value={`${mm}:${ss}`} />
      </div>

      {accuracy === 100 && (
        <p
          style={{
            fontSize: "0.82rem",
            color: "#34c759",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          ✓ Perfect accuracy!
        </p>
      )}

      <div className="flex flex-col gap-2.5 w-full">
        <button onClick={onPlayAgain} className="btn-primary w-full">
          Try Again
        </button>
        <button onClick={onNewPhrase} className="btn-ghost w-full">
          New Phrase
        </button>
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────

export default function TypeRaceBoard() {
  const [phrase, setPhrase] = useState(() => pickPhrase());
  const [gameKey, setGameKey] = useState(0);
  const [lastPhraseId, setLastPhraseId] = useState(null);

  const handleNewPhrase = useCallback(() => {
    const next = pickPhrase(lastPhraseId);
    setPhrase(next);
    setLastPhraseId(next.id);
    setGameKey((k) => k + 1);
  }, [lastPhraseId]);

  const handlePlayAgain = useCallback(() => {
    setGameKey((k) => k + 1);
  }, []);

  return (
    <Game
      key={gameKey}
      phrase={phrase}
      onPlayAgain={handlePlayAgain}
      onNewPhrase={handleNewPhrase}
    />
  );
}

function Game({ phrase, onPlayAgain, onNewPhrase }) {
  const target = phrase.text;

  const [typed, setTyped]         = useState("");
  const [gameState, setGameState] = useState("idle"); // 'idle' | 'playing' | 'done'
  const [elapsed, setElapsed]     = useState(0);
  const [wpm, setWpm]             = useState(0);
  const [toast, setToast]         = useState(null);
  const [shaking, setShaking]     = useState(false);

  const inputRef  = useRef(null);
  const timerRef  = useRef(null);
  const startTime = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime.current) / 1000);
        setElapsed(secs);
        setWpm(calcWPM(typed.length, secs));
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, typed.length]);

  const handleInput = (e) => {
    const value = e.target.value;

    // Prevent typing beyond the target length
    if (value.length > target.length) return;

    // Start timer on first keystroke
    if (gameState === "idle" && value.length > 0) {
      setGameState("playing");
      startTime.current = Date.now();
    }

    setTyped(value);

    // Check for errors on latest char
    const lastIdx = value.length - 1;
    if (lastIdx >= 0 && value[lastIdx] !== target[lastIdx]) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }

    // Completion check
    if (value === target) {
      clearInterval(timerRef.current);
      const finalElapsed = Math.max(1, Math.floor((Date.now() - startTime.current) / 1000));
      const finalWpm = calcWPM(target.length, finalElapsed);
      const finalAcc = calcAccuracy(value, target);
      setElapsed(finalElapsed);
      setWpm(finalWpm);
      setGameState("done");
      setToast(finalAcc === 100 ? "Perfect! 🎉" : `Done! ${finalWpm} WPM 🚀`);
    }
  };

  const accuracy = calcAccuracy(typed, target);
  const progress = Math.round((typed.length / target.length) * 100);

  // ── Done screen ──────────────────────────────────────────────────
  if (gameState === "done") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        <ResultScreen
          wpm={wpm}
          accuracy={calcAccuracy(typed, target)}
          elapsed={elapsed}
          phrase={phrase}
          onPlayAgain={onPlayAgain}
          onNewPhrase={onNewPhrase}
        />
      </div>
    );
  }

  // ── Playing / idle screen ────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header row */}
      <div className="w-full flex items-center justify-between gap-3">
        <CategoryPill label={phrase.category} />
        <button onClick={onNewPhrase} className="btn-ghost" style={{ fontSize: "0.78rem", padding: "6px 14px" }}>
          🔀 New Phrase
        </button>
      </div>

      {/* Live stats */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <StatChip label="WPM" value={gameState === "idle" ? "—" : wpm} accent />
        <StatChip label="Accuracy" value={gameState === "idle" ? "—" : `${accuracy}%`} />
        <StatChip
          label="Time"
          value={
            gameState === "idle"
              ? "0:00"
              : `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`
          }
        />
      </div>

      {/* Progress bar */}
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
              width: `${progress}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, var(--accent), #5856d6)",
              transition: "width 0.15s ease",
            }}
          />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: "0.68rem", color: "var(--label-tertiary)", fontWeight: 500 }}>
            {typed.length} / {target.length} chars
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 600 }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Phrase display */}
      <div
        className={clsx("w-full rounded-3xl p-6", shaking && "wordle-shake")}
        style={{
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-md)",
          cursor: "text",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <TypedDisplay target={target} typed={typed} />
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        aria-label="Type the phrase here"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
        }}
      />

      {/* Visible input for mobile (shown below phrase) */}
      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor="typerace-input"
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--label-tertiary)",
          }}
        >
          {gameState === "idle" ? "Start typing to begin…" : "Keep going!"}
        </label>
        <textarea
          id="typerace-input"
          rows={3}
          value={typed}
          onChange={handleInput}
          placeholder="Type the phrase above…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 16,
            border: "1.5px solid var(--separator)",
            background: "var(--bg-surface)",
            color: "var(--label-primary)",
            fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            lineHeight: 1.6,
            resize: "none",
            outline: "none",
            boxShadow: "var(--shadow-sm)",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--separator)";
            e.target.style.boxShadow = "var(--shadow-sm)";
          }}
        />
      </div>

      {/* Hint */}
      <p
        className="text-center"
        style={{
          fontSize: "0.78rem",
          color: "var(--label-tertiary)",
          letterSpacing: "-0.01em",
          maxWidth: 320,
        }}
      >
        {gameState === "idle"
          ? "Type the phrase exactly as shown — punctuation and capitalisation count!"
          : `${target.length - typed.length} characters remaining`}
      </p>
    </div>
  );
}
