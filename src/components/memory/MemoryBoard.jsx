import { useState, useEffect, useCallback, useRef } from "react";
import { CARD_SETS, buildDeck } from "../../data/memoryCards";
import Toast from "../Toast";

// ── Single card ───────────────────────────────────────────────────

function MemoryCard({ card, onClick, disabled }) {
  const { flipped, matched, emoji } = card;
  const isVisible = flipped || matched;

  return (
    <button
      onClick={onClick}
      disabled={disabled || matched || flipped}
      aria-label={isVisible ? emoji : "Hidden card"}
      className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        perspective: 600,
        cursor: matched || flipped ? "default" : "pointer",
      }}
    >
      {/* Card inner — flips on state change */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.35s cubic-bezier(0.34,1.2,0.64,1)",
          transform: isVisible ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 16,
            background: matched
              ? "linear-gradient(145deg, #34c759, #30d158)"
              : "linear-gradient(145deg, var(--accent), #5856d6)",
            boxShadow: matched
              ? "0 4px 14px rgba(52,199,89,0.35)"
              : "0 4px 14px rgba(0,122,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", opacity: 0.5 }}>❓</span>
        </div>

        {/* Front face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 16,
            background: matched
              ? "linear-gradient(145deg, rgba(52,199,89,0.15), rgba(48,209,88,0.08))"
              : "var(--bg-surface)",
            border: matched
              ? "1.5px solid rgba(52,199,89,0.45)"
              : "0.5px solid rgba(0,0,0,0.08)",
            boxShadow: matched
              ? "0 4px 14px rgba(52,199,89,0.2)"
              : "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              filter: matched ? "none" : "none",
              transition: "transform 0.2s ease",
              transform: matched ? "scale(1.1)" : "scale(1)",
            }}
          >
            {emoji}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Set picker ────────────────────────────────────────────────────

function SetPicker({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CARD_SETS.map((set) => {
        const active = selected.id === set.id;
        return (
          <button
            key={set.id}
            onClick={() => onChange(set)}
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
            <span>{set.emoji}</span>
            <span>{set.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────

function StatsBar({ moves, pairs, total, elapsed }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {[
        { label: "Moves", value: moves },
        { label: "Pairs", value: `${pairs} / ${total}` },
        { label: "Time",  value: `${mm}:${ss}` },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl"
          style={{ background: "var(--fill-tertiary)", minWidth: 72 }}
        >
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--label-primary)", letterSpacing: "-0.02em" }}>
            {value}
          </span>
          <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--label-tertiary)" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Win screen ────────────────────────────────────────────────────

function WinScreen({ moves, elapsed, pairs, onPlayAgain, onChangeSet }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const rating =
    moves <= pairs + 2 ? { emoji: "🏆", label: "Perfect!" } :
    moves <= pairs * 2 ? { emoji: "🌟", label: "Excellent!" } :
    moves <= pairs * 3 ? { emoji: "👍", label: "Good job!" } :
                         { emoji: "🎉", label: "You did it!" };

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
          background: "linear-gradient(145deg, #34c759, #30d158)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 8px 24px rgba(52,199,89,0.35)",
        }}
      >
        {rating.emoji}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--label-primary)" }}>
          {rating.label}
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--label-tertiary)" }}>
          All {pairs} pairs matched!
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        {[
          { label: "Moves", value: moves },
          { label: "Time",  value: `${mm}:${ss}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--label-primary)" }}>
              {value}
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--label-tertiary)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        <button onClick={onPlayAgain} className="btn-primary w-full">
          Play Again
        </button>
        <button onClick={onChangeSet} className="btn-ghost w-full">
          Change Theme
        </button>
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────

export default function MemoryBoard() {
  const [selectedSet, setSelectedSet] = useState(CARD_SETS[0]);
  const [gameKey, setGameKey] = useState(0);

  const handleChangeSet = (set) => {
    setSelectedSet(set);
    setGameKey((k) => k + 1);
  };

  return (
    <Game
      key={`${selectedSet.id}-${gameKey}`}
      cardSet={selectedSet}
      onPlayAgain={() => setGameKey((k) => k + 1)}
      onChangeSet={() => {/* handled by SetPicker below */}}
      selectedSet={selectedSet}
      onSetChange={handleChangeSet}
    />
  );
}

function Game({ cardSet, onPlayAgain, selectedSet, onSetChange }) {
  const TOTAL_PAIRS = cardSet.cards.length; // 8

  const [deck, setDeck]           = useState(() => buildDeck(cardSet));
  const [flippedIds, setFlippedIds] = useState([]);   // at most 2 card ids
  const [moves, setMoves]         = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [locked, setLocked]       = useState(false);  // prevent clicks during check
  const [gameState, setGameState] = useState("playing"); // 'playing' | 'won'
  const [toast, setToast]         = useState(null);
  const [elapsed, setElapsed]     = useState(0);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const showToast = useCallback((msg) => setToast(msg), []);

  const handleCardClick = useCallback((cardId) => {
    if (locked) return;
    if (flippedIds.includes(cardId)) return;

    const newFlipped = [...flippedIds, cardId];
    setFlippedIds(newFlipped);

    // Flip the card visually
    setDeck((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);

      const [id1, id2] = newFlipped;
      const card1 = deck.find((c) => c.id === id1);
      const card2 = deck.find((c) => c.id === id2);

      if (card1.pairKey === card2.pairKey) {
        // Match!
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.id === id1 || c.id === id2
                ? { ...c, flipped: false, matched: true }
                : c
            )
          );
          setFlippedIds([]);
          setLocked(false);
          const newCount = matchedCount + 1;
          setMatchedCount(newCount);
          showToast("Match! 🎉");
          if (newCount === TOTAL_PAIRS) {
            setGameState("won");
          }
        }, 500);
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.id === id1 || c.id === id2
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlippedIds([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [locked, flippedIds, deck, matchedCount, TOTAL_PAIRS, showToast]);

  const handlePlayAgain = () => {
    setDeck(buildDeck(cardSet));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setLocked(false);
    setGameState("playing");
    setElapsed(0);
    onPlayAgain();
  };

  // ── Won screen ───────────────────────────────────────────────────
  if (gameState === "won") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-12">
        <WinScreen
          moves={moves}
          elapsed={elapsed}
          pairs={TOTAL_PAIRS}
          onPlayAgain={handlePlayAgain}
          onChangeSet={() => {}}
        />
        {/* Theme picker still visible */}
        <div className="w-full flex flex-col gap-2">
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--label-tertiary)", textAlign: "center" }}>
            Change Theme
          </p>
          <SetPicker selected={selectedSet} onChange={onSetChange} />
        </div>
      </div>
    );
  }

  // ── Playing screen ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-12">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Theme picker */}
      <SetPicker selected={selectedSet} onChange={onSetChange} />

      {/* Stats */}
      <StatsBar
        moves={moves}
        pairs={matchedCount}
        total={TOTAL_PAIRS}
        elapsed={elapsed}
      />

      {/* Grid — 4 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "clamp(8px, 2vw, 12px)",
          width: "100%",
        }}
      >
        {deck.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card.id)}
            disabled={locked || flippedIds.length === 2}
          />
        ))}
      </div>

      {/* Hint text */}
      <p
        className="text-center"
        style={{ fontSize: "0.78rem", color: "var(--label-tertiary)", letterSpacing: "-0.01em", maxWidth: 300 }}
      >
        Flip cards to find all {TOTAL_PAIRS} matching pairs.
      </p>

      {/* New game button */}
      <button onClick={handlePlayAgain} className="btn-ghost">
        🔀 New Game
      </button>
    </div>
  );
}
