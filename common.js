(() => {
  const QUESTION_SOURCES = [
    './questions.js',
    'https://hhinton25-cpu.github.io/DOCJT_EXAM/questions.js?v=75',
    'https://raw.githubusercontent.com/HHinton25-cpu/DOCJT_EXAM/refs/heads/main/questions.js'
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

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadQuestionBank(statusEl) {
    for (const src of QUESTION_SOURCES) {
      try {
        if (statusEl) statusEl.textContent = `Loading questions from ${src.includes('http') ? 'the live DOCJT site' : 'local questions.js'}…`;
        await loadScript(src);
        if (Array.isArray(window.QUESTION_BANK) && window.QUESTION_BANK.length) {
          const bank = normalizeBank(window.QUESTION_BANK);
          if (statusEl) statusEl.textContent = `Loaded ${bank.length} questions.`;
          return { bank, source: src };
        }
      } catch (err) {
        console.warn(err.message);
      }
    }
    throw new Error('Could not load the DOCJT question bank. Keep an internet connection or place questions.js beside these files.');
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

  window.LiveQuiz = {
    $, escapeHtml, escapeAttr, loadQuestionBank, shuffle, countBy, makePin, buildPlayerUrl,
    getParam, isFirebaseConfigured, rankPlayers, showScreen, setStatus, copyText, formatScore,
    clamp, answerStyles, answerShapes
  };
})();
