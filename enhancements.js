// Samudoku UX enhancements: candidate notes + always-visible mobile keypad.
// Kept separate from app.js so the puzzle engine and its validation tests remain untouched.

const enhancementStyles = document.createElement("link");
enhancementStyles.rel = "stylesheet";
enhancementStyles.href = "enhancements.css";
document.head.appendChild(enhancementStyles);

const candidateNotes = new Map();
let noteMode = false;

const desktopNoteBtn = document.getElementById("note-mode-btn");
const mobileNoteBtn = document.getElementById("mobile-note-mode-btn");
const mobileModeLabel = document.getElementById("mobile-mode-label");
const mobileNumberPad = document.getElementById("mobile-number-pad");
const zoomDependencyNote = document.getElementById("zoom-dependency-note");

function notesStorageKey() {
  return currentPuzzle ? `samudoku-notes-v1-${currentPuzzle.id}` : null;
}

function saveCandidateNotes() {
  const key = notesStorageKey();
  if (!key) return;
  const payload = {};
  candidateNotes.forEach((set, cellKey) => {
    if (set.size && !values.has(cellKey) && !isLocked(cellKey)) payload[cellKey] = [...set].sort((a, b) => a - b);
  });
  localStorage.setItem(key, JSON.stringify(payload));
}

function loadCandidateNotes() {
  candidateNotes.clear();
  const key = notesStorageKey();
  if (!key) return;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    Object.entries(parsed).forEach(([cellKey, nums]) => {
      if (!solution.has(cellKey) || values.has(cellKey) || isLocked(cellKey) || !Array.isArray(nums)) return;
      const valid = nums.filter(n => Number.isInteger(n) && n >= 1 && n <= 9);
      if (valid.length) candidateNotes.set(cellKey, new Set(valid));
    });
  } catch {
    localStorage.removeItem(key);
  }
}

function pruneCandidateNotes() {
  let changed = false;
  [...candidateNotes.keys()].forEach(key => {
    if (values.has(key) || isLocked(key) || !solution.has(key)) {
      candidateNotes.delete(key);
      changed = true;
    }
  });
  if (changed) saveCandidateNotes();
}

function noteMarkup(numbers) {
  const slots = [];
  for (let n = 1; n <= 9; n += 1) slots.push(`<span class="candidate-slot">${numbers.has(n) ? n : ""}</span>`);
  return `<span class="candidate-grid" aria-label="Notas: ${[...numbers].sort().join(", ")}">${slots.join("")}</span>`;
}

function renderCandidateNotes() {
  pruneCandidateNotes();
  cells.forEach((cell, key) => {
    const notes = candidateNotes.get(key);
    cell.classList.toggle("has-notes", Boolean(notes?.size) && !values.has(key));
    if (!values.has(key) && notes?.size) cell.innerHTML = noteMarkup(notes);
  });
}

const baseRenderValues = renderValues;
renderValues = function renderValuesWithNotes() {
  baseRenderValues();
  renderCandidateNotes();
  syncInputModeUI();
};

function toggleCandidate(key, number) {
  if (!key || isLocked(key) || values.has(key)) return;
  const set = candidateNotes.get(key) || new Set();
  if (set.has(number)) set.delete(number); else set.add(number);
  if (set.size) candidateNotes.set(key, set); else candidateNotes.delete(key);
  selectedNumber = number;
  saveCandidateNotes();
  renderValues();
}

const baseEnterNumber = enterNumber;
enterNumber = function enterNumberWithNotes(number) {
  if (noteMode) {
    selectedNumber = number;
    renderNumberPadState();
    if (!selectedKey || isLocked(selectedKey)) { renderHighlights(); return; }
    if (values.has(selectedKey)) { showToast("Borra el número definitivo antes de agregar notas."); return; }
    toggleCandidate(selectedKey, number);
    return;
  }
  if (selectedKey) candidateNotes.delete(selectedKey);
  baseEnterNumber(number);
  saveCandidateNotes();
};

