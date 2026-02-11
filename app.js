const q1El = document.getElementById("q1");
const q2El = document.getElementById("q2");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const timerEl = document.getElementById("timer");
const knotEl = document.getElementById("knot");
const winnerEl = document.getElementById("winner");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const overlay = document.getElementById("countdownOverlay");
const overlayText = document.getElementById("countdownText");

let score1=0, score2=0;
let tug=0;
let gameStarted=false;
let timerInterval;
let currentAnswer1=0, currentAnswer2=0;

function randomInt(max){ return Math.floor(Math.random()*max); }

function newRound(){
  let a=randomInt(20), b=randomInt(20);
  let c=randomInt(20), d=randomInt(20);

  currentAnswer1=a+b;
  currentAnswer2=c+d;

  q1El.textContent=`${a} + ${b} = ?`;
  q2El.textContent=`${c} + ${d} = ?`;

  if(document.getElementById("timedMode").checked){
    startTimer();
  }
}

function startTimer(){
  clearInterval(timerInterval);
  let time=parseInt(document.getElementById("roundSeconds").value);
  timerEl.textContent=time;

  timerInterval=setInterval(()=>{
    time--;
    timerEl.textContent=time;
    if(time<=0){
      clearInterval(timerInterval);
      newRound();
    }
  },1000);
}

function updateRope(){
  let pos=50+(tug*8);
  pos=Math.max(10,Math.min(90,pos));
  knotEl.style.left=pos+"%";
}

function checkAnswer(team,value){
  if(!gameStarted) return;

  if(team===1 && value===currentAnswer1){
    score1++; tug--;
  }
  if(team===2 && value===currentAnswer2){
    score2++; tug++;
  }

  score1El.textContent=score1;
  score2El.textContent=score2;

  updateRope();
  newRound();
}

function buildKeypads(){
  document.querySelectorAll(".keypad").forEach(kp=>{
    const team=parseInt(kp.dataset.team);
    const player=parseInt(kp.dataset.player);
    let buffer="";

    ["1","2","3","4","5","6","7","8","9","0","DEL","OK"].forEach(key=>{
      const btn=document.createElement("button");
      btn.textContent=key;
      btn.onclick=()=>{
        if(!gameStarted) return;

        if(key==="DEL"){ buffer=buffer.slice(0,-1); return; }
        if(key==="OK"){ checkAnswer(team,parseInt(buffer)); buffer=""; return; }
        buffer+=key;
      };
      kp.appendChild(btn);
    });
  });
}

async function countdown(){
  overlay.classList.add("show");
  for(let txt of ["3","2","1","GO!"]){
    overlayText.textContent=txt;
    overlayText.style.animation="none";
    void overlayText.offsetWidth;
    overlayText.style.animation="pop 0.7s";
    await new Promise(r=>setTimeout(r,700));
  }
  overlay.classList.remove("show");
}

startBtn.onclick=async ()=>{
  if(gameStarted) return;
  await countdown();
  gameStarted=true;
  newRound();
};

resetBtn.onclick=()=>{
  gameStarted=false;
  score1=0; score2=0; tug=0;
  score1El.textContent=0;
  score2El.textContent=0;
  updateRope();
};

buildKeypads();
updateRope();
