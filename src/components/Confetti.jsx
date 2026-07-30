import { useState } from "react";

const COLORS = [
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff",
  "#c77dff", "#ff9f43", "#ff6eb4", "#00d2d3",
];

const SHAPES = ["circle", "rect", "triangle"];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    left: randomBetween(5, 95),       // % across the container
    delay: randomBetween(0, 0.9),     // s
    duration: randomBetween(1.1, 1.9),// s
    size: randomBetween(7, 13),       // px
    rotation: randomBetween(0, 360),  // deg initial
    drift: randomBetween(-60, 60),    // px horizontal drift
  }));
}

export default function Confetti({ count = 60 }) {
  const [particles] = useState(() => makeParticles(count));

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        borderRadius: "inherit",
      }}
    >
      {particles.map((p) => {
        const baseStyle = {
          position: "absolute",
          top: "-14px",
          left: `${p.left}%`,
          width: p.size,
          height: p.shape === "rect" ? p.size * 0.55 : p.size,
          backgroundColor: p.color,
          opacity: 0,
          animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.23,1,0.32,1) both`,
          "--drift": `${p.drift}px`,
          "--rot-end": `${p.rotation + 540}deg`,
        };

        if (p.shape === "circle") {
          baseStyle.borderRadius = "50%";
        } else if (p.shape === "triangle") {
          baseStyle.width = 0;
          baseStyle.height = 0;
          baseStyle.backgroundColor = "transparent";
          baseStyle.borderLeft = `${p.size * 0.5}px solid transparent`;
          baseStyle.borderRight = `${p.size * 0.5}px solid transparent`;
          baseStyle.borderBottom = `${p.size}px solid ${p.color}`;
        }

        return <div key={p.id} style={baseStyle} />;
      })}
    </div>
  );
}
