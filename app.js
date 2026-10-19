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
const musicBtnEl = document.getElementById("music-btn");
const challengeBannerEl = document.getElementById("challenge-banner");
const creatorSectionEl = document.getElementById("creator-section");
const creatorBoardEl = document.getElementById("creator-board");
const creatorPresetEl = document.getElementById("creator-preset");
const creatorGivensCountEl = document.getElementById("creator-givens-count");
const creatorDifficultyEl = document.getElementById("creator-difficulty");
const creatorValidationEl = document.getElementById("creator-validation");
const creatorShareBtnEl = document.getElementById("creator-share-btn");
const creatorPlayBtnEl = document.getElementById("creator-play-btn");
const creatorCopyBtnEl = document.getElementById("creator-copy-btn");
const celebrationCanvasEl = document.getElementById("celebration-canvas");
const subgridCelebrationEl = document.getElementById("subgrid-celebration");
const subgridCelebrationTextEl = document.getElementById("subgrid-celebration-text");

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
let selectedNumber = null;
let completedSubgrids = new Set();
let customChallengeMode = false;
let customChallengeId = null;

let creatorSolution = new Map();
let creatorGivens = new Set();
let creatorCells = new Map();
let creatorShowSolution = false;
let creatorValidationFresh = false;
let creatorLastAnalysis = null;
let creatorSeedCounter = 0;

let audioContext = null;
let musicMaster = null;
let musicTimer = null;
let musicEnabled = false;
let musicChordIndex = 0;

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
    button.dataset.number = String(number);
    button.textContent = String(number);
    button.setAttribute("aria-label", `Seleccionar y escribir ${number}`);
    button.addEventListener("click", () => {
      selectedNumber = number;
      renderNumberPadState();
      renderHighlights();
      if (selectedKey && !isLocked(selectedKey)) enterNumber(number);
    });
    numberPadEl.appendChild(button);
  }
}

