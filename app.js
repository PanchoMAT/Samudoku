const SOLUTION_ROWS = [
  "658372491...659328714",
  "237194685...238147956",
  "419586273...417569832",
  "572943168...843671529",
  "394861527...761295348",
  "186725349...925483167",
  "743619852743196852473",
  "825437916825374916285",
  "961258734961582734691",
  "......147596238......",
  "......328174659......",
  "......569382417......",
  "617483295438761438259",
  "259671483617925617438",
  "438295671259843259617",
  "725816934...374825961",
  "861934752...196743825",
  "943752816...582961743",
  "386549127...659174382",
  "172368549...238596174",
  "594127368...417382596"
];

const PUZZLE_ROWS = [
  "008002001...000328710",
  "230094680...230140900",
  "409006003...010500032",
  "002040168...003671000",
  "094000000...700090300",
  "000025340...025400000",
  "003610002700000850003",
  "800407000000074000005",
  "000008034061002034001",
  "......147590230......",
  "......300004009......",
  "......500000000......",
  "600083000400000000000",
  "009071000010020607030",
  "038000000209003200610",
  "720800030...304800000",
  "061000002...100700805",
  "900000800...500960040",
  "080000007...050100080",
  "102068040...230590074",
  "000020308...017002500"
];

const GRIDS = [
  { id: "tl", name: "Superior izquierdo", row: 0, col: 0 },
  { id: "tr", name: "Superior derecho", row: 0, col: 12 },
  { id: "c",  name: "Central", row: 6, col: 6 },
  { id: "bl", name: "Inferior izquierdo", row: 12, col: 0 },
  { id: "br", name: "Inferior derecho", row: 12, col: 12 }
];

const STORAGE_KEY = "samudoku-demo-v1";

const boardEl = document.getElementById("board");
const numberPadEl = document.getElementById("number-pad");
const activeGridLabelEl = document.getElementById("active-grid-label");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("win-modal");

const solution = new Map();
const givens = new Map();
const values = new Map();
const cells = new Map();
const memberships = new Map();
const hinted = new Set();

let selectedKey = null;
let startTime = Date.now();
let timerHandle = null;
let toastHandle = null;

function keyOf(row, col) {
  return `${row},${col}`;
}

function parseBoardRows() {
  for (let row = 0; row < 21; row += 1) {
    for (let col = 0; col < 21; col += 1) {
      const s = SOLUTION_ROWS[row][col];
      if (s === ".") continue;
      const key = keyOf(row, col);
      solution.set(key, Number(s));

      const p = PUZZLE_ROWS[row][col];
      if (p !== "0" && p !== ".") {
        givens.set(key, Number(p));
        values.set(key, Number(p));
      }
    }
  }
}

function gridMemberships(row, col) {
  return GRIDS.filter(grid =>
    row >= grid.row && row < grid.row + 9 &&
    col >= grid.col && col < grid.col + 9
  );
}

function borderThicknesses(row, col, memberGrids) {
  let top = 1, right = 1, bottom = 1, left = 1;

  memberGrids.forEach(grid => {
    const localRow = row - grid.row;
    const localCol = col - grid.col;

    if (localRow === 0 || localRow % 3 === 0) top = Math.max(top, 2.5);
    if (localRow === 8 || localRow % 3 === 2) bottom = Math.max(bottom, 2.5);
    if (localCol === 0 || localCol % 3 === 0) left = Math.max(left, 2.5);
    if (localCol === 8 || localCol % 3 === 2) right = Math.max(right, 2.5);
  });

  return { top, right, bottom, left };
}

function createBoard() {
  solution.forEach((_, key) => {
    const [row, col] = key.split(",").map(Number);
    const memberGrids = gridMemberships(row, col);
    memberships.set(key, memberGrids.map(g => g.id));

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.key = key;
    button.style.gridRow = String(row + 1);
    button.style.gridColumn = String(col + 1);

    const borders = borderThicknesses(row, col, memberGrids);
    button.style.borderTopWidth = `${borders.top}px`;
    button.style.borderRightWidth = `${borders.right}px`;
    button.style.borderBottomWidth = `${borders.bottom}px`;
    button.style.borderLeftWidth = `${borders.left}px`;

    if (memberGrids.length > 1) button.classList.add("shared");
    if (givens.has(key)) button.classList.add("given");

    button.addEventListener("click", () => selectCell(key));
    cells.set(key, button);
    boardEl.appendChild(button);
  });
}

