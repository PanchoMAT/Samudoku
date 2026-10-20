const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');

const appPath = path.join(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

// Execute the real puzzle-generation and solver code from app.js, but stop
// before the browser UI initialization at the bottom of the file.
const initMarker = '\nparseBaseBoards();';
const initPos = source.lastIndexOf(initMarker);
if (initPos < 0) {
  throw new Error('Could not locate Samudoku initialization marker in app.js');
}

const prefix = source.slice(0, initPos);

const audit = String.raw`
parseBaseBoards();
initSolverStructures();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateCompletedSolution(puzzle) {
  const target = '123456789';

  for (const grid of GRIDS) {
    for (let i = 0; i < 9; i += 1) {
      const row = [];
      const col = [];
      for (let j = 0; j < 9; j += 1) {
        row.push(puzzle.solution.get(keyOf(grid.row + i, grid.col + j)));
        col.push(puzzle.solution.get(keyOf(grid.row + j, grid.col + i)));
      }
      assert(row.slice().sort().join('') === target,
        puzzle.id + ': invalid row in grid ' + grid.id + ', row ' + (i + 1));
      assert(col.slice().sort().join('') === target,
        puzzle.id + ': invalid column in grid ' + grid.id + ', column ' + (i + 1));
    }

    for (let br = 0; br < 3; br += 1) {
      for (let bc = 0; bc < 3; bc += 1) {
        const box = [];
        for (let r = 0; r < 3; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            box.push(puzzle.solution.get(keyOf(
              grid.row + br * 3 + r,
              grid.col + bc * 3 + c
            )));
          }
        }
        assert(box.slice().sort().join('') === target,
          puzzle.id + ': invalid 3x3 block in grid ' + grid.id);
      }
    }
  }
}

const results = [];

for (let packIndex = 0; packIndex < PACKS.length; packIndex += 1) {
  for (let puzzleIndex = 0; puzzleIndex < 10; puzzleIndex += 1) {
    const puzzle = generatePuzzle(packIndex, puzzleIndex);

    assert(puzzle.givens.size === PACKS[packIndex].targets[puzzleIndex],
      puzzle.id + ': unexpected number of givens');

    validateCompletedSolution(puzzle);

    puzzle.givens.forEach((value, key) => {
      assert(puzzle.solution.has(key), puzzle.id + ': given outside Samurai board at ' + key);
      assert(puzzle.solution.get(key) === value,
        puzzle.id + ': given contradicts certified solution at ' + key);
    });

    const analysis = solveSamudoku(puzzle.givens, {
      maxSolutions: 2,
      timeLimitMs: 10000,
      maxNodes: 3000000
    });

    assert(analysis.status === 'unique',
      puzzle.id + ': expected unique solution, got ' + analysis.status +
      ' (solutions=' + analysis.solutions + ', nodes=' + analysis.nodes + ')');

    results.push({
      id: puzzle.id,
      givens: puzzle.givens.size,
      status: analysis.status,
      nodes: analysis.nodes
    });
  }
}

console.table(results);
console.log('PASS: ' + results.length + '/40 built-in Samudoku puzzles are valid, solvable and globally unique.');
`;

const context = {
  console,
  performance,
  document: {
    getElementById() { return {}; },
    querySelectorAll() { return []; }
  },
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  }
};

vm.runInNewContext(prefix + '\n' + audit, context, {
  filename: 'app.js+puzzle-audit',
  timeout: 30000
});