function renderNumberPadState() {
  numberPadEl.querySelectorAll(".num-btn").forEach(button => {
    button.classList.toggle("active", Number(button.dataset.number) === selectedNumber);
  });
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
  if (customChallengeMode) {
    difficultyPillEl.textContent = "Desafío compartido";
    levelLabelEl.textContent = "🎁 Samudoku personalizado";
    return;
  }
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
  customChallengeMode = false;
  customChallengeId = null;
  challengeBannerEl.classList.add("hidden");
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
  selectedNumber = null;
  focusMode = "all";
  startTime = Date.now();
  usedHints = 0;
  hadError = false;
  alreadyWonThisSession = false;
  loadGameState();
  initializeCompletedSubgrids();
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
  if (customChallengeMode && window.location.hash.startsWith("#challenge=")) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
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
  const numberToMark = selectedNumber || selectedValue || null;
  const activeGridIds = selectedKey ? memberships.get(selectedKey) || [] : [];

  cells.forEach((cell, key) => {
    cell.classList.remove("selected", "peer", "same-number", "number-mark", "active-grid");

    if (selectedKey) {
      if ((memberships.get(key) || []).some(id => activeGridIds.includes(id))) cell.classList.add("active-grid");
      if (key === selectedKey) cell.classList.add("selected");
      else if (arePeers(selectedKey, key)) cell.classList.add("peer");
      if (selectedValue && values.get(key) === selectedValue) cell.classList.add("same-number");
    }

    if (numberToMark && values.get(key) === numberToMark) cell.classList.add("number-mark");
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
  renderNumberPadState();
  renderHighlights();
}

function isLocked(key) { return givens.has(key) || hinted.has(key); }

function enterNumber(number) {
  selectedNumber = number;
  renderNumberPadState();
  if (!selectedKey || isLocked(selectedKey)) {
    renderHighlights();
    return;
  }
  values.set(selectedKey, number);
  clearValidation(selectedKey);
  saveGameState();
  renderValues();
  checkSubgridCompletions();
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
  checkSubgridCompletions();
  checkForWin(false);
}

function resetGame() {
  values.clear();
  givens.forEach((value, key) => values.set(key, value));
  hinted.clear();
  selectedKey = null;
  selectedNumber = null;
  completedSubgrids = new Set();
  startTime = Date.now();
  usedHints = 0;
  hadError = false;
  alreadyWonThisSession = false;
  localStorage.removeItem(gameStorageKey());
  cells.forEach(cell => cell.classList.remove("wrong", "correct", "hinted", "selected", "peer", "same-number", "number-mark", "active-grid"));
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

  if (customChallengeMode) {
    rewardBoxEl.textContent = "Los desafíos compartidos no entregan estrellas, para mantener equilibrado el sistema de recompensas.";
    winMessageEl.textContent = "¡Completaste el Samudoku personalizado!";
    modalEl.classList.remove("hidden");
    modalEl.setAttribute("aria-hidden", "false");
    document.getElementById("next-level-btn").textContent = "Volver a niveles";
    launchFireworks(5);
    if (showFeedback) showToast("¡Desafío compartido completado!");
    return true;
  }

  document.getElementById("next-level-btn").textContent = "Siguiente desafío";
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
  launchFireworks(6);
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
  if (customChallengeMode) {
    leaveCustomChallenge();
    return;
  }
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



function gridKeys(grid) {
  const keys = [];
  for (let row = grid.row; row < grid.row + 9; row += 1) {
    for (let col = grid.col; col < grid.col + 9; col += 1) keys.push(keyOf(row, col));
  }
  return keys;
}

function isGridSolved(grid) {
  return gridKeys(grid).every(key => values.get(key) === solution.get(key));
}

function initializeCompletedSubgrids() {
  completedSubgrids = new Set();
  GRIDS.forEach(grid => {
    if (isGridSolved(grid)) completedSubgrids.add(grid.id);
  });
}

function checkSubgridCompletions() {
  const newlyCompleted = [];
  GRIDS.forEach(grid => {
    if (!completedSubgrids.has(grid.id) && isGridSolved(grid)) {
      completedSubgrids.add(grid.id);
      newlyCompleted.push(grid);
    }
  });
  if (!newlyCompleted.length) return;
  const names = newlyCompleted.map(grid => grid.name).join(" + ");
  showSubgridCelebration(newlyCompleted.length === 1 ? `¡${names} completado!` : `¡${newlyCompleted.length} sudokus completados!`);
  launchFireworks(Math.min(4, newlyCompleted.length + 2));
}

function showSubgridCelebration(text) {
  subgridCelebrationTextEl.textContent = text;
  subgridCelebrationEl.classList.remove("hidden");
  window.setTimeout(() => subgridCelebrationEl.classList.add("hidden"), 1900);
}

function launchFireworks(bursts = 3) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = celebrationCanvasEl;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const palette = ["#5c4b9b", "#f0b84a", "#55a68d", "#e46f86", "#6f8fd6", "#ffffff"];
  const particles = [];
  for (let b = 0; b < bursts; b += 1) {
    const originX = width * (0.18 + Math.random() * 0.64);
    const originY = height * (0.16 + Math.random() * 0.38);
    const count = 28 + Math.floor(Math.random() * 16);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.18;
      const speed = 1.7 + Math.random() * 3.2;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.012,
        size: 1.4 + Math.random() * 2.2,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  }

  let frame;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    let alive = 0;
    particles.forEach(particle => {
      if (particle.life <= 0) return;
      alive += 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.vx *= 0.992;
      particle.life -= particle.decay;
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, width, height);
  }
  if (frame) cancelAnimationFrame(frame);
  draw();
}

async function toggleMusic() {
  if (musicEnabled) {
    stopMusic();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    showToast("Este navegador no permite la música generada por Samudoku.");
    return;
  }
  try {
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === "suspended") await audioContext.resume();
    musicMaster = audioContext.createGain();
    musicMaster.gain.setValueAtTime(0.55, audioContext.currentTime);
    musicMaster.connect(audioContext.destination);
    musicEnabled = true;
    musicBtnEl.classList.add("active");
    musicBtnEl.setAttribute("aria-pressed", "true");
    musicBtnEl.textContent = "🎵 Música ✓";
    playAmbientChord();
    musicTimer = window.setInterval(playAmbientChord, 6800);
  } catch {
    showToast("No fue posible activar la música en este navegador.");
  }
}

function playAmbientChord() {
  if (!musicEnabled || !audioContext || !musicMaster) return;
  const chords = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 440.00],
    [196.00, 246.94, 293.66, 392.00],
    [174.61, 220.00, 261.63, 349.23]
  ];
  const chord = chords[musicChordIndex % chords.length];
  musicChordIndex += 1;
  const now = audioContext.currentTime;
  chord.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency / (index === 0 ? 2 : 1), now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.018 : 0.010, now + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.4);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(musicMaster);
    oscillator.start(now);
    oscillator.stop(now + 6.5);
  });
}

