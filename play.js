import { firebaseConfig, GAME_ROOT } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getDatabase, ref, set, update, get, onValue, off, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const LQ = window.LiveQuiz;
const $ = LQ.$;

let db = null;
let uid = null;
let firebaseReady = false;
let joinedPin = '';
let playerName = '';
let liveGame = null;
let unsubscribeGame = null;
let timerId = null;
let lastQuestionKey = '';
let localAnswered = false;
let lastPhase = '';
let lastRevealAudioKey = '';
let lastGainAnimationKey = '';
let lastEndedAudioKey = '';

const els = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  wireEvents();
  const pin = LQ.getParam('pin');
  if (pin) els.pinInput.value = pin.replace(/\D/g, '').slice(0, 6);
  const savedName = localStorage.getItem('docjtLiveName');
  if (savedName) els.nameInput.value = savedName;

  try {
    await initFirebase();
  } catch (err) {
    console.error(err);
    els.firebaseWarning.classList.remove('hidden');
    LQ.setStatus(els.joinStatus, 'Firebase is not configured yet. Ask the host to finish setup.', 'error');
  }
}

function cacheElements() {
  [
    'firebase-warning', 'pin-input', 'name-input', 'join-game', 'join-status', 'lobby-name',
    'lobby-pin', 'player-round', 'player-score', 'player-timer', 'player-category',
    'player-question', 'player-answers', 'answer-status', 'answered-score', 'player-result-card',
    'player-result-icon', 'player-result-label', 'player-gain', 'player-correct-answer',
    'player-explanation', 'player-total-score', 'player-rank', 'final-player-title', 'player-final-list'
  ].forEach(id => {
    els[toCamel(id)] = $(id);
  });
}

function wireEvents() {
  els.joinGame.addEventListener('click', joinGame);
  [els.pinInput, els.nameInput].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') joinGame();
    });
  });
  els.pinInput.addEventListener('input', () => {
    els.pinInput.value = els.pinInput.value.replace(/\D/g, '').slice(0, 6);
  });
}

async function initFirebase() {
  if (!LQ.isFirebaseConfigured(firebaseConfig)) {
    throw new Error('Firebase config has placeholder values.');
  }
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  db = getDatabase(app);
  const credential = await signInAnonymously(auth);
  uid = credential.user.uid;
  firebaseReady = true;
  LQ.setStatus(els.joinStatus, 'Ready to join.', 'ok');
}

async function joinGame() {
  LQ.Sounds.unlock();
  if (!firebaseReady) return;
  const pin = els.pinInput.value.trim();
  const name = els.nameInput.value.trim().slice(0, 24);
  if (!/^\d{6}$/.test(pin)) {
    LQ.setStatus(els.joinStatus, 'Enter the 6-digit game PIN.', 'error');
    return;
  }
  if (!name) {
    LQ.setStatus(els.joinStatus, 'Enter your name.', 'error');
    return;
  }

  LQ.setStatus(els.joinStatus, 'Joining…');
  const gameSnap = await get(ref(db, `${GAME_ROOT}/${pin}/state`));
  if (!gameSnap.exists()) {
    LQ.setStatus(els.joinStatus, 'No active game found with that PIN.', 'error');
    return;
  }

  joinedPin = pin;
  playerName = name;
  localStorage.setItem('docjtLiveName', playerName);
  const playerRef = ref(db, `${GAME_ROOT}/${joinedPin}/players/${uid}`);
  await set(playerRef, {
    name: playerName,
    score: 0,
    correct: 0,
    answered: 0,
    played: 0,
    streak: 0,
    lastGain: 0,
    lastCorrect: false,
    lastChoiceIndex: -1,
    online: true,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  });
  onDisconnect(ref(db, `${GAME_ROOT}/${joinedPin}/players/${uid}/online`)).set(false);
  onDisconnect(ref(db, `${GAME_ROOT}/${joinedPin}/players/${uid}/lastSeen`)).set(serverTimestamp());

  startGameListener();
}

