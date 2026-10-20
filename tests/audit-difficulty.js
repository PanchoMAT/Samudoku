const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const initPos = source.lastIndexOf('\nparseBaseBoards();');
if (initPos < 0) throw new Error('Could not locate initialization marker in app.js');
const prefix = source.slice(0, initPos);

const audit = String.raw`
parseBaseBoards();
initSolverStructures();

const rows = [];
for (let packIndex = 0; packIndex < PACKS.length; packIndex += 1) {
  for (let puzzleIndex = 0; puzzleIndex < 10; puzzleIndex += 1) {
    const puzzle = generatePuzzle(packIndex, puzzleIndex);
    const analysis = solveSamudoku(puzzle.givens, {
      maxSolutions: 2,
      timeLimitMs: 10000,
      maxNodes: 3000000
    });
    const empties = shapeCells.length - puzzle.givens.size;
    const score = empties * 0.34
      + Math.log10(Math.max(1, analysis.nodes || 1)) * 12
      + Math.log10(Math.max(1, analysis.guesses || 1)) * 10;
    rows.push({
      pack: PACKS[packIndex].name,
      level: puzzleIndex + 1,
      givens: puzzle.givens.size,
      empties,
      nodes: analysis.nodes,
      guesses: analysis.guesses,
      depth: analysis.maxDepth,
      solverScore: Number(score.toFixed(2)),
      unique: analysis.status === 'unique'
    });
  }
}

console.table(rows);
for (const pack of PACKS) {
  const group = rows.filter(row => row.pack === pack.name);
  const avg = key => group.reduce((sum, row) => sum + row[key], 0) / group.length;
  console.log(pack.name + ': avg givens=' + avg('givens').toFixed(1)
    + ', avg nodes=' + avg('nodes').toFixed(1)
    + ', avg guesses=' + avg('guesses').toFixed(1)
    + ', avg score=' + avg('solverScore').toFixed(1));
}
console.log('\nNOTE: This is computational difficulty, not a human-technique rating. It is intended to catch gross ordering regressions.');
`;

const context = {
  console,
  performance,
  document: { getElementById() { return {}; }, querySelectorAll() { return []; } },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
};
vm.runInNewContext(prefix + '\n' + audit, context, { filename: 'difficulty-audit', timeout: 30000 });