function stopMusic() {
  musicEnabled = false;
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
  if (musicMaster && audioContext) {
    const now = audioContext.currentTime;
    musicMaster.gain.cancelScheduledValues(now);
    musicMaster.gain.setValueAtTime(Math.max(0.0001, musicMaster.gain.value), now);
    musicMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  }
  musicBtnEl.classList.remove("active");
  musicBtnEl.setAttribute("aria-pressed", "false");
  musicBtnEl.textContent = "🎵 Música";
}

function buildConstraintUnits() {
  const units = [];
  GRIDS.forEach(grid => {
    for (let i = 0; i < 9; i += 1) {
      const rowUnit = [];
      const colUnit = [];
      for (let j = 0; j < 9; j += 1) {
        rowUnit.push(keyOf(grid.row + i, grid.col + j));
        colUnit.push(keyOf(grid.row + j, grid.col + i));
      }
      units.push(rowUnit, colUnit);
    }
    for (let br = 0; br < 3; br += 1) {
      for (let bc = 0; bc < 3; bc += 1) {
        const box = [];
        for (let r = 0; r < 3; r += 1) {
          for (let c = 0; c < 3; c += 1) box.push(keyOf(grid.row + br * 3 + r, grid.col + bc * 3 + c));
        }
        units.push(box);
      }
    }
  });
  return units;
}

let SOLVER_UNITS = [];
let SOLVER_INDEX = new Map();
let SOLVER_UNIT_INDICES = [];
let SOLVER_CELL_UNITS = [];
const FULL_DIGIT_MASK = 0b1111111110;

function initSolverStructures() {
  SOLVER_UNITS = buildConstraintUnits();
  SOLVER_INDEX = new Map(shapeCells.map((key, index) => [key, index]));
  SOLVER_UNIT_INDICES = SOLVER_UNITS.map(unit => unit.map(key => SOLVER_INDEX.get(key)));
  SOLVER_CELL_UNITS = shapeCells.map(() => []);
  SOLVER_UNIT_INDICES.forEach((unit, unitIndex) => unit.forEach(index => SOLVER_CELL_UNITS[index].push(unitIndex)));
}

function bitCount(mask) {
  let count = 0;
  while (mask) {
    mask &= mask - 1;
    count += 1;
  }
  return count;
}

function solveSamudoku(givenMap, options = {}) {
  const maxSolutions = options.maxSolutions || 2;
  const deadline = performance.now() + (options.timeLimitMs || 2600);
  const maxNodes = options.maxNodes || 500000;
  const board = new Uint8Array(shapeCells.length);
  const unitMasks = new Uint16Array(SOLVER_UNIT_INDICES.length);
  let invalid = false;

  givenMap.forEach((value, key) => {
    const index = SOLVER_INDEX.get(key);
    if (index === undefined || value < 1 || value > 9 || invalid) return;
    const bit = 1 << value;
    for (const unitIndex of SOLVER_CELL_UNITS[index]) {
      if (unitMasks[unitIndex] & bit) {
        invalid = true;
        return;
      }
    }
    board[index] = value;
    for (const unitIndex of SOLVER_CELL_UNITS[index]) unitMasks[unitIndex] |= bit;
  });

  if (invalid) return { status: "invalid", solutions: 0, nodes: 0, guesses: 0, timedOut: false, firstSolution: null };

  let solutionsFound = 0;
  let nodes = 0;
  let guesses = 0;
  let maxDepth = 0;
  let timedOut = false;
  let firstSolutionArray = null;

  function search(depth) {
    if (solutionsFound >= maxSolutions || timedOut) return;
    nodes += 1;
    if (nodes > maxNodes || performance.now() > deadline) {
      timedOut = true;
      return;
    }
    maxDepth = Math.max(maxDepth, depth);

    let bestIndex = -1;
    let bestMask = 0;
    let bestCount = 10;

    for (let index = 0; index < board.length; index += 1) {
      if (board[index]) continue;
      let used = 0;
      for (const unitIndex of SOLVER_CELL_UNITS[index]) used |= unitMasks[unitIndex];
      const mask = FULL_DIGIT_MASK & ~used;
      const count = bitCount(mask);
      if (count === 0) return;
      if (count < bestCount) {
        bestCount = count;
        bestMask = mask;
        bestIndex = index;
        if (count === 1) break;
      }
    }

    if (bestIndex === -1) {
      solutionsFound += 1;
      if (!firstSolutionArray) firstSolutionArray = Uint8Array.from(board);
      return;
    }

    if (bestCount > 1) guesses += 1;
    let mask = bestMask;
    while (mask && solutionsFound < maxSolutions && !timedOut) {
      const bit = mask & -mask;
      const digit = Math.log2(bit) | 0;
      board[bestIndex] = digit;
      for (const unitIndex of SOLVER_CELL_UNITS[bestIndex]) unitMasks[unitIndex] |= bit;
      search(depth + 1);
      for (const unitIndex of SOLVER_CELL_UNITS[bestIndex]) unitMasks[unitIndex] &= ~bit;
      board[bestIndex] = 0;
      mask &= mask - 1;
    }
  }

  search(0);
  const firstSolution = firstSolutionArray ? new Map(shapeCells.map((key, index) => [key, firstSolutionArray[index]])) : null;
  return {
    status: timedOut ? "timeout" : solutionsFound === 0 ? "none" : solutionsFound === 1 ? "unique" : "multiple",
    solutions: solutionsFound,
    nodes,
    guesses,
    maxDepth,
    timedOut,
    firstSolution
  };
}

