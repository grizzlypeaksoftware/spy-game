// Menus and screens. The game itself lives in game.js.
import { Game } from './game.js';
import { MISSIONS, DIFFICULTIES } from './mission.js';
import { objectiveHtml } from './hud.js';

const $ = (id) => document.getElementById(id);
const screens = ['title', 'missions', 'brief', 'pause', 'end'].reduce((m, k) => ({ ...m, [k]: $(`screen-${k}`) }), {});
function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}

const CONTROLS = [
  ['W A S D', 'Move'], ['Mouse', 'Look'], ['Click', 'Fire'], ['Shift', 'Sprint'],
  ['C', 'Crouch'], ['E', 'Use (hold)'], ['R', 'Reload'], ['1 – 5', 'Weapons'],
  ['G', 'Grenade'], ['R click', 'Aim'], ['Tab', 'Map'], ['Esc', 'Pause'],
];
const controlsHtml = CONTROLS.map(([k, v]) => `<div><kbd>${k}</kbd>${v}</div>`).join('');
$('brief-controls').innerHTML = controlsHtml;
$('pause-controls').innerHTML = controlsHtml;

let difficulty = 'operative';
let missionIndex = 0;
let game;

// --- campaign progress -------------------------------------------------------
// Saved in the browser. Finishing an operation on any clearance opens the next;
// adding ?unlock to the address opens them all.

const SAVE_KEY = 'cold-ledger-progress';
const RATING_ORDER = ['BLUNT INSTRUMENT', 'PROFESSIONAL', 'GHOST'];
const unlockAll = new URLSearchParams(location.search).has('unlock');

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    return data && typeof data === 'object' ? data : {};
  } catch { return {}; }
}
let progress = loadProgress();

function recordWin(r) {
  const prev = progress[r.mission.id];
  const better = !prev || r.level > prev.level ||
    (r.level === prev.level && RATING_ORDER.indexOf(r.rating.name) > RATING_ORDER.indexOf(prev.rating));
  if (better) progress[r.mission.id] = { level: r.level, clearance: r.difficulty, rating: r.rating.name };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* private window: progress lasts for this visit only */ }
}

const isOpen = (i) => unlockAll || i === 0 || !!progress[MISSIONS[i - 1].id];

// --- screens -----------------------------------------------------------------

function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderMissions() {
  const wrap = $('mission-list');
  wrap.innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const open = isOpen(i), best = progress[m.id];
    const b = document.createElement('button');
    b.className = 'mission';
    b.disabled = !open;
    const status = !open ? 'LOCKED' : best ? `${best.clearance.toUpperCase()} · ${best.rating}` : 'OPEN';
    b.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span>` +
      `<span><b>${open ? m.codename : 'CLASSIFIED'}</b><span class="where">${open ? m.location : `Complete ${MISSIONS[i - 1].codename} first`}</span></span>` +
      `<span class="status ${open && !best ? 'open' : ''}">${status}</span>`;
    b.addEventListener('click', () => openBrief(i));
    wrap.appendChild(b);
  });
}

function openBrief(i) {
  missionIndex = i;
  game.preview(i);
  renderBrief();
  show('brief');
}

function renderBrief() {
  const M = MISSIONS[missionIndex];
  $('brief-eyebrow').textContent = `OPERATION ${missionIndex + 1} OF ${MISSIONS.length}`;
  $('brief-title').textContent = M.codename;
  $('brief-meta').textContent = `${M.location} · ${M.time}`;
  $('brief-text').innerHTML = M.briefing.map((p) => `<p>${p}</p>`).join('') + `<p class="signoff">${M.signoff}</p>`;
  const wrap = $('difficulty');
  wrap.innerHTML = '';
  for (const d of Object.values(DIFFICULTIES)) {
    const b = document.createElement('button');
    b.className = 'diff';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(d.key === difficulty));
    b.innerHTML = `<b>${d.name}</b><span>${d.blurb}</span>`;
    b.addEventListener('click', () => { difficulty = d.key; renderBrief(); });
    wrap.appendChild(b);
  }
  const level = DIFFICULTIES[difficulty].level;
  $('brief-objectives').innerHTML = objectiveHtml(M.objectives.filter((o) => o.min <= level));
}

function renderEnd(r) {
  if (r.success) recordWin(r);
  $('end-eyebrow').textContent = `OPERATION ${r.mission.codename} · ${r.difficulty.toUpperCase()}`;
  const title = $('end-title');
  title.textContent = r.success ? 'MISSION COMPLETE' : 'MISSION FAILED';
  title.className = r.success ? 'win' : 'fail';
  $('end-note').textContent = r.success ? `Rating: ${r.rating.name}. ${r.rating.note} ${r.mission.debrief}` : (r.reason || '');
  $('end-objectives').innerHTML = objectiveHtml(r.objectives);
  const s = r.stats;
  const rows = [
    ['Time', fmtTime(r.time)],
    ['Shots fired', s.shots],
    ['Accuracy', r.accuracy === null ? 'n/a' : `${r.accuracy}%`],
    ['Head shots', s.headshots],
    ['Guards down', s.kills],
    ['Silent takedowns', s.takedowns],
    ['Times spotted', s.alerts],
    ['Alarms raised', s.alarms],
    ['Damage taken', Math.round(s.damage)],
  ];
  $('end-stats').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
  // Offer the next operation after a win; otherwise retrying is the main action.
  const hasNext = r.success && r.missionIndex + 1 < MISSIONS.length;
  $('btn-next').classList.toggle('hidden', !hasNext);
  $('btn-retry').classList.toggle('primary', !hasNext);
}

const ui = {
  onResume() { show(null); },
  onPause(objectives, lockFailed) {
    $('pause-objectives').innerHTML = objectiveHtml(objectives);
    $('pause-note').textContent = lockFailed
      ? 'The browser did not capture the mouse. Wait a second, then press Resume.'
      : 'Click Resume to capture the mouse again.';
    game.drawMap($('pause-map'));
    show('pause');
  },
  onEnd(result) { renderEnd(result); show('end'); },
};

try {
  game = new Game($('view'), ui);
  window.__game = game;
} catch (err) {
  console.error(err);
  const el = $('fatal');
  el.textContent = 'Cold Ledger could not start. It needs a browser with WebGL enabled. (' + err.message + ')';
  el.classList.remove('hidden');
}

$('btn-briefing').addEventListener('click', () => { game.audio.init(); renderMissions(); show('missions'); });
$('btn-missions-back').addEventListener('click', () => show('title'));
$('btn-back').addEventListener('click', () => { renderMissions(); show('missions'); });
$('btn-start').addEventListener('click', () => { show(null); game.start(difficulty, missionIndex); });
$('btn-resume').addEventListener('click', () => game.resume());
$('btn-abort').addEventListener('click', () => { game.quit(); show('title'); });
$('btn-menu').addEventListener('click', () => { game.quit(); show('title'); });
$('btn-retry').addEventListener('click', () => { show(null); game.start(difficulty, missionIndex); });
$('btn-next').addEventListener('click', () => { game.quit(); openBrief(missionIndex + 1); });
$('sensitivity').addEventListener('input', (e) => { game.sensitivity = Number(e.target.value); });
