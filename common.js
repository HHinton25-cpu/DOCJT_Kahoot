(() => {
  const DEFAULT_QUESTION_SOURCES = [
    './questions.js',
    'https://hhinton25-cpu.github.io/DOCJT_EXAM/questions.js?v=75',
    'https://raw.githubusercontent.com/HHinton25-cpu/DOCJT_EXAM/refs/heads/main/questions.js'
  ];

  const REFINED_QUESTION_SOURCES = [
    './refined_questions.js',
    './refined-questions.js'
  ];

  const LEGAL_SCENARIOS_QUESTION_SOURCES = [
    './legal_scenarios_questions.js',
    './legal-scenarios-questions.js'
  ];

  const answerStyles = ['tile-red', 'tile-blue', 'tile-yellow', 'tile-green'];
  const answerShapes = ['▲', '◆', '●', '■'];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  async function fetchText(src) {
    const response = await fetch(src, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Could not load ${src} (${response.status})`);
    }
    return response.text();
  }

  function readQuestionBankFromCode(code) {
    // Supports the DOCJT format and refined-bank variants:
    //   const QUESTION_BANK = [...]
    //   window.QUESTION_BANK = [...]
    //   const REFINED_QUESTION_BANK = [...]
    //   window.REFINED_QUESTION_BANK = [...]
    //   export default [...]
    let safeCode = String(code || '');
    safeCode = safeCode.replace(/export\s+default\s+/g, 'const QUESTION_BANK = ');
    const runner = new Function(`
      const window = globalThis;
      ${safeCode}
      if (typeof LEGAL_SCENARIOS_QUESTION_BANK !== 'undefined') return LEGAL_SCENARIOS_QUESTION_BANK;
      if (typeof REFINED_QUESTION_BANK !== 'undefined') return REFINED_QUESTION_BANK;
      if (typeof QUESTION_BANK !== 'undefined') return QUESTION_BANK;
      if (typeof window.LEGAL_SCENARIOS_QUESTION_BANK !== 'undefined') return window.LEGAL_SCENARIOS_QUESTION_BANK;
      if (typeof window.REFINED_QUESTION_BANK !== 'undefined') return window.REFINED_QUESTION_BANK;
      if (typeof window.QUESTION_BANK !== 'undefined') return window.QUESTION_BANK;
      if (typeof globalThis.LEGAL_SCENARIOS_QUESTION_BANK !== 'undefined') return globalThis.LEGAL_SCENARIOS_QUESTION_BANK;
      if (typeof globalThis.REFINED_QUESTION_BANK !== 'undefined') return globalThis.REFINED_QUESTION_BANK;
      if (typeof globalThis.QUESTION_BANK !== 'undefined') return globalThis.QUESTION_BANK;
      return null;
    `);
    return runner();
  }

  async function tryLoadQuestionBank(sources, statusEl, options = {}) {
    const label = options.label || 'question bank';
    const required = options.required !== false;
    const id = options.id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const errors = [];

    for (const src of sources) {
      try {
        if (statusEl) {
          const where = src.includes('http') ? 'the live DOCJT site' : src.replace(/^\.\//, '');
          statusEl.textContent = `Loading ${label} from ${where}…`;
        }
        const code = await fetchText(src);
        const rawBank = readQuestionBankFromCode(code);
        if (Array.isArray(rawBank) && rawBank.length) {
          const bank = normalizeBank(rawBank);
          if (bank.length) {
            return { id, label, bank, source: src };
          }
        }
        throw new Error(`No usable question array found in ${src}`);
      } catch (err) {
        errors.push(err.message);
        console.warn(err.message);
      }
    }

    if (required) {
      throw new Error(`Could not load ${label}. Upload questions.js beside host.html, then open the site from GitHub Pages instead of opening the HTML file directly.`);
    }
    return null;
  }

  async function loadQuestionBank(statusEl) {
    const loaded = await tryLoadQuestionBank(DEFAULT_QUESTION_SOURCES, statusEl, {
      id: 'docjt',
      label: 'DOCJT question bank',
      required: true
    });
    if (statusEl) statusEl.textContent = `Loaded ${loaded.bank.length} questions.`;
    return loaded;
  }

  async function loadQuestionSets(statusEl) {
    const sets = [];
    const defaultSet = await tryLoadQuestionBank(DEFAULT_QUESTION_SOURCES, statusEl, {
      id: 'docjt',
      label: 'Original DOCJT Questions',
      required: true
    });
    sets.push(defaultSet);

    const refinedSet = await tryLoadQuestionBank(REFINED_QUESTION_SOURCES, statusEl, {
      id: 'refined',
      label: 'Refined Questions',
      required: false
    });
    if (refinedSet) sets.push(refinedSet);

    const legalScenariosSet = await tryLoadQuestionBank(LEGAL_SCENARIOS_QUESTION_SOURCES, statusEl, {
      id: 'legal-scenarios',
      label: 'Legal Scenarios',
      required: false
    });
    if (legalScenariosSet) sets.push(legalScenariosSet);

    if (statusEl) {
      const total = sets.reduce((sum, set) => sum + set.bank.length, 0);
      const labels = sets.map(set => `${set.label}: ${set.bank.length}`).join(' · ');
      statusEl.textContent = `Loaded ${total} questions across ${sets.length} set${sets.length === 1 ? '' : 's'}. ${labels}`;
    }
    return sets;
  }

  function normalizeBank(raw) {
    return raw
      .filter(q => q && q.question && Array.isArray(q.choices) && q.choices.length >= 2)
      .map((q, i) => ({
        id: String(q.id ?? i + 1),
        category: String(q.category || 'Uncategorized'),
        type: String(q.type || 'Question'),
        question: String(q.question).replace(/\s*L\d+:\s*/g, '\n').trim(),
        choices: q.choices.map(c => String(c).trim()),
        answer: Number.isInteger(q.answer) ? q.answer : 0,
        explanation: String(q.explanation || 'Review the correct answer and try again.')
      }));
  }

  function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function countBy(items, getter) {
    return items.reduce((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function makePin() {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(100000 + (bytes[0] % 900000));
  }

  function buildPlayerUrl(pin) {
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/[^/]*$/, 'play.html');
    url.search = `?pin=${encodeURIComponent(pin)}`;
    url.hash = '';
    return url.toString();
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function isFirebaseConfigured(config) {
    const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];
    return required.every(key => config && typeof config[key] === 'string' && config[key] && !config[key].includes('PASTE_'));
  }

  function rankPlayers(playersObj) {
    return Object.entries(playersObj || {})
      .map(([uid, player]) => ({ uid, ...player }))
      .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)) || String(a.name || '').localeCompare(String(b.name || '')));
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.toggle('active', screen.id === `${name}-screen`);
    });
  }

  function setStatus(el, message, kind = '') {
    if (!el) return;
    el.textContent = message;
    el.className = `status ${kind}`.trim();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      input.remove();
      return ok;
    }
  }

  function formatScore(value) {
    return Number(value || 0).toLocaleString();
  }

  function clamp(number, min, max) {
    return Math.min(max, Math.max(min, number));
  }

  function animateNumber(el, from, to, options = {}) {
    if (!el) return;
    const duration = Number(options.duration || 850);
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    const formatter = options.formatter || formatScore;
    const onTick = typeof options.onTick === 'function' ? options.onTick : null;
    const start = performance.now();
    let lastTickBucket = -1;

    const render = now => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(Number(from || 0) + (Number(to || 0) - Number(from || 0)) * eased);
      el.textContent = `${prefix}${formatter(value)}${suffix}`;

      const tickBucket = Math.floor(progress * 18);
      if (onTick && tickBucket !== lastTickBucket && progress < 1) {
        lastTickBucket = tickBucket;
        onTick(value, progress);
      }

      if (progress < 1) requestAnimationFrame(render);
      else el.textContent = `${prefix}${formatter(to)}${suffix}`;
    };

    requestAnimationFrame(render);
  }

  function createSoundEngine() {
    let ctx = null;
    let master = null;
    let unlocked = false;
    let muted = localStorage.getItem('docjtLiveMuted') === '1';
    let musicTimer = null;
    let currentMusic = '';
    let musicStep = 0;
    let lastCountdownSecond = null;
    let backgroundTrack = null;
    let backgroundTrackFailed = false;

    function ensure() {
      if (muted) return false;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      if (!ctx) {
        ctx = new AudioCtor();
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
      return true;
    }

    function unlock() {
      const ok = ensure();
      if (ok) beep(660, 0.055, 'sine', 0.018);
      return ok;
    }

    function setMuted(value) {
      muted = Boolean(value);
      localStorage.setItem('docjtLiveMuted', muted ? '1' : '0');
      if (muted) stopMusic();
    }

    function isMuted() {
      return muted;
    }

    function beep(freq, duration = 0.12, type = 'sine', gain = 0.07, delay = 0) {
      if (muted || !unlocked || !ctx || !master) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    }

    function gliss(from, to, duration = 0.22, type = 'sawtooth', gain = 0.045) {
      if (muted || !unlocked || !ctx || !master) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.018);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.04);
    }

    function chord(freqs, duration = 0.26, type = 'triangle', gain = 0.045) {
      freqs.forEach((freq, i) => beep(freq, duration, type, gain / Math.max(1, freqs.length), i * 0.012));
    }

    function getBackgroundTrack() {
      if (backgroundTrack || backgroundTrackFailed) return backgroundTrack;
      try {
        backgroundTrack = new Audio('audio/quiz-click-sprint.mp3');
        backgroundTrack.loop = true;
        backgroundTrack.preload = 'auto';
        backgroundTrack.volume = 0.28;
      } catch (err) {
        backgroundTrackFailed = true;
        backgroundTrack = null;
      }
      return backgroundTrack;
    }

    function startGeneratedMusic(mode) {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
      musicStep = 0;

      if (mode === 'lobby') {
        const notes = [392, 494, 587, 494, 440, 523, 659, 523];
        musicTimer = setInterval(() => {
          beep(notes[musicStep % notes.length], 0.09, 'triangle', 0.025);
          musicStep += 1;
        }, 560);
      }

      if (mode === 'question') {
        const bass = [196, 196, 247, 196, 294, 247, 220, 247];
        musicTimer = setInterval(() => {
          const note = bass[musicStep % bass.length];
          beep(note, 0.07, 'square', 0.018);
          if (musicStep % 2 === 0) beep(note * 2, 0.045, 'triangle', 0.014, 0.08);
          musicStep += 1;
        }, 310);
      }
    }

    function playMusic(mode) {
      if (muted) return;
      ensure();
      if (!unlocked) return;
      if (currentMusic === mode) {
        if (backgroundTrack && !backgroundTrack.paused) return;
        if (musicTimer) return;
      }

      stopMusic();
      currentMusic = mode;

      const track = getBackgroundTrack();
      if (track && !backgroundTrackFailed) {
        track.volume = mode === 'question' ? 0.30 : 0.22;
        track.play().catch(() => {
          backgroundTrackFailed = true;
          startGeneratedMusic(mode);
        });
        return;
      }

      startGeneratedMusic(mode);
    }

    function stopMusic() {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
      if (backgroundTrack) {
        backgroundTrack.pause();
      }
      currentMusic = '';
    }

    function countdownTick(second) {
      if (!Number.isFinite(second) || second <= 0 || second > 5 || second === lastCountdownSecond) return;
      lastCountdownSecond = second;
      ensure();
      const freq = second === 1 ? 880 : 520 + (5 - second) * 55;
      beep(freq, 0.12, second === 1 ? 'square' : 'sine', second === 1 ? 0.09 : 0.055);
    }

    function resetCountdown() {
      lastCountdownSecond = null;
    }

    function answerSent() {
      ensure();
      beep(700, 0.07, 'triangle', 0.06);
      beep(990, 0.09, 'triangle', 0.045, 0.06);
    }

    function reveal(correct = true) {
      ensure();
      stopMusic();
      if (correct) {
        chord([523.25, 659.25, 783.99], 0.24, 'triangle', 0.09);
        beep(1046.5, 0.16, 'sine', 0.05, 0.18);
      } else {
        beep(220, 0.16, 'sawtooth', 0.05);
        beep(164.81, 0.18, 'sawtooth', 0.045, 0.15);
      }
    }

    function pointsTick() {
      ensure();
      beep(1174.66, 0.035, 'triangle', 0.025);
    }

    function countUp() {
      ensure();
      gliss(440, 880, 0.22, 'triangle', 0.038);
    }

    function victory() {
      ensure();
      stopMusic();
      const melody = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
      melody.forEach((note, i) => beep(note, 0.18, 'triangle', 0.055, i * 0.16));
      setTimeout(() => chord([523.25, 659.25, 783.99, 1046.5], 0.55, 'triangle', 0.12), 840);
    }

    return {
      unlock, setMuted, isMuted, playMusic, stopMusic, countdownTick, resetCountdown,
      answerSent, reveal, pointsTick, countUp, victory
    };
  }

  window.LiveQuiz = {
    $, escapeHtml, escapeAttr, loadQuestionBank, loadQuestionSets, shuffle, countBy, makePin, buildPlayerUrl,
    getParam, isFirebaseConfigured, rankPlayers, showScreen, setStatus, copyText, formatScore,
    clamp, animateNumber, answerStyles, answerShapes, Sounds: createSoundEngine()
  };
})();