function estimateDifficulty(givensCount, analysis) {
  const empties = shapeCells.length - givensCount;
  const effort = Math.log10(Math.max(1, analysis.nodes || 1)) * 12 + Math.log10(Math.max(1, analysis.guesses || 1)) * 10;
  const score = empties * 0.34 + effort;
  if (score < 62) return "Fácil";
  if (score < 82) return "Medio";
  if (score < 103) return "Difícil";
  return "Experto";
}

function initCreatorBoard() {
  creatorBoardEl.innerHTML = "";
  shapeCells.forEach(key => {
    const [row, col] = coordsOf(key);
    const memberGrids = gridMemberships(row, col);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    if (memberGrids.length > 1) button.classList.add("shared");
    button.style.gridRow = String(row + 1);
    button.style.gridColumn = String(col + 1);
    const borders = borderThicknesses(row, col, memberGrids);
    button.style.borderTopWidth = `${borders.top}px`;
    button.style.borderRightWidth = `${borders.right}px`;
    button.style.borderBottomWidth = `${borders.bottom}px`;
    button.style.borderLeftWidth = `${borders.left}px`;
    button.addEventListener("click", () => toggleCreatorGiven(key));
    creatorCells.set(key, button);
    creatorBoardEl.appendChild(button);
  });
  generateCreatorDraft();
}

function creatorPresetPackIndex() {
  const id = creatorPresetEl.value;
  const index = PACKS.findIndex(pack => pack.id === id);
  return index >= 0 ? index : 1;
}

function generateCreatorDraft() {
  const packIndex = creatorPresetPackIndex();
  creatorSeedCounter += 1;
  const puzzleIndex = (Date.now() + creatorSeedCounter * 7) % 10;
  const draft = generatePuzzle(packIndex, puzzleIndex);
  creatorSolution = new Map(draft.solution);
  creatorGivens = new Set(draft.givens.keys());
  creatorValidationFresh = false;
  creatorLastAnalysis = null;
  renderCreatorBoard();
  resetCreatorValidation("Borrador listo. Puedes ocultar o recuperar pistas antes de analizarlo.");
}

function toggleCreatorGiven(key) {
  if (creatorGivens.has(key)) creatorGivens.delete(key);
  else creatorGivens.add(key);
  creatorValidationFresh = false;
  creatorLastAnalysis = null;
  renderCreatorBoard();
  resetCreatorValidation("Cambiaste las pistas. Vuelve a analizar antes de compartir.");
}

function renderCreatorBoard() {
  creatorBoardEl.classList.toggle("show-solution", creatorShowSolution);
  creatorCells.forEach((cell, key) => {
    cell.textContent = String(creatorSolution.get(key) || "");
    const isGiven = creatorGivens.has(key);
    cell.classList.toggle("creator-given", isGiven);
    cell.classList.toggle("creator-hidden", !isGiven);
  });
  creatorGivensCountEl.textContent = String(creatorGivens.size);
}