const baseEraseSelected = eraseSelected;
eraseSelected = function eraseSelectedWithNotes() {
  if (!selectedKey || isLocked(selectedKey)) return;
  if (!values.has(selectedKey) && candidateNotes.has(selectedKey)) {
    candidateNotes.delete(selectedKey);
    saveCandidateNotes();
    renderValues();
    showToast("Notas borradas.");
    return;
  }
  baseEraseSelected();
};

const baseGiveHint = giveHint;
giveHint = function giveHintWithoutStaleNotes() {
  baseGiveHint();
  pruneCandidateNotes();
  renderCandidateNotes();
};

function setNoteMode(enabled) {
  noteMode = Boolean(enabled);
  syncInputModeUI();
  if (noteMode) showToast("Modo notas: toca varios números para marcar candidatos.");
}

function syncInputModeUI() {
  [desktopNoteBtn, mobileNoteBtn].filter(Boolean).forEach(btn => {
    btn.classList.toggle("active", noteMode);
    btn.setAttribute("aria-pressed", String(noteMode));
  });
  if (mobileModeLabel) mobileModeLabel.textContent = noteMode ? "Notas · candidatos" : "Número definitivo";
  document.body.classList.toggle("note-mode", noteMode);
  document.querySelectorAll(".num-btn, .mobile-num-btn").forEach(button => button.classList.toggle("active", Number(button.dataset.number) === selectedNumber));
}

function createMobileNumberPad() {
  if (!mobileNumberPad) return;
  mobileNumberPad.innerHTML = "";
  for (let number = 1; number <= 9; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-num-btn";
    button.dataset.number = String(number);
    button.textContent = String(number);
    button.setAttribute("aria-label", `Escribir ${number}`);
    button.addEventListener("click", () => {
      selectedNumber = number;
      enterNumber(number);
      syncInputModeUI();
    });
    mobileNumberPad.appendChild(button);
  }
}

numberPadEl.addEventListener("click", event => {
  const button = event.target.closest(".num-btn");
  if (!button || !noteMode) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const number = Number(button.dataset.number);
  selectedNumber = number;
  enterNumber(number);
}, true);

desktopNoteBtn?.addEventListener("click", () => setNoteMode(!noteMode));
mobileNoteBtn?.addEventListener("click", () => setNoteMode(!noteMode));
document.getElementById("mobile-erase-btn")?.addEventListener("click", eraseSelected);

document.getElementById("erase-btn")?.addEventListener("click", event => {
  if (!selectedKey || values.has(selectedKey) || !candidateNotes.has(selectedKey)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  eraseSelected();
}, true);

document.getElementById("reset-btn")?.addEventListener("click", () => {
  candidateNotes.clear();
  const key = notesStorageKey();
  if (key) localStorage.removeItem(key);
  window.setTimeout(renderCandidateNotes, 0);
}, true);

const baseLoadCurrentPuzzle = loadCurrentPuzzle;
loadCurrentPuzzle = function loadCurrentPuzzleWithNotes() {
  baseLoadCurrentPuzzle();
  loadCandidateNotes();
  renderCandidateNotes();
};

const baseLoadCustomPuzzle = loadCustomPuzzle;
loadCustomPuzzle = function loadCustomPuzzleWithNotes(givenMap, solvedMap, id) {
  baseLoadCustomPuzzle(givenMap, solvedMap, id);
  loadCandidateNotes();
  renderCandidateNotes();
};

loadCandidateNotes();
createMobileNumberPad();
renderCandidateNotes();
syncInputModeUI();

const baseSetFocus = setFocus;
setFocus = function setFocusWithDependencyNote(mode) {
  baseSetFocus(mode);
  zoomDependencyNote?.classList.toggle("hidden", mode === "all");
};

document.querySelectorAll(".zoom-btn").forEach(button => button.addEventListener("click", () => zoomDependencyNote?.classList.toggle("hidden", button.dataset.focus === "all")));
window.addEventListener("beforeunload", saveCandidateNotes);
