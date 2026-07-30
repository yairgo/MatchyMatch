import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/components/game2048/Game2048Board.jsx', 'utf8');
c = c.replace('} catch { /* ignore */ }', '} catch {\n        // localStorage may be unavailable in some environments\n        }');
writeFileSync('src/components/game2048/Game2048Board.jsx', c);
console.log('done');