function toggleCreatorSolution() {
  creatorShowSolution = !creatorShowSolution;
  document.getElementById("creator-show-solution-btn").setAttribute("aria-pressed", String(creatorShowSolution));
  document.getElementById("creator-show-solution-btn").textContent = creatorShowSolution ? "🙈 Ocultar solución" : "👁 Mostrar solución";
  renderCreatorBoard();
}

function resetCreatorValidation(message) {
  creatorDifficultyEl.textContent = "Sin analizar";
  creatorValidationEl.className = "validation-box neutral";
  creatorValidationEl.textContent = message;
  creatorShareBtnEl.disabled = true;
  creatorPlayBtnEl.disabled = true;
  creatorCopyBtnEl.disabled = true;
}

function creatorGivenMap() {
  const map = new Map();
  creatorGivens.forEach(key => map.set(key, creatorSolution.get(key)));
  return map;
}

function analyzeCreatorPuzzle() {
  const givens = creatorGivenMap();
  creatorValidationEl.className = "validation-box neutral";
  creatorValidationEl.textContent = "Analizando solución y unicidad…";
  document.getElementById("creator-validate-btn").disabled = true;

  window.setTimeout(() => {
    const analysis = solveSamudoku(givens, { maxSolutions: 2, timeLimitMs: 3200, maxNodes: 650000 });
    creatorLastAnalysis = analysis;
    const difficulty = estimateDifficulty(givens.size, analysis);
    creatorDifficultyEl.textContent = `${difficulty} (estimada)`;
    document.getElementById("creator-validate-btn").disabled = false;

    if (analysis.status === "invalid" || analysis.status === "none") {
      creatorValidationEl.className = "validation-box bad";
      creatorValidationEl.textContent = "Este desafío no tiene una solución válida.";
      creatorValidationFresh = true;
      return;
    }

    if (analysis.status === "timeout") {
      creatorValidationEl.className = analysis.solutions >= 1 ? "validation-box warn" : "validation-box bad";
      creatorValidationEl.textContent = analysis.solutions >= 1
        ? "Encontré una solución, pero el análisis no alcanzó a certificar que sea única. Agrega algunas pistas y vuelve a probar."
        : "El análisis es demasiado complejo para certificarlo en el navegador. Agrega más pistas y vuelve a probar.";
      creatorValidationFresh = true;
      creatorPlayBtnEl.disabled = analysis.solutions < 1;
      return;
    }

    if (analysis.status === "multiple") {
      creatorValidationEl.className = "validation-box warn";
      creatorValidationEl.textContent = "Es resoluble, pero tiene más de una solución. Agrega pistas antes de compartirlo como desafío Sudoku.";
      creatorValidationFresh = true;
      creatorPlayBtnEl.disabled = false;
      return;
    }

    creatorValidationEl.className = "validation-box good";
    creatorValidationEl.textContent = `✓ Resoluble y con solución única. Dificultad ${difficulty.toLowerCase()} estimada. Nodos de análisis: ${analysis.nodes.toLocaleString("es-CL")}.`;
    creatorValidationFresh = true;
    creatorShareBtnEl.disabled = false;
    creatorPlayBtnEl.disabled = false;
    creatorCopyBtnEl.disabled = false;
  }, 30);
}

function encodeChallenge(givenMap) {
  const raw = shapeCells.map(key => String(givenMap.get(key) || 0)).join("");
  return btoa(raw).replace(/=+$/g, "");
}

function decodeChallenge(encoded) {
  try {
    const padded = encoded + "=".repeat((4 - encoded.length % 4) % 4);
    const raw = atob(padded);
    if (raw.length !== shapeCells.length || !/^[0-9]+$/.test(raw)) return null;
    const givens = new Map();
    [...raw].forEach((char, index) => {
      const value = Number(char);
      if (value) givens.set(shapeCells[index], value);
    });
    return givens;
  } catch {
    return null;
  }
}

function creatorChallengeUrl() {
  const encoded = encodeChallenge(creatorGivenMap());
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#challenge=${encoded}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  }
}

async function copyCreatorChallengeLink() {
  if (!creatorValidationFresh || creatorLastAnalysis?.status !== "unique") return;
  const ok = await copyText(creatorChallengeUrl());
  showToast(ok ? "Enlace del desafío copiado." : "No pude copiar el enlace automáticamente.");
}

async function shareCreatorChallenge() {
  if (!creatorValidationFresh || creatorLastAnalysis?.status !== "unique") return;
  const url = creatorChallengeUrl();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Desafío Samudoku", text: "Te desafío a resolver este Samudoku Samurai.", url });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  const ok = await copyText(url);
  showToast(ok ? "Enlace copiado. Ya puedes enviarlo." : "No pude copiar el enlace automáticamente.");
}

