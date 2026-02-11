const q1El = document.getElementById("q1");
const q2El = document.getElementById("q2");
const a1El = document.getElementById("a1");
const a2El = document.getElementById("a2");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const timerEl = document.getElementById("timer");
const knotEl = document.getElementById("knot");
const winnerEl = document.getElementById("winner");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const overlay = document.getElementById("countdownOverlay");
const overlayText = document.getElementById("countdownText");
const teamLeftEl = document.getElementById("teamLeft");
const teamRightEl = document.getElementById("teamRight");

const answerFields = {
  1: a1El,
  2: a2El,
};

const keypadBuffers = {
  1: "",
  2: "",
};

let score1 = 0,
  score2 = 0;
let tug = 0;
let gameStarted = false;
let timerInterval;
let currentAnswer1 = 0,
  currentAnswer2 = 0;

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function refreshAnswerField(team) {
  answerFields[team].value = keypadBuffers[team];
}

function clearBuffers() {
  keypadBuffers[1] = "";
  keypadBuffers[2] = "";
  refreshAnswerField(1);
  refreshAnswerField(2);
}

function newRound() {
  if (!gameStarted) return;

  let a = randomInt(20),
    b = randomInt(20);
  let c = randomInt(20),
    d = randomInt(20);

  currentAnswer1 = a + b;
  currentAnswer2 = c + d;

  q1El.textContent = `${a} + ${b} = ?`;
  q2El.textContent = `${c} + ${d} = ?`;

  clearBuffers();
}

function getWinnerText() {
  if (score1 > score2) {
    return "🏆 Team 1 gagne avec le plus de points !";
  }

  if (score2 > score1) {
    return "🏆 Team 2 gagne avec le plus de points !";
  }

  return "🤝 Égalité parfaite !";
}

function endGame() {
  gameStarted = false;
  clearInterval(timerInterval);
  winnerEl.textContent = getWinnerText();
  updatePullersState();
}

function startTimer() {
  clearInterval(timerInterval);
  let time = parseInt(document.getElementById("roundSeconds").value, 10);
  timerEl.textContent = time;

  timerInterval = setInterval(() => {
    if (!gameStarted) return;

    time--;
    timerEl.textContent = time;
    if (time <= 0) {
      endGame();
    }
  }, 1000);
}

function updateRope() {
  let pos = 50 + tug * 8;
  pos = Math.max(10, Math.min(90, pos));
  knotEl.style.left = pos + "%";
  updatePullersState();
}

function updateTeamProgress() {
  if (!teamLeftEl || !teamRightEl) return;

  const maxProgress = 68;
  const scoreStep = 4;
  const tugShift = Math.max(-18, Math.min(18, tug * 3));
  const leftProgress = Math.min(maxProgress, score1 * scoreStep);
  const rightProgress = Math.min(maxProgress, score2 * scoreStep);

  teamLeftEl.style.transform = `translateX(${leftProgress + tugShift}px)`;
  teamRightEl.style.transform = `translateX(${-rightProgress + tugShift}px)`;

  teamLeftEl.classList.toggle("winning", tug < 0);
  teamRightEl.classList.toggle("winning", tug > 0);
  teamLeftEl.classList.toggle("is-pulling", gameStarted);
  teamRightEl.classList.toggle("is-pulling", gameStarted);
}

function updatePullersState() {
  updateTeamProgress();
}

function checkAnswer(team, value) {
  if (!gameStarted || Number.isNaN(value)) return;

  if (team === 1 && value === currentAnswer1) {
    score1++;
    tug--;
  }
  if (team === 2 && value === currentAnswer2) {
    score2++;
    tug++;
  }

  score1El.textContent = score1;
  score2El.textContent = score2;

  updateRope();
  newRound();
}

function handleKeypadPress(team, key) {
  if (!gameStarted) return;

  if (key === "DEL") {
    keypadBuffers[team] = keypadBuffers[team].slice(0, -1);
    refreshAnswerField(team);
    return;
  }

  if (key === "OK") {
    submitBufferedAnswer(team);
    return;
  }

  keypadBuffers[team] += key;
  refreshAnswerField(team);

  const bufferedValue = parseInt(keypadBuffers[team], 10);
  const expectedAnswer = team === 1 ? currentAnswer1 : currentAnswer2;

  if (bufferedValue === expectedAnswer) {
    submitBufferedAnswer(team);
  }
}

function submitBufferedAnswer(team) {
  checkAnswer(team, parseInt(keypadBuffers[team], 10));
  keypadBuffers[team] = "";
  refreshAnswerField(team);
}

function bindTap(btn, handler) {
  let touchHandled = false;

  btn.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      touchHandled = true;
      handler();
      setTimeout(() => {
        touchHandled = false;
      }, 300);
    },
    { passive: false }
  );

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    if (touchHandled) return;
    handler();
  });
}

function buildKeypads() {
  document.querySelectorAll(".keypad").forEach((kp) => {
    const team = parseInt(kp.dataset.team, 10);

    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "DEL", "OK"].forEach(
      (key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = key;
        bindTap(btn, () => handleKeypadPress(team, key));
        kp.appendChild(btn);
      }
    );
  });
}

async function countdown() {
  overlay.classList.add("show");
  for (let txt of ["3", "2", "1", "GO!"]) {
    overlayText.textContent = txt;
    overlayText.style.animation = "none";
    void overlayText.offsetWidth;
    overlayText.style.animation = "pop 0.7s";
    await new Promise((r) => setTimeout(r, 700));
  }
  overlay.classList.remove("show");
}

startBtn.onclick = async () => {
  if (gameStarted) return;
  await countdown();
  score1 = 0;
  score2 = 0;
  tug = 0;
  score1El.textContent = 0;
  score2El.textContent = 0;
  winnerEl.textContent = "";
  updateRope();
  gameStarted = true;
  updatePullersState();
  newRound();

  if (document.getElementById("timedMode").checked) {
    startTimer();
  }
};

resetBtn.onclick = () => {
  gameStarted = false;
  clearInterval(timerInterval);
  score1 = 0;
  score2 = 0;
  tug = 0;
  score1El.textContent = 0;
  score2El.textContent = 0;
  timerEl.textContent = document.getElementById("roundSeconds").value;
  winnerEl.textContent = "";
  clearBuffers();
  updateRope();
  updatePullersState();
};

buildKeypads();
clearBuffers();
updateRope();
timerEl.textContent = document.getElementById("roundSeconds").value;
updatePullersState();
