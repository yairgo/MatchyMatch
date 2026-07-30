/**
 * Minefield Mayhem — game logic helpers.
 *
 * Shares the same cell shape as minesweeperData but lives in its own module
 * so the two games stay fully independent.
 *
 * Extra feature: "Mayhem" mode — every MAYHEM_INTERVAL_MS one unrevealed,
 * unflagged mine drifts to a random unrevealed, unflagged non-mine cell.
 */

export const DIFFICULTIES = [
  { label: 'Easy',   rows: 9,  cols: 9,  mines: 10 },
  { label: 'Medium', rows: 16, cols: 16, mines: 40 },
  { label: 'Hard',   rows: 16, cols: 30, mines: 99 },
  { label: 'Expert', rows: 20, cols: 40, mines: 160 },
];

/** How often (ms) a mine drifts in Mayhem mode. */
export const MAYHEM_INTERVAL_MS = 4000;

/**
 * Build a fresh, unexploded grid (all cells hidden, no mines placed yet).
 */
export function buildEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );
}

/**
 * Place mines randomly, avoiding `safeRow`/`safeCol` and its neighbours.
 * Returns a new grid with mines and adjacency counts filled in.
 */
export function placeMines(grid, rows, cols, mineCount, safeRow, safeCol) {
  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeRow + dr;
      const c = safeCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) safe.add(`${r},${c}`);
    }
  }

  const candidates = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!safe.has(`${r},${c}`)) candidates.push([r, c]);

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const minePositions = new Set(
    candidates.slice(0, mineCount).map(([r, c]) => `${r},${c}`)
  );

  const next = grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      mine: minePositions.has(`${cell.row},${cell.col}`),
    }))
  );

  return recomputeAdjacency(next, rows, cols);
}

/** Recompute adjacency counts for every non-mine cell. */
export function recomputeAdjacency(grid, rows, cols) {
  const next = grid.map((row) => row.map((cell) => ({ ...cell, adjacent: 0 })));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && next[nr][nc].mine)
            count++;
        }
      }
      next[r][c].adjacent = count;
    }
  }
  return next;
}

/**
 * Mayhem drift: move one random unrevealed+unflagged mine to a random
 * unrevealed+unflagged non-mine cell.  Returns the same grid reference if
 * no valid move exists (game over / nearly won), otherwise a new grid.
 */
export function driftOneMine(grid, rows, cols) {
  const minePool = [];
  const safePool = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.revealed || cell.flagged) continue;
      if (cell.mine) minePool.push([r, c]);
      else safePool.push([r, c]);
    }
  }

  if (minePool.length === 0 || safePool.length === 0) return grid;

  const [mr, mc] = minePool[Math.floor(Math.random() * minePool.length)];
  const [sr, sc] = safePool[Math.floor(Math.random() * safePool.length)];

  const next = grid.map((row) => row.map((cell) => ({ ...cell })));
  next[mr][mc].mine = false;
  next[sr][sc].mine = true;

  return recomputeAdjacency(next, rows, cols);
}

/**
 * Flood-fill reveal from (startRow, startCol).
 */
export function revealFrom(grid, rows, cols, startRow, startCol) {
  const next = grid.map((row) => row.map((cell) => ({ ...cell })));
  const queue = [[startRow, startCol]];
  const visited = new Set();

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = next[r][c];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;

    if (cell.adjacent === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) queue.push([nr, nc]);
        }
      }
    }
  }

  return next;
}

/** Reveal all mines (used on game-over). */
export function revealAllMines(grid) {
  return grid.map((row) =>
    row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell }))
  );
}

/** Every non-mine cell is revealed → win. */
export function checkWin(grid) {
  return grid.every((row) => row.every((cell) => cell.mine || cell.revealed));
}

/** Mines remaining (mines − flagged). */
export function flagsRemaining(grid, mineCount) {
  let flagged = 0;
  grid.forEach((row) => row.forEach((cell) => { if (cell.flagged) flagged++; }));
  return mineCount - flagged;
}

/** Classic adjacency number colours. */
export const ADJ_COLORS = {
  1: '#1a73e8',
  2: '#2e7d32',
  3: '#c62828',
  4: '#1a237e',
  5: '#b71c1c',
  6: '#00838f',
  7: '#37474f',
  8: '#546e7a',
};

