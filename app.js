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
const resetBtn = document.getElementById("resetBtn");

let score1 = 0, score2 = 0;
let tug = 0; // -N = vers Team 1, +N = vers Team 2
const WIN_AT = 5;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newQuestion() {
  // difficulté simple: addition 0..20
  const a = randInt(0, 20), b = randInt(0, 20);
  const c = randInt(0, 20), d = randInt(0, 20);
  state.q1 = { a, b, op: "+", ans: a + b };
  state.q2 = { a: c, b: d, op: "+", ans: c + d };
  q1El.textContent = `${a} + ${b} = ?`;
  q2El.textContent = `${c} + ${d} = ?`;
  m1El.textContent = "";
  m2El.textContent = "";
  a1El.value = "";
  a2El.value = "";
  a1El.focus();
}

function updateUI() {
  score1El.textContent = score1;
  score2El.textContent = score2;

  // position du marker: 50% + tug*8% (capé)
  const x = Math.max(10, Math.min(90, 50 + tug * 8));
  markerEl.style.left = `${x}%`;

  if (tug <= -WIN_AT) winnerEl.textContent = "🏆 Team 1 gagne !";
  else if (tug >= WIN_AT) winnerEl.textContent = "🏆 Team 2 gagne !";
  else winnerEl.textContent = "";
}

function isGameOver() {
  return tug <= -WIN_AT || tug >= WIN_AT;
}

const state = { q1: null, q2: null };

function check(team) {
  if (isGameOver()) return;

  if (team === 1) {
    const v = Number(a1El.value);
    if (Number.isFinite(v) && v === state.q1.ans) {
      m1El.textContent = "✅ Correct !";
      score1 += 1;
      tug -= 1; // Team 1 tire vers la gauche
      updateUI();
      if (!isGameOver()) newQuestion();
    } else {
      m1El.textContent = "❌ Faux";
      a1El.select();
    }
  }

  if (team === 2) {
    const v = Number(a2El.value);
    if (Number.isFinite(v) && v === state.q2.ans) {
      m2El.textContent = "✅ Correct !";
      score2 += 1;
      tug += 1; // Team 2 tire vers la droite
      updateUI();
      if (!isGameOver()) newQuestion();
    } else {
      m2El.textContent = "❌ Faux";
      a2El.select();
    }
  }
}

document.getElementById("ok1").addEventListener("click", () => check(1));
document.getElementById("ok2").addEventListener("click", () => check(2));

a1El.addEventListener("keydown", (e) => { if (e.key === "Enter") check(1); });
a2El.addEventListener("keydown", (e) => { if (e.key === "Enter") check(2); });

resetBtn.addEventListener("click", () => {
  score1 = 0; score2 = 0; tug = 0;
  updateUI();
  newQuestion();
});

updateUI();
newQuestion();