function createNumberPad() {
  for (let number = 1; number <= 9; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "num-btn";
    button.textContent = String(number);
    button.setAttribute("aria-label", `Escribir ${number}`);
    button.addEventListener("click", () => enterNumber(number));
    numberPadEl.appendChild(button);
  }
}

function getSelectedMembershipNames() {
  if (!selectedKey) return [];
  const ids = memberships.get(selectedKey) || [];
  return ids.map(id => GRIDS.find(g => g.id === id)?.name).filter(Boolean);
}

function updateActiveLabel() {
  const names = getSelectedMembershipNames();
  if (names.length === 0) {
    activeGridLabelEl.textContent = "Selecciona una casilla";
  } else if (names.length === 1) {
    activeGridLabelEl.textContent = names[0];
  } else {
    activeGridLabelEl.textContent = `Zona compartida · ${names.join(" + ")}`;
  }
}

function arePeers(aKey, bKey) {
  const [ar, ac] = aKey.split(",").map(Number);
  const [br, bc] = bKey.split(",").map(Number);
  const commonGridIds = (memberships.get(aKey) || []).filter(id =>
    (memberships.get(bKey) || []).includes(id)
  );

  return commonGridIds.some(id => {
    const grid = GRIDS.find(g => g.id === id);
    const aLocalR = ar - grid.row;
    const aLocalC = ac - grid.col;
    const bLocalR = br - grid.row;
    const bLocalC = bc - grid.col;

    const sameRow = aLocalR === bLocalR;
    const sameCol = aLocalC === bLocalC;
    const sameBlock =
      Math.floor(aLocalR / 3) === Math.floor(bLocalR / 3) &&
      Math.floor(aLocalC / 3) === Math.floor(bLocalC / 3);

    return sameRow || sameCol || sameBlock;
  });
}

function selectCell(key) {
  selectedKey = key;
  renderHighlights();
  updateActiveLabel();
}

function renderHighlights() {
  const selectedValue = selectedKey ? values.get(selectedKey) : null;
  const activeGridIds = selectedKey ? memberships.get(selectedKey) || [] : [];

  cells.forEach((cell, key) => {
    cell.classList.remove("selected", "peer", "same-number", "active-grid");

    if (!selectedKey) return;

    if ((memberships.get(key) || []).some(id => activeGridIds.includes(id))) {
      cell.classList.add("active-grid");
    }

    if (key === selectedKey) {
      cell.classList.add("selected");
    } else if (arePeers(selectedKey, key)) {
      cell.classList.add("peer");
    }

    if (selectedValue && values.get(key) === selectedValue) {
      cell.classList.add("same-number");
    }
  });
}

function renderValues() {
  cells.forEach((cell, key) => {
    const value = values.get(key);
    cell.textContent = value ? String(value) : "";
    cell.classList.toggle("hinted", hinted.has(key));
  });
  updateProgress();
  renderHighlights();
}

function isLocked(key) {
  return givens.has(key) || hinted.has(key);
}

function enterNumber(number) {
  if (!selectedKey || isLocked(selectedKey)) return;
  values.set(selectedKey, number);
  clearValidation(selectedKey);
  saveState();
  renderValues();
  checkForWin(false);
}

function eraseSelected() {
  if (!selectedKey || isLocked(selectedKey)) return;
  values.delete(selectedKey);
  clearValidation(selectedKey);
  saveState();
  renderValues();
}

function clearValidation(key) {
  const cell = cells.get(key);
  if (!cell) return;
  cell.classList.remove("wrong", "correct");
}

function validateBoard() {
  let wrong = 0;
  let filled = 0;

  cells.forEach((cell, key) => {
    cell.classList.remove("wrong", "correct");
    const value = values.get(key);

    if (!value) return;
    filled += 1;

    if (value !== solution.get(key)) {
      cell.classList.add("wrong");
      wrong += 1;
    } else if (!givens.has(key) && !hinted.has(key)) {
      cell.classList.add("correct");
    }
  });

  if (wrong > 0) {
    showToast(`${wrong} ${wrong === 1 ? "casilla necesita" : "casillas necesitan"} revisión.`);
  } else if (filled < solution.size) {
    showToast("Todo lo completado hasta ahora está correcto.");
  } else {
    checkForWin(true);
  }
}

