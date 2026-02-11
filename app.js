const q1El = document.getElementById("q1");
const q2El = document.getElementById("q2");
const a1El = document.getElementById("a1");
const a2El = document.getElementById("a2");
const m1El = document.getElementById("m1");
const m2El = document.getElementById("m2");
const markerEl = document.getElementById("marker");
const winnerEl = document.getElementById("winner");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const streak1El = document.getElementById("streak1");
const streak2El = document.getElementById("streak2");
const levelEl = document.getElementById("level");
const resetBtn = document.getElementById("resetBtn");
const timerEl = document.getElementById("timer");

let score1 = 0, score2 = 0;
let streak1 = 0, streak2 = 0;

// tug: - vers Team 1 (gauche), + vers Team 2 (droite)
let tug = 0;
const WIN_AT = 6;

// difficulté progressive
let level = 1;          // augmente avec les bonnes réponses
let totalCorrect = 0;   // compteur global

const state = { q1: null, q2: null };

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Probabilité de soustraction augmente avec le niveau (max 60%)
function subtractionChance() {
  return Math.min(0.60, 0.10 + (level - 1) * 0.07);
}

// Plafond des nombres augmente progressivement
function maxNumber() {
  // niveaux 1.. : 10, 15, 20, 30, 40, 60, 80...
  const steps = [10, 15, 20, 30, 40, 60, 80, 100, 150, 200];
  return steps[Math.min(level - 1, steps.length - 1)];
}

function makeProblem() {
  const max = maxNumber();
  const useSub = Math.random() < subtractionChance();

  if (!useSub) {
    const a = randInt(0, max);
    const b = randInt(0, max);
    return { a, b, op: "+", ans: a + b };
  }

  // soustraction sans négatif: a >= b
  let a = randInt(0, max);
  let b = randInt(0, max);
  if (b > a) [a, b] = [b, a];
  return { a, b, op: "-", ans: a - b };
}

function renderQuestions() {
  q1El.textContent = `${state.q1.a} ${state.q1.op} ${state.q1.b} = ?`;
  q2El.textContent = `${state.q2.a} ${state.q2.op} ${state.q2.b} = ?`;
}

function newRound() {
  state.q1 = makeProblem();
  state.q2 = makeProblem();

  m1El.textContent = "";
  m2El.textContent = "";
  m1El.className = "msg";
  m2El.className = "msg";

  a1El.value = "";
  a2El.value = "";
  renderQuestions();
  a1El.focus();
}

function updateLevel() {
  // +1 niveau toutes les 6 bonnes réponses au total
  level = 1 + Math.floor(totalCorrect / 6);
  levelEl.textContent = level;
}

function updateUI() {
  score1El.textContent = score1;
  score2El.textContent = score2;
  streak1El.textContent = streak1;
  streak2El.textContent = streak2;
  updateLevel();

  // Marker: 50% + tug * 7% (capé)
  const x = Math.max(8, Math.min(92, 50 + tug * 7));
  markerEl.style.left = `${x}%`;

  if (tug <= -WIN_AT) winnerEl.textContent = "🏆 Team 1 gagne !";
  else if (tug >= WIN_AT) winnerEl.textContent = "🏆 Team 2 gagne !";
  else winnerEl.textContent = "";
}

function isGameOver() {
  return tug <= -WIN_AT || tug >= WIN_AT;
}

function goodMsg(el, text) {
  el.textContent = text;
  el.className = "msg good";
}
function badMsg(el, text) {
  el.textContent = text;
  el.className = "msg bad";
}

function check(team) {
  if (isGameOver()) return;

  if (team === 1) {
    const v = Number(a1El.value);
    if (Number.isFinite(v) && v === state.q1.ans) {
      goodMsg(m1El, "✅ Correct !");
      score1 += 1;
      streak1 += 1;
      streak2 = 0;
      tug -= 1;
      totalCorrect += 1;
      updateUI();
      if (!isGameOver()) newRound();
    } else {
      badMsg(m1El, "❌ Faux");
      streak1 = 0;
      updateUI();
      a1El.select();
    }
  }

  if (team === 2) {
    const v = Number(a2El.value);
    if (Number.isFinite(v) && v === state.q2.ans) {
      goodMsg(m2El, "✅ Correct !");
      score2 += 1;
      streak2 += 1;
      streak1 = 0;
      tug += 1;
      totalCorrect += 1;
      updateUI();
      if (!isGameOver()) newRound();
    } else {
      badMsg(m2El, "❌ Faux");
      streak2 = 0;
      updateUI();
      a2El.select();
    }
  }
}

// ------------------------
// Pavé numérique tactile
// ------------------------
function buildKeypad(container, team) {
  const keys = [
    "1","2","3",
    "4","5","6",
    "7","8","9",
    "CLR","0","DEL",
    "OK"
  ];

  // keypad en 3 colonnes: on met OK sur toute la largeur
  container.innerHTML = "";
  keys.forEach(k => {
    const btn = document.createElement("button");
    btn.textContent = k;

    if (k === "OK") {
      btn.classList.add("action", "ok");
      btn.style.gridColumn = "1 / -1";
    } else if (k === "DEL") {
      btn.classList.add("action", "del");
    } else if (k === "CLR") {
      btn.classList.add("action", "clr");
    }

    btn.addEventListener("click", () => {
      const input = team === 1 ? a1El : a2El;
      if (isGameOver()) return;