function startGameListener() {
  if (unsubscribeGame) unsubscribeGame();
  const gameRef = ref(db, `${GAME_ROOT}/${joinedPin}`);
  const cb = snapshot => {
    liveGame = snapshot.val();
    if (!liveGame) {
      cleanupTimer();
      LQ.setStatus(els.joinStatus, 'The game was closed.', 'error');
      LQ.showScreen('join');
      return;
    }
    renderFromGame(liveGame);
  };
  onValue(gameRef, cb);
  unsubscribeGame = () => off(gameRef, 'value', cb);
}

function renderFromGame(game) {
  const phase = game.state?.phase || 'lobby';
  if (phase !== lastPhase) {
    lastPhase = phase;
    if (phase === 'lobby') LQ.Sounds.playMusic('lobby');
    if (phase === 'question') {
      LQ.Sounds.resetCountdown();
      LQ.Sounds.playMusic('question');
    }
    if (phase === 'reveal') LQ.Sounds.stopMusic();
    if (phase === 'ended') LQ.Sounds.stopMusic();
  }
  const qKey = game.question?.key || '';
  if (qKey && qKey !== lastQuestionKey) {
    lastQuestionKey = qKey;
    localAnswered = Boolean(getMyAnswer(game));
  }
  if (phase === 'lobby') renderLobby(game);
  if (phase === 'question') renderQuestion(game);
  if (phase === 'reveal') renderReveal(game);
  if (phase === 'ended') renderEnded(game);
}

function renderLobby(game) {
  cleanupTimer();
  els.lobbyName.textContent = playerName || 'Player';
  els.lobbyPin.textContent = game.state?.pin || joinedPin;
  LQ.showScreen('lobby');
}

function renderQuestion(game) {
  const q = game.question || {};
  const state = game.state || {};
  const me = game.players?.[uid] || {};
  const answer = getMyAnswer(game);
  const answered = localAnswered || Boolean(answer);

  els.playerRound.textContent = `Question ${Number(state.questionIndex || 0) + 1} / ${Number(state.questionCount || 0)}`;
  els.playerScore.textContent = `${LQ.formatScore(me.score)} pts`;
  els.playerCategory.textContent = q.category || 'Category';
  els.playerQuestion.textContent = q.text || 'Pick your answer';
  els.answeredScore.textContent = `Score: ${LQ.formatScore(me.score)} pts`;

  if (answered) {
    LQ.showScreen('answered');
    cleanupTimer();
    return;
  }

  els.playerAnswers.innerHTML = (q.choices || []).map((choice, i) => `
    <button type="button" class="answer-btn ${LQ.answerStyles[i % LQ.answerStyles.length]}" data-choice-index="${i}">
      <span class="shape">${LQ.answerShapes[i % LQ.answerShapes.length]}</span>
      <span>${LQ.escapeHtml(choice)}</span>
    </button>
  `).join('');
  document.querySelectorAll('[data-choice-index]').forEach(button => {
    button.addEventListener('click', () => submitAnswer(Number(button.dataset.choiceIndex)));
  });
  LQ.setStatus(els.answerStatus, 'Choose an answer before time runs out.');
  LQ.showScreen('question');
  startTimer(Number(state.endsAt || Date.now()));
}

function startTimer(endsAt) {
  cleanupTimer();
  const tick = () => {
    const remainingMs = Math.max(0, endsAt - Date.now());
    const seconds = Math.ceil(remainingMs / 1000);
    els.playerTimer.textContent = seconds;
    LQ.Sounds.countdownTick(seconds);
    if (remainingMs <= 0) {
      cleanupTimer();
      localAnswered = true;
      LQ.showScreen('answered');
    }
  };
  tick();
  timerId = setInterval(tick, 200);
}

function cleanupTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