function openCreator() {
  creatorSectionEl.classList.remove("hidden");
  creatorSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCreator() {
  creatorSectionEl.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function loadCustomPuzzle(givenMap, solvedMap, id) {
  saveGameState();
  customChallengeMode = true;
  customChallengeId = id;
  currentPuzzle = { id: `custom-${id}`, solution: new Map(solvedMap), givens: new Map(givenMap) };
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
  selectedNumber = null;
  focusMode = "all";
  startTime = Date.now();
  usedHints = 0;
  hadError = false;
  alreadyWonThisSession = false;
  loadGameState();
  initializeCompletedSubgrids();
  challengeBannerEl.classList.remove("hidden");
  updateCurrentLabels();
  setFocus("all");
  renderValues();
  renderLevelControls();
  renderProfile();
  startTimer();
  modalEl.classList.add("hidden");
  closeCreator();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function playCreatorChallenge() {
  if (!creatorValidationFresh || !creatorLastAnalysis?.firstSolution) return;
  const givenMap = creatorGivenMap();
  const id = hashString(encodeChallenge(givenMap));
  loadCustomPuzzle(givenMap, creatorLastAnalysis.firstSolution, id);
}

function loadChallengeFromHash() {
  const match = window.location.hash.match(/^#challenge=([A-Za-z0-9+/]+)$/);
  if (!match) return false;
  const givenMap = decodeChallenge(match[1]);
  if (!givenMap) {
    showToast("El enlace del desafío no es válido.");
    return false;
  }
  const analysis = solveSamudoku(givenMap, { maxSolutions: 2, timeLimitMs: 3600, maxNodes: 750000 });
  if (!analysis.firstSolution) {
    showToast("No pude abrir este desafío: no se encontró una solución válida.");
    return false;
  }
  if (analysis.status !== "unique") {
    showToast(analysis.status === "multiple"
      ? "Este desafío tiene varias soluciones y no puede abrirse como Samudoku válido."
      : "No pude certificar una solución única para este desafío.");
    return false;
  }
  const id = hashString(match[1]);
  loadCustomPuzzle(givenMap, analysis.firstSolution, id);
  return true;
}

function leaveCustomChallenge() {
  if (!customChallengeMode) return;
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  customChallengeMode = false;
  customChallengeId = null;
  challengeBannerEl.classList.add("hidden");
  loadCurrentPuzzle();
}
parseBaseBoards();
initSolverStructures();
createBoard();
createNumberPad();
createLevelControls();
initCreatorBoard();

if (!loadChallengeFromHash()) loadCurrentPuzzle();

document.getElementById("erase-btn").addEventListener("click", eraseSelected);
document.getElementById("check-btn").addEventListener("click", validateBoard);
document.getElementById("hint-btn").addEventListener("click", giveHint);
document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("next-level-btn").addEventListener("click", goToNextPuzzle);
document.getElementById("close-modal-btn").addEventListener("click", () => {
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
});
document.getElementById("clear-number-highlight").addEventListener("click", () => {
  selectedNumber = null;
  renderNumberPadState();
  renderHighlights();
});
document.getElementById("open-creator-btn").addEventListener("click", openCreator);
document.getElementById("close-creator-btn").addEventListener("click", closeCreator);
document.getElementById("creator-randomize-btn").addEventListener("click", generateCreatorDraft);
document.getElementById("creator-show-solution-btn").addEventListener("click", toggleCreatorSolution);
document.getElementById("creator-validate-btn").addEventListener("click", analyzeCreatorPuzzle);
document.getElementById("creator-share-btn").addEventListener("click", shareCreatorChallenge);
document.getElementById("creator-copy-btn").addEventListener("click", copyCreatorChallengeLink);
document.getElementById("creator-play-btn").addEventListener("click", playCreatorChallenge);
document.getElementById("leave-challenge-btn").addEventListener("click", leaveCustomChallenge);
musicBtnEl.addEventListener("click", toggleMusic);
document.querySelectorAll(".zoom-btn").forEach(button => button.addEventListener("click", () => setFocus(button.dataset.focus)));
document.addEventListener("keydown", handleKeyboard);
window.addEventListener("beforeunload", () => {
  saveGameState();
  saveProfile();
});
