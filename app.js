const q1El = document.getElementById("q1");
const q2El = document.getElementById("q2");
const a1El = document.getElementById("a1");
const a2El = document.getElementById("a2");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const timerEl = document.getElementById("timer");
const winnerEl = document.getElementById("winner");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const overlay = document.getElementById("countdownOverlay");
const overlayText = document.getElementById("countdownText");
const tugStageEl = document.getElementById("tugStage");
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

const PLAYERS_PER_TEAM = 2;
const CENTER_GAP_PADDING_PX = 12;
const SIDE_CASCADE_SPACING_PX = 30;
const PLAYER_WIDTH_FALLBACK_PX = 80;

function buildTeamPlayers(playerClass) {
  return Array.from({ length: PLAYERS_PER_TEAM }, (_, index) => {
    const classes = ["tugPlayer", playerClass];

    return `<div class="${classes.join(" ")}"></div>`;
  }).join("");
}

function getPlayerCenterX(playerEl) {
  const rect = playerEl.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

function setPlayerShift(playerEl, deltaX) {
  const currentShift = Number.parseFloat(playerEl.dataset.shiftX || "0");
  const nextShift = currentShift + deltaX;
  playerEl.dataset.shiftX = `${nextShift}`;
  playerEl.style.setProperty("--playerShiftX", `${nextShift}px`);
}

function resetPlayerShifts(players) {
  players.forEach((playerEl) => {
    playerEl.dataset.shiftX = "0";
    playerEl.style.setProperty("--playerShiftX", "0px");
  });
}

function resolveCenterPlayerGap() {
  if (!tugStageEl || !teamLeftEl || !teamRightEl) return;

  const redPlayers = Array.from(teamLeftEl.querySelectorAll(".tugRed"));
  const bluePlayers = Array.from(teamRightEl.querySelectorAll(".tugBlue"));
  const allPlayers = [...redPlayers, ...bluePlayers];

  if (!redPlayers.length || !bluePlayers.length) return;

  resetPlayerShifts(allPlayers);

  const stageRect = tugStageEl.getBoundingClientRect();
  const centerX = stageRect.left + stageRect.width / 2;

  const redClosest = redPlayers
    .filter((playerEl) => getPlayerCenterX(playerEl) < centerX)
    .sort((a, b) => Math.abs(getPlayerCenterX(a) - centerX) - Math.abs(getPlayerCenterX(b) - centerX))[0];
  const blueClosest = bluePlayers
    .filter((playerEl) => getPlayerCenterX(playerEl) > centerX)
    .sort((a, b) => Math.abs(getPlayerCenterX(a) - centerX) - Math.abs(getPlayerCenterX(b) - centerX))[0];

  if (!redClosest || !blueClosest) return;

  const redWidth = redClosest.getBoundingClientRect().width || PLAYER_WIDTH_FALLBACK_PX;
  const blueWidth = blueClosest.getBoundingClientRect().width || PLAYER_WIDTH_FALLBACK_PX;

  // minGapPx keeps red/blue closest players' bounding boxes separated around the center line.
  const minGapPx = redWidth / 2 + blueWidth / 2 + CENTER_GAP_PADDING_PX;

  const redCenterX = getPlayerCenterX(redClosest);
  const blueCenterX = getPlayerCenterX(blueClosest);
  const redTargetX = Math.min(redCenterX, centerX - minGapPx / 2);
  const blueTargetX = Math.max(blueCenterX, centerX + minGapPx / 2);

  setPlayerShift(redClosest, redTargetX - redCenterX);
  setPlayerShift(blueClosest, blueTargetX - blueCenterX);

  const redOrdered = [...redPlayers].sort((a, b) => getPlayerCenterX(b) - getPlayerCenterX(a));
  for (let i = 0; i < redOrdered.length - 1; i++) {
    const nearCenter = redOrdered[i].getBoundingClientRect();
    const fartherLeftPlayer = redOrdered[i + 1];
    const fartherLeftRect = fartherLeftPlayer.getBoundingClientRect();
    const gap = nearCenter.left - fartherLeftRect.right;
    if (gap < SIDE_CASCADE_SPACING_PX) {
      setPlayerShift(fartherLeftPlayer, -(SIDE_CASCADE_SPACING_PX - gap));
    }
  }

  const blueOrdered = [...bluePlayers].sort((a, b) => getPlayerCenterX(a) - getPlayerCenterX(b));
  for (let i = 0; i < blueOrdered.length - 1; i++) {
    const nearCenter = blueOrdered[i].getBoundingClientRect();
    const fartherRightPlayer = blueOrdered[i + 1];
    const fartherRightRect = fartherRightPlayer.getBoundingClientRect();
    const gap = fartherRightRect.left - nearCenter.right;
    if (gap < SIDE_CASCADE_SPACING_PX) {
      setPlayerShift(fartherRightPlayer, SIDE_CASCADE_SPACING_PX - gap);
    }
  }

  redPlayers.forEach((playerEl) => {
    const center = getPlayerCenterX(playerEl);
    if (center >= centerX) {
      setPlayerShift(playerEl, -(center - centerX + 1));
    }
  });

  bluePlayers.forEach((playerEl) => {
    const center = getPlayerCenterX(playerEl);
    if (center <= centerX) {
      setPlayerShift(playerEl, centerX - center + 1);
    }
  });

  const redRect = redClosest.getBoundingClientRect();
  const blueRect = blueClosest.getBoundingClientRect();
  const noOverlap = redRect.right <= blueRect.left;
  console.info("[tug-layout] center pair check", {
    centerX,
    minGapPx,
    red: { left: redRect.left, right: redRect.right },
    blue: { left: blueRect.left, right: blueRect.right },
    noOverlap,
  });
}

function enforceTeamComposition() {
  if (!teamLeftEl || !teamRightEl) return;

  teamLeftEl.innerHTML = buildTeamPlayers("tugRed");
  teamRightEl.innerHTML = buildTeamPlayers("tugBlue");
  resolveCenterPlayerGap();
}

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

function renderTug(offsetPx) {
  if (!tugStageEl) return;
  tugStageEl.style.setProperty("--gameX", `${offsetPx}px`);
}

function updateRope() {
  const tugOffset = Math.max(-72, Math.min(72, tug * 8));
  renderTug(tugOffset);
  updatePullersState();
}

function updateTeamProgress() {
  if (!teamLeftEl || !teamRightEl) return;

  teamLeftEl.classList.toggle("winning", tug < 0);
  teamRightEl.classList.toggle("winning", tug > 0);
}

function updatePullersState() {
  updateTeamProgress();
  resolveCenterPlayerGap();
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
  enforceTeamComposition();
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
  enforceTeamComposition();
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

enforceTeamComposition();
buildKeypads();
clearBuffers();
renderTug(0);
timerEl.textContent = document.getElementById("roundSeconds").value;
updatePullersState();

window.addEventListener("resize", resolveCenterPlayerGap);
