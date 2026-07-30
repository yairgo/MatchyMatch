import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/components/anagram/AnagramBoard.jsx', 'utf8');

const handleSkipStart = '  const handleSkip = useCallback((timedOut = false) => {';
const handleSkipEnd = '  }, [gamePhase, currentRound, stopTimer]);';

const startIdx = c.indexOf(handleSkipStart);
const endIdx = c.indexOf(handleSkipEnd) + handleSkipEnd.length;

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find handleSkip block');
  process.exit(1);
}

const block = c.slice(startIdx, endIdx);
const before = c.slice(0, startIdx).trimEnd();
const after = c.slice(endIdx);

// Remove the block from its current position
let newContent = before + '\n' + after;

// Insert before '  // Time ran out'
const insertMarker = '  // Time ran out';
const insertIdx = newContent.indexOf(insertMarker);
if (insertIdx === -1) {
  console.log('Could not find insertion point');
  process.exit(1);
}

newContent = newContent.slice(0, insertIdx) + block + '\n\n  ' + newContent.slice(insertIdx);

writeFileSync('src/components/anagram/AnagramBoard.jsx', newContent);
console.log('done');