function giveHint() {
  let targetKey = selectedKey;

  if (!targetKey || values.has(targetKey) || givens.has(targetKey)) {
    const emptyKeys = [...solution.keys()].filter(key => !values.has(key));
    if (emptyKeys.length === 0) return;
    targetKey = emptyKeys[Math.floor(Math.random() * emptyKeys.length)];
  }

  values.set(targetKey, solution.get(targetKey));
  hinted.add(targetKey);
  selectedKey = targetKey;
  saveState();
  renderValues();
  updateActiveLabel();
  showToast("Pista colocada.");
  checkForWin(false);
}

function resetGame() {
  values.clear();
  givens.forEach((value, key) => values.set(key, value));
  hinted.clear();
  selectedKey = null;
  startTime = Date.now();
  localStorage.removeItem(STORAGE_KEY);

  cells.forEach(cell => {
    cell.classList.remove("wrong", "correct", "hinted", "selected", "peer", "same-number", "active-grid");
  });

  renderValues();
  updateActiveLabel();
  updateTimer();
  showToast("Tablero reiniciado.");
}

function updateProgress() {
  progressEl.textContent = `${values.size}/${solution.size}`;
}

function updateTimer() {
  const seconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function startTimer() {
  clearInterval(timerHandle);
  updateTimer();
  timerHandle = setInterval(updateTimer, 1000);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function checkForWin(showFeedback = true) {
  if (values.size !== solution.size) return false;

  const solved = [...solution.keys()].every(key => values.get(key) === solution.get(key));
  if (solved) {
    clearInterval(timerHandle);
    modalEl.classList.remove("hidden");
    modalEl.setAttribute("aria-hidden", "false");
    if (showFeedback) showToast("¡Completado!");
    return true;
  }
  return false;
}

function saveState() {
  const customValues = {};
  values.forEach((value, key) => {
    if (!givens.has(key)) customValues[key] = value;
  });

  const payload = {
    customValues,
    hinted: [...hinted],
    elapsedMs: Date.now() - startTime
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    Object.entries(saved.customValues || {}).forEach(([key, value]) => {
      if (solution.has(key) && Number.isInteger(value) && value >= 1 && value <= 9) {
        values.set(key, value);
      }
    });

    (saved.hinted || []).forEach(key => {
      if (solution.has(key)) hinted.add(key);
    });

    if (Number.isFinite(saved.elapsedMs)) {
      startTime = Date.now() - Math.max(0, saved.elapsedMs);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function moveSelection(deltaRow, deltaCol) {
  if (!selectedKey) {
    selectedKey = [...solution.keys()][0];
    selectCell(selectedKey);
    return;
  }

  let [row, col] = selectedKey.split(",").map(Number);

  for (let steps = 0; steps < 21; steps += 1) {
    row += deltaRow;
    col += deltaCol;

    if (row < 0 || row > 20 || col < 0 || col > 20) return;

    const candidate = keyOf(row, col);
    if (solution.has(candidate)) {
      selectCell(candidate);
      return;
    }
  }
}

function handleKeyboard(event) {
  if (/^[1-9]$/.test(event.key)) {
    enterNumber(Number(event.key));
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    event.preventDefault();
    eraseSelected();
    return;
  }

  const arrows = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };

  if (arrows[event.key]) {
    event.preventDefault();
    moveSelection(...arrows[event.key]);
  }
}

parseBoardRows();
loadState();
createBoard();
createNumberPad();
renderValues();
startTimer();

document.getElementById("erase-btn").addEventListener("click", eraseSelected);
document.getElementById("check-btn").addEventListener("click", validateBoard);
document.getElementById("hint-btn").addEventListener("click", giveHint);
document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("close-modal-btn").addEventListener("click", () => {
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
});
document.addEventListener("keydown", handleKeyboard);

window.addEventListener("beforeunload", saveState);