async function submitAnswer(choiceIndex) {
  if (!joinedPin || !liveGame || localAnswered) return;
  const index = Number(liveGame.state?.questionIndex ?? -1);
  if (index < 0 || liveGame.state?.phase !== 'question') return;

  localAnswered = true;
  LQ.Sounds.answerSent();
  document.querySelectorAll('[data-choice-index]').forEach(btn => btn.disabled = true);
  LQ.setStatus(els.answerStatus, 'Answer sent!', 'ok');
  await set(ref(db, `${GAME_ROOT}/${joinedPin}/answers/${index}/${uid}`), {
    choiceIndex,
    answeredAt: Date.now(),
    questionKey: liveGame.question?.key || ''
  });
  LQ.showScreen('answered');
}

function getMyAnswer(game) {
  const index = Number(game.state?.questionIndex ?? -1);
  if (index < 0) return null;
  return game.answers?.[index]?.[uid] || null;
}

function renderReveal(game) {
  cleanupTimer();
  const me = game.players?.[uid] || {};
  const reveal = game.reveal || {};
  const correct = Boolean(me.lastCorrect);
  const ranked = LQ.rankPlayers(game.players || {});
  const rank = ranked.findIndex(p => p.uid === uid) + 1;

  els.playerResultCard.classList.toggle('wrong', !correct);
  els.playerResultIcon.textContent = correct ? '✓' : '×';
  els.playerResultLabel.textContent = correct ? 'Correct!' : 'Not this time';
  els.playerCorrectAnswer.textContent = `Correct answer: ${reveal.correctAnswer || ''}`;
  if (els.playerExplanation) els.playerExplanation.textContent = reveal.explanation || '';
  els.playerRank.textContent = rank ? `Rank ${rank}` : 'Rank —';

  const gain = Number(me.lastGain || 0);
  const total = Number(me.score || 0);
  const revealKey = `${game.question?.key || ''}_${reveal.revealedAt || ''}`;
  const shouldAnimate = revealKey && revealKey !== lastGainAnimationKey;

  if (revealKey && revealKey !== lastRevealAudioKey) {
    lastRevealAudioKey = revealKey;
    LQ.Sounds.reveal(correct);
    LQ.Sounds.countUp();
  }

  if (shouldAnimate) {
    lastGainAnimationKey = revealKey;
    LQ.animateNumber(els.playerGain, 0, gain, {
      prefix: '+',
      suffix: ' pts',
      duration: 1000,
      onTick: () => LQ.Sounds.pointsTick()
    });
    LQ.animateNumber(els.playerTotalScore, Math.max(0, total - gain), total, {
      suffix: ' pts',
      duration: 1000,
      onTick: () => LQ.Sounds.pointsTick()
    });
  } else {
    els.playerGain.textContent = `+${LQ.formatScore(gain)} pts`;
    els.playerTotalScore.textContent = `${LQ.formatScore(total)} pts`;
  }

  LQ.showScreen('reveal');
}

function renderEnded(game) {
  cleanupTimer();
  const endedKey = `${game.state?.endedAt || 'ended'}`;
  if (endedKey !== lastEndedAudioKey) {
    lastEndedAudioKey = endedKey;
    LQ.Sounds.victory();
  }
  const ranked = LQ.rankPlayers(game.players || {});
  const myRank = ranked.findIndex(p => p.uid === uid) + 1;
  els.finalPlayerTitle.textContent = myRank ? `You finished #${myRank}` : 'Game ended';
  els.playerFinalList.innerHTML = ranked.slice(0, 10).map((p, i) => `
    <div class="leader-row ${p.uid === uid ? 'mine' : ''}">
      <div class="rank">${i + 1}</div>
      <div class="leader-name">
        <strong>${LQ.escapeHtml(p.name || 'Player')}</strong>
        <span>${Number(p.correct || 0)} correct</span>
      </div>
      <div class="leader-score">${LQ.formatScore(p.score)} pts</div>
    </div>
  `).join('');
  LQ.showScreen('ended');
}

window.addEventListener('beforeunload', () => {
  cleanupTimer();
  LQ.Sounds.stopMusic();
  if (db && joinedPin && uid) {
    update(ref(db, `${GAME_ROOT}/${joinedPin}/players/${uid}`), {
      online: false,
      lastSeen: serverTimestamp()
    });
  }
});

function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}
