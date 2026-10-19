const BASE_SOLUTION_ROWS = [
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

// Este puzzle base tiene solución única. Todos los desafíos de esta versión
// conservan sus pistas y agregan otras, por lo que también mantienen unicidad.
const BASE_PUZZLE_ROWS = [
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
  { id: "tl", short: "↖", name: "Superior izquierdo", row: 0, col: 0 },
  { id: "tr", short: "↗", name: "Superior derecho", row: 0, col: 12 },
  { id: "c",  short: "●", name: "Central", row: 6, col: 6 },
  { id: "bl", short: "↙", name: "Inferior izquierdo", row: 12, col: 0 },
  { id: "br", short: "↘", name: "Inferior derecho", row: 12, col: 12 }
];

const PACKS = [
  {
    id: "easy",
    name: "Fácil",
    icon: "🌱",
    description: "Más números iniciales para aprender a moverse por los cinco tableros.",
    targets: [265, 262, 259, 256, 253, 250, 247, 244, 241, 238],
    reward: 3
  },
  {
    id: "medium",
    name: "Medio",
    icon: "🌿",
    description: "Menos pistas iniciales y más interacción entre las zonas compartidas.",
    targets: [232, 229, 226, 223, 220, 217, 214, 211, 208, 205],
    reward: 4
  },
  {
    id: "hard",
    name: "Difícil",
    icon: "🔥",
    description: "El tablero se abre bastante: necesitarás cruzar información entre sudokus.",
    targets: [200, 197, 194, 191, 188, 185, 182, 179, 176, 173],
    reward: 5
  },
  {
    id: "expert",
    name: "Experto",
    icon: "🏆",
    description: "La versión con menos pistas de esta primera colección de Samudoku.",
    targets: [168, 165, 162, 159, 156, 153, 150, 148, 146, 145],
    reward: 6
  }
];

const PROFILE_KEY = "samudoku-profile-v2";
const GAME_PREFIX = "samudoku-game-v2-";
const HINT_COST = 2;
const STARTING_STARS = 4;

const boardEl = document.getElementById("board");
const numberPadEl = document.getElementById("number-pad");
const activeGridLabelEl = document.getElementById("active-grid-label");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("win-modal");
const starCountEl = document.getElementById("star-count");
const difficultyPillEl = document.getElementById("difficulty-pill");
const levelLabelEl = document.getElementById("level-label");
const difficultyTabsEl = document.getElementById("difficulty-tabs");
const puzzleGridEl = document.getElementById("puzzle-grid");
const packDescriptionEl = document.getElementById("pack-description");
const rewardBoxEl = document.getElementById("reward-box");
const winMessageEl = document.getElementById("win-message");

const solution = new Map();
const givens = new Map();
const values = new Map();
const cells = new Map();
const memberships = new Map();
const hinted = new Set();
const shapeCells = [];
const baseSolution = new Map();
const baseGivens = new Map();

let profile = loadProfile();
let currentPackIndex = clampNumber(profile.lastPackIndex, 0, PACKS.length - 1, 0);
let currentPuzzleIndex = clampNumber(profile.lastPuzzleIndex, 0, 9, 0);
let browserPackIndex = currentPackIndex;
let currentPuzzle = null;
let selectedKey = null;
let focusMode = "all";
let startTime = Date.now();
let timerHandle = null;
let toastHandle = null;
let usedHints = 0;
let hadError = false;
let alreadyWonThisSession = false;

function clampNumber(value, min, max, fallback) {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function keyOf(row, col) { return `${row},${col}`; }
function coordsOf(key) { return key.split(",").map(Number); }

function parseBaseBoards() {
  for (let row = 0; row < 21; row += 1) {
    for (let col = 0; col < 21; col += 1) {
      const s = BASE_SOLUTION_ROWS[row][col];
      if (s === ".") continue;
      const key = keyOf(row, col);
      shapeCells.push(key);
      baseSolution.set(key, Number(s));
      const p = BASE_PUZZLE_ROWS[row][col];
      if (p !== "0" && p !== ".") baseGivens.set(key, Number(p));
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

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(array, random) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function transformCoord(row, col, transformIndex) {
  switch (transformIndex % 8) {
    case 1: return [col, 20 - row];
    case 2: return [20 - row, 20 - col];
    case 3: return [20 - col, row];
    case 4: return [row, 20 - col];
    case 5: return [20 - row, col];
    case 6: return [col, row];
    case 7: return [20 - col, 20 - row];
    default: return [row, col];
  }
}

function generatePuzzle(packIndex, puzzleIndex) {
  const pack = PACKS[packIndex];
  const seed = 9113823 + packIndex * 104729 + puzzleIndex * 7919;
  const random = mulberry32(seed);
  const transformIndex = (packIndex * 3 + puzzleIndex * 5) % 8;
  const digits = shuffle([1,2,3,4,5,6,7,8,9], random);
  const digitMap = new Map([1,2,3,4,5,6,7,8,9].map((digit, index) => [digit, digits[index]]));

  const transformedSolution = new Map();
  baseSolution.forEach((value, oldKey) => {
    const [row, col] = coordsOf(oldKey);
    const [newRow, newCol] = transformCoord(row, col, transformIndex);
    transformedSolution.set(keyOf(newRow, newCol), digitMap.get(value));
  });

  const transformedBaseGivens = new Map();
  baseGivens.forEach((value, oldKey) => {
    const [row, col] = coordsOf(oldKey);
    const [newRow, newCol] = transformCoord(row, col, transformIndex);
    transformedBaseGivens.set(keyOf(newRow, newCol), digitMap.get(value));
  });

  const targetGivens = pack.targets[puzzleIndex];
  const chosenKeys = new Set(transformedBaseGivens.keys());
  const candidates = shuffle(shapeCells.filter(key => !chosenKeys.has(key)), random);
  for (const key of candidates) {
    if (chosenKeys.size >= targetGivens) break;
    chosenKeys.add(key);
  }

  const puzzleGivens = new Map();
  chosenKeys.forEach(key => puzzleGivens.set(key, transformedSolution.get(key)));

  return {
    id: `${pack.id}-${puzzleIndex + 1}`,
    packIndex,
    puzzleIndex,
    targetGivens,
    solution: transformedSolution,
    givens: puzzleGivens
  };
}

function loadProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (parsed && typeof parsed === "object") {
      return {
        stars: Number.isFinite(parsed.stars) ? Math.max(0, Math.floor(parsed.stars)) : STARTING_STARS,
        completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
        lastPackIndex: parsed.lastPackIndex,
        lastPuzzleIndex: parsed.lastPuzzleIndex
      };
    }
  } catch {}
  return { stars: STARTING_STARS, completed: {}, lastPackIndex: 0, lastPuzzleIndex: 0 };
}

function saveProfile() {
  profile.lastPackIndex = currentPackIndex;
  profile.lastPuzzleIndex = currentPuzzleIndex;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  renderProfile();
}

function renderProfile() {
  starCountEl.textContent = String(profile.stars);
}

function gameStorageKey() { return `${GAME_PREFIX}${currentPuzzle.id}`; }

function createBoard() {
  shapeCells.forEach(key => {
    const [row, col] = coordsOf(key);
    const memberGrids = gridMemberships(row, col);
    memberships.set(key, memberGrids.map(g => g.id));

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.key = key;
    if (memberGrids.length > 1) button.classList.add("shared");
    button.addEventListener("click", () => selectCell(key));
    cells.set(key, button);
    boardEl.appendChild(button);
  });
  updateBoardLayout();
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

function createLevelControls() {
  difficultyTabsEl.innerHTML = "";
  PACKS.forEach((pack, packIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-tab";
    button.dataset.pack = String(packIndex);
    button.textContent = `${pack.icon} ${pack.name}`;
    button.addEventListener("click", () => {
      browserPackIndex = packIndex;
      renderLevelControls();
    });
    difficultyTabsEl.appendChild(button);
  });
  renderLevelControls();
}

function renderLevelControls() {
  [...difficultyTabsEl.children].forEach((button, index) => {
    button.classList.toggle("active", index === browserPackIndex);
  });

  const pack = PACKS[browserPackIndex];
  packDescriptionEl.textContent = pack.description;
  puzzleGridEl.innerHTML = "";

  for (let puzzleIndex = 0; puzzleIndex < 10; puzzleIndex += 1) {
    const id = `${pack.id}-${puzzleIndex + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "puzzle-btn";
    if (browserPackIndex === currentPackIndex && puzzleIndex === currentPuzzleIndex) button.classList.add("current");
    if (profile.completed[id]) button.classList.add("completed");
    button.textContent = profile.completed[id] ? `✓${puzzleIndex + 1}` : String(puzzleIndex + 1);
    button.title = `${pack.name} · Desafío ${puzzleIndex + 1}`;
    button.addEventListener("click", () => switchPuzzle(browserPackIndex, puzzleIndex));
    puzzleGridEl.appendChild(button);
  }
}

function updateCurrentLabels() {
  const pack = PACKS[currentPackIndex];
  difficultyPillEl.textContent = `${pack.name} · ${currentPuzzleIndex + 1}/10`;
  levelLabelEl.textContent = `${pack.icon} ${pack.name} · Desafío ${currentPuzzleIndex + 1}`;
}

function updateBoardLayout() {
  const focusedGrid = focusMode === "all" ? null : GRIDS.find(grid => grid.id === focusMode);
  boardEl.classList.toggle("focused", Boolean(focusedGrid));

  cells.forEach((cell, key) => {
    const [row, col] = coordsOf(key);
    let memberGrids;

    if (focusedGrid) {
      const belongs = row >= focusedGrid.row && row < focusedGrid.row + 9 && col >= focusedGrid.col && col < focusedGrid.col + 9;
      cell.style.display = belongs ? "grid" : "none";
      if (!belongs) return;
      cell.style.gridRow = String(row - focusedGrid.row + 1);
      cell.style.gridColumn = String(col - focusedGrid.col + 1);
      memberGrids = [focusedGrid];
    } else {
      cell.style.display = "grid";
      cell.style.gridRow = String(row + 1);
      cell.style.gridColumn = String(col + 1);
      memberGrids = gridMemberships(row, col);
    }

    const borders = borderThicknesses(row, col, memberGrids);
    cell.style.borderTopWidth = `${borders.top}px`;
    cell.style.borderRightWidth = `${borders.right}px`;
    cell.style.borderBottomWidth = `${borders.bottom}px`;
    cell.style.borderLeftWidth = `${borders.left}px`;
  });
}

function setFocus(mode) {
  focusMode = mode;
  selectedKey = null;
  document.querySelectorAll(".zoom-btn").forEach(button => button.classList.toggle("active", button.dataset.focus === mode));
  updateBoardLayout();
  renderHighlights();
  updateActiveLabel();
}

function loadCurrentPuzzle() {
  currentPuzzle = generatePuzzle(currentPackIndex, currentPuzzleIndex);
  solution.clear();
  givens.clear();
  values.clear();
  hinted.clear();
  currentPuzzle.solution.forEach((value, key) => solution.set(key, value));
  currentPuzzle.givens.forEach((value, key) => {
    givens.set(key, value);
    values.set(key, value);
  });

  selectedKey = null;
  focusMode = "all";
  startTime = Date.now();
  usedHints = 0;
  hadError = false;
  alreadyWonThisSession = false;
  loadGameState();
  updateCurrentLabels();
  setFocus("all");
  renderValues();
  renderLevelControls();
  renderProfile();

  if (profile.completed[currentPuzzle.id] && isSolved()) {
    clearInterval(timerHandle);
    updateTimer();
  } else {
    startTimer();
  }
}

function switchPuzzle(packIndex, puzzleIndex) {
  saveGameState();
  currentPackIndex = packIndex;
  currentPuzzleIndex = puzzleIndex;
  browserPackIndex = packIndex;
  saveProfile();
  loadCurrentPuzzle();
  modalEl.classList.add("hidden");
  showToast(`${PACKS[packIndex].name} · Desafío ${puzzleIndex + 1}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getSelectedMembershipNames() {
  if (!selectedKey) return [];
  return (memberships.get(selectedKey) || [])
    .map(id => GRIDS.find(g => g.id === id)?.name)
    .filter(Boolean);
}

function updateActiveLabel() {
  if (focusMode !== "all" && !selectedKey) {
    const grid = GRIDS.find(g => g.id === focusMode);
    activeGridLabelEl.textContent = `Vista ampliada · ${grid.name}`;
    return;
  }
  const names = getSelectedMembershipNames();
  if (names.length === 0) activeGridLabelEl.textContent = "Selecciona una casilla";
  else if (names.length === 1) activeGridLabelEl.textContent = names[0];
  else activeGridLabelEl.textContent = `Zona compartida · ${names.join(" + ")}`;
}

function arePeers(aKey, bKey) {
  const [ar, ac] = coordsOf(aKey);
  const [br, bc] = coordsOf(bKey);
  const commonGridIds = (memberships.get(aKey) || []).filter(id => (memberships.get(bKey) || []).includes(id));

  return commonGridIds.some(id => {
    const grid = GRIDS.find(g => g.id === id);
    const aLocalR = ar - grid.row;
    const aLocalC = ac - grid.col;
    const bLocalR = br - grid.row;
    const bLocalC = bc - grid.col;
    return aLocalR === bLocalR ||
      aLocalC === bLocalC ||
      (Math.floor(aLocalR / 3) === Math.floor(bLocalR / 3) && Math.floor(aLocalC / 3) === Math.floor(bLocalC / 3));
  });
}

function selectCell(key) {
  if (!isVisibleInFocus(key)) return;
  selectedKey = key;
  renderHighlights();
  updateActiveLabel();
}

function isVisibleInFocus(key) {
  if (focusMode === "all") return true;
  return (memberships.get(key) || []).includes(focusMode);
}

function renderHighlights() {
  const selectedValue = selectedKey ? values.get(selectedKey) : null;
  const activeGridIds = selectedKey ? memberships.get(selectedKey) || [] : [];

  cells.forEach((cell, key) => {
    cell.classList.remove("selected", "peer", "same-number", "active-grid");
    if (!selectedKey) return;
    if ((memberships.get(key) || []).some(id => activeGridIds.includes(id))) cell.classList.add("active-grid");
    if (key === selectedKey) cell.classList.add("selected");
    else if (arePeers(selectedKey, key)) cell.classList.add("peer");
    if (selectedValue && values.get(key) === selectedValue) cell.classList.add("same-number");
  });
}

function renderValues() {
  cells.forEach((cell, key) => {
    const value = values.get(key);
    cell.textContent = value ? String(value) : "";
    cell.classList.toggle("given", givens.has(key));
    cell.classList.toggle("hinted", hinted.has(key));
  });
  updateProgress();
  renderHighlights();
}

function isLocked(key) { return givens.has(key) || hinted.has(key); }

function enterNumber(number) {
  if (!selectedKey || isLocked(selectedKey)) return;
  values.set(selectedKey, number);
  clearValidation(selectedKey);
  saveGameState();
  renderValues();
  checkForWin(false);
}

function eraseSelected() {
  if (!selectedKey || isLocked(selectedKey)) return;
  values.delete(selectedKey);
  clearValidation(selectedKey);
  saveGameState();
  renderValues();
}

function clearValidation(key) {
  const cell = cells.get(key);
  if (cell) cell.classList.remove("wrong", "correct");
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
    hadError = true;
    saveGameState();
    showToast(`${wrong} ${wrong === 1 ? "casilla necesita" : "casillas necesitan"} revisión.`);
  } else if (filled < solution.size) {
    showToast("Todo lo completado hasta ahora está correcto.");
  } else {
    checkForWin(true);
  }
}

function giveHint() {
  if (profile.stars < HINT_COST) {
    showToast(`Necesitas ${HINT_COST} ⭐ para comprar una pista.`);
    return;
  }

  let targetKey = selectedKey;
  if (!targetKey || isLocked(targetKey) || values.get(targetKey) === solution.get(targetKey) || !isVisibleInFocus(targetKey)) {
    const candidates = [...solution.keys()].filter(key =>
      isVisibleInFocus(key) && !isLocked(key) && values.get(key) !== solution.get(key)
    );
    if (candidates.length === 0) {
      showToast("No hay una casilla disponible para usar la pista en esta vista.");
      return;
    }
    targetKey = candidates[Math.floor(Math.random() * candidates.length)];
  }

  profile.stars -= HINT_COST;
  usedHints += 1;
  values.set(targetKey, solution.get(targetKey));
  hinted.add(targetKey);
  selectedKey = targetKey;
  saveProfile();
  saveGameState();
  renderValues();
  updateActiveLabel();
  showToast(`Pista colocada · −${HINT_COST} ⭐`);
  checkForWin(false);
}

function resetGame() {
  values.clear();
  givens.forEach((value, key) => values.set(key, value));
  hinted.clear();
  selectedKey = null;
  startTime = Date.now();
  usedHints = 0;
  hadError = false;
  alreadyWonThisSession = false;
  localStorage.removeItem(gameStorageKey());
  cells.forEach(cell => cell.classList.remove("wrong", "correct", "hinted", "selected", "peer", "same-number", "active-grid"));
  renderValues();
  updateActiveLabel();
  startTimer();
  showToast("Desafío reiniciado. Tus estrellas y logros se conservan.");
}

function updateProgress() { progressEl.textContent = `${values.size}/${solution.size}`; }

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
  toastHandle = setTimeout(() => toastEl.classList.remove("show"), 2100);
}

function isSolved() {
  return values.size === solution.size && [...solution.keys()].every(key => values.get(key) === solution.get(key));
}

function checkForWin(showFeedback = true) {
  if (!isSolved() || alreadyWonThisSession) return false;
  alreadyWonThisSession = true;
  clearInterval(timerHandle);
  saveGameState();

  const firstCompletion = !profile.completed[currentPuzzle.id];
  let reward = 0;
  const rewardParts = [];

  if (firstCompletion) {
    const pack = PACKS[currentPackIndex];
    reward += pack.reward;
    rewardParts.push(`${pack.reward} por completar`);
    if (usedHints === 0) {
      reward += 1;
      rewardParts.push("+1 sin pistas");
    }
    if (!hadError) {
      reward += 1;
      rewardParts.push("+1 sin errores detectados");
    }
    profile.stars += reward;
    profile.completed[currentPuzzle.id] = {
      completedAt: new Date().toISOString(),
      reward,
      usedHints,
      hadError
    };
    saveProfile();
    rewardBoxEl.textContent = `Ganaste ${reward} ⭐ · ${rewardParts.join(" · ")}`;
  } else {
    rewardBoxEl.textContent = "Este desafío ya estaba completado, así que no vuelve a entregar estrellas.";
  }

  winMessageEl.textContent = `${PACKS[currentPackIndex].name} · Desafío ${currentPuzzleIndex + 1} completado.`;
  modalEl.classList.remove("hidden");
  modalEl.setAttribute("aria-hidden", "false");
  renderLevelControls();
  if (showFeedback) showToast("¡Samudoku completado!");
  return true;
}

function saveGameState() {
  if (!currentPuzzle) return;
  const customValues = {};
  values.forEach((value, key) => {
    if (!givens.has(key)) customValues[key] = value;
  });
  const payload = {
    customValues,
    hinted: [...hinted],
    elapsedMs: Date.now() - startTime,
    usedHints,
    hadError
  };
  localStorage.setItem(gameStorageKey(), JSON.stringify(payload));
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(gameStorageKey());
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.entries(saved.customValues || {}).forEach(([key, value]) => {
      if (solution.has(key) && Number.isInteger(value) && value >= 1 && value <= 9) values.set(key, value);
    });
    (saved.hinted || []).forEach(key => { if (solution.has(key)) hinted.add(key); });
    if (Number.isFinite(saved.elapsedMs)) startTime = Date.now() - Math.max(0, saved.elapsedMs);
    usedHints = Number.isFinite(saved.usedHints) ? Math.max(0, Math.floor(saved.usedHints)) : hinted.size;
    hadError = Boolean(saved.hadError);
  } catch {
    localStorage.removeItem(gameStorageKey());
  }
}

function moveSelection(deltaRow, deltaCol) {
  const allowed = key => solution.has(key) && isVisibleInFocus(key);
  if (!selectedKey || !allowed(selectedKey)) {
    const first = [...solution.keys()].find(allowed);
    if (first) selectCell(first);
    return;
  }

  let [row, col] = coordsOf(selectedKey);
  for (let steps = 0; steps < 21; steps += 1) {
    row += deltaRow;
    col += deltaCol;
    if (row < 0 || row > 20 || col < 0 || col > 20) return;
    const candidate = keyOf(row, col);
    if (allowed(candidate)) {
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

function goToNextPuzzle() {
  let nextPack = currentPackIndex;
  let nextPuzzle = currentPuzzleIndex + 1;
  if (nextPuzzle >= 10) {
    nextPuzzle = 0;
    nextPack = (currentPackIndex + 1) % PACKS.length;
  }
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
  switchPuzzle(nextPack, nextPuzzle);
}

parseBaseBoards();
createBoard();
createNumberPad();
createLevelControls();
loadCurrentPuzzle();

document.getElementById("erase-btn").addEventListener("click", eraseSelected);
document.getElementById("check-btn").addEventListener("click", validateBoard);
document.getElementById("hint-btn").addEventListener("click", giveHint);
document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("next-level-btn").addEventListener("click", goToNextPuzzle);
document.getElementById("close-modal-btn").addEventListener("click", () => {
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
});
document.querySelectorAll(".zoom-btn").forEach(button => button.addEventListener("click", () => setFocus(button.dataset.focus)));
document.addEventListener("keydown", handleKeyboard);
window.addEventListener("beforeunload", () => {
  saveGameState();
  saveProfile();
});
