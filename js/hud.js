// Heads-up display. Plain DOM over the canvas.
const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.root = $('hud');
    this.hp = $('hp-fill');
    this.armor = $('armor-fill');
    this.keys = $('keys');
    this.stance = $('stance');
    this.weaponName = $('weapon-name');
    this.grenadeEl = $('grenades');
    this.ammoMag = $('ammo-mag');
    this.ammoRes = $('ammo-res');
    this.detect = $('detect');
    this.detectLabel = $('detect-label');
    this.detectFill = $('detect-fill');
    this.messages = $('messages');
    this.promptEl = $('prompt');
    this.progressEl = $('progress');
    this.progressLabel = $('progress-label');
    this.progressFill = $('progress-fill');
    this.vignette = $('vignette');
    this.dmgDir = $('dmg-dir');
    this.hitEl = $('hitmarker');
    this.flashEl = $('flash');
    this.alarmEl = $('alarm-banner');
    this.objEl = $('objectives-overlay');
    this.objList = $('objectives-list');
    this.mapCanvas = $('map-canvas');
    this.mapZone = $('map-zone');
    this.timerEl = $('timer');
    this.timerLabel = $('timer-label');
    this.timerValue = $('timer-value');
    this.lastObj = '';
    this.vig = 0;
    this.dirT = 0;
    this.hitT = 0;
    this.lastPrompt = null;
    this.lastKeys = '';
  }

  show(v) { this.root.classList.toggle('hidden', !v); }

  reset() {
    this.messages.innerHTML = '';
    this.prompt(null);
    this.progress(null);
    this.alarm(false);
    this.timer(null);
    this.lastObj = '';
    this.vig = 0; this.dirT = 0; this.hitT = 0;
    this.lastKeys = '';
    this.keys.innerHTML = '';
    this.objEl.classList.add('hidden');
  }

  vitals(hp, armor, crouching) {
    this.hp.style.width = `${Math.max(0, hp)}%`;
    this.hp.classList.toggle('low', hp <= 30);
    this.armor.style.width = `${Math.max(0, armor)}%`;
    this.stance.textContent = crouching ? 'CROUCHED' : '';
  }

  weapon(name, mag, res, grenades = 0) {
    this.weaponName.textContent = name;
    const g = grenades ? `GRENADES ${grenades} · G` : '';
    if (this.grenadeEl.textContent !== g) this.grenadeEl.textContent = g;
    this.ammoMag.textContent = mag === null ? '' : mag;
    this.ammoRes.textContent = mag === null ? '' : ` / ${res}`;
    this.ammoMag.classList.toggle('empty', mag === 0);
  }

  setKeys(set) {
    const sig = [...set].sort().join(',');
    if (sig === this.lastKeys) return;
    this.lastKeys = sig;
    this.keys.innerHTML = '';
    for (const k of set) {
      const el = document.createElement('span');
      el.className = `keycard ${k}`;
      el.textContent = `${k.toUpperCase()} CARD`;
      this.keys.appendChild(el);
    }
  }

  detection(level, status) {
    const visible = status !== 'hidden' || level > 0.03;
    this.detect.classList.toggle('show', visible);
    this.detect.dataset.status = status;
    this.detectLabel.textContent = status === 'combat' ? 'SPOTTED' : status === 'suspicious' ? 'SUSPICIOUS' : 'UNSEEN';
    this.detectFill.style.width = `${Math.min(1, status === 'combat' ? 1 : level) * 100}%`;
  }

  prompt(text) {
    if (text === this.lastPrompt) return;
    this.lastPrompt = text;
    this.promptEl.textContent = text || '';
    this.promptEl.classList.toggle('show', !!text);
  }

  progress(label, frac) {
    if (label === null) { this.progressEl.classList.remove('show'); return; }
    this.progressEl.classList.add('show');
    this.progressLabel.textContent = label;
    this.progressFill.style.width = `${Math.min(1, frac) * 100}%`;
  }

  /** kind: radio | objective | warn | info */
  message(text, kind = 'info', seconds = 5) {
    const el = document.createElement('div');
    el.className = `msg ${kind}`;
    el.textContent = text;
    this.messages.appendChild(el);
    while (this.messages.children.length > 5) this.messages.firstChild.remove();
    setTimeout(() => el.classList.add('out'), seconds * 1000);
    setTimeout(() => el.remove(), seconds * 1000 + 600);
  }

  damage(angle) {
    this.vig = 1;
    this.dirT = 0.9;
    this.dmgDir.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  hit(kill) {
    this.hitT = 0.18;
    this.hitEl.classList.toggle('kill', !!kill);
  }

  flash() {
    this.flashEl.classList.remove('go');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('go');
  }

  alarm(on) { this.alarmEl.classList.toggle('show', on); }

  objectives(list, visible, zone) {
    this.objEl.classList.toggle('hidden', !visible);
    if (!visible) return;
    this.mapZone.textContent = zone;
    const html = objectiveHtml(list);
    if (html !== this.lastObj) { this.lastObj = html; this.objList.innerHTML = html; }
  }

  /** Countdown clock. Pass null to hide it. */
  timer(label, seconds) {
    if (label === null) { this.timerEl.classList.remove('show'); return; }
    const t = Math.max(0, Math.ceil(seconds));
    this.timerEl.classList.add('show');
    this.timerEl.classList.toggle('low', t <= 20);
    this.timerLabel.textContent = label;
    this.timerValue.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  update(dt, hp) {
    this.vig = Math.max(0, this.vig - dt * 1.6);
    const low = hp <= 30 ? 0.35 : 0;
    this.vignette.style.opacity = Math.max(this.vig, low);
    this.dirT = Math.max(0, this.dirT - dt);
    this.dmgDir.style.opacity = Math.min(1, this.dirT * 2);
    this.hitT = Math.max(0, this.hitT - dt);
    this.hitEl.style.opacity = this.hitT > 0 ? 1 : 0;
  }
}

export function objectiveHtml(list) {
  return '<ul class="objectives">' + list.map((o) =>
    `<li class="${o.done ? 'done' : ''}"><span class="box">${o.done ? '✓' : ''}</span>${o.text}${
      o.need > 1 && !o.done ? ` <b class="count">${o.have}/${o.need}</b>` : ''}</li>`).join('') + '</ul>';
}
