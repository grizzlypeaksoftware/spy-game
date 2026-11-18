// All sound is synthesised with the Web Audio API: effects, the alarm and a small
// generative score that tightens up when the player is spotted.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Four-bar loop in D minor. Each bar: bass root and the chord tones above it.
const BARS = [
  { root: 38, chord: [62, 65, 69] },
  { root: 38, chord: [62, 65, 69] },
  { root: 34, chord: [62, 65, 70] },
  { root: 33, chord: [61, 64, 69] },
];
const BASS_STEPS = { 0: 0, 3: 0, 6: 7, 8: 0, 11: 12, 14: 7 };
const STEP = 0.15; // seconds per sixteenth note (100 bpm)

export class Sfx {
  constructor() {
    this.ctx = null;
    this.listener = { x: 0, z: 0, yaw: 0 };
    this.intensity = 0;
    this.targetIntensity = 0;
    this.musicTimer = null;
    this.siren = null;
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(comp);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.5; this.musicBus.connect(this.master);

    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  out(bus, pan) {
    if (!pan || !this.ctx.createStereoPanner) return bus;
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(bus);
    return p;
  }

  noise(dur, o = {}) {
    const ctx = this.ctx, t = o.t ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    f.Q.value = o.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol ?? 0.4, t + (o.attack ?? 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.out(o.bus || this.sfxBus, o.pan));
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  tone(freq, dur, o = {}) {
    const ctx = this.ctx, t = o.t ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol ?? 0.3, t + (o.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lp;
      osc.connect(f); node = f;
    }
    node.connect(g); g.connect(this.out(o.bus || this.sfxBus, o.pan));
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  play(name, vol = 1, pan = 0) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'pistol':
        this.noise(0.11, { type: 'bandpass', f: 1500, f2: 500, q: 0.9, vol: 0.5 * vol, pan });
        this.tone(180, 0.05, { f2: 70, vol: 0.2 * vol, pan });
        break;
      case 'smg':
        this.noise(0.14, { f: 4200, f2: 700, vol: 0.75 * vol, pan });
        this.tone(140, 0.09, { type: 'square', f2: 45, vol: 0.4 * vol, pan, lp: 900 });
        break;
      case 'rifle':
        this.noise(0.2, { f: 2600, f2: 400, vol: 0.8 * vol, pan });
        this.tone(110, 0.12, { type: 'square', f2: 40, vol: 0.45 * vol, pan, lp: 700 });
        break;
      case 'shotgun':
        this.noise(0.28, { f: 3200, f2: 300, vol: 1.0 * vol, pan });
        this.tone(90, 0.18, { type: 'square', f2: 35, vol: 0.55 * vol, pan, lp: 600 });
        this.noise(0.05, { type: 'highpass', f: 1800, vol: 0.2 * vol, t: t + 0.38 });
        break;
      case 'explosion':
        this.noise(0.9, { f: 1800, f2: 90, vol: 1.2 * vol, pan });
        this.tone(70, 0.7, { f2: 24, vol: 0.9 * vol, pan });
        this.noise(1.4, { f: 400, f2: 60, vol: 0.5 * vol, pan, attack: 0.1 });
        break;
      case 'clink':
        this.tone(2300, 0.05, { type: 'triangle', f2: 1700, vol: 0.14 * vol, pan });
        this.noise(0.03, { type: 'highpass', f: 4000, vol: 0.1 * vol, pan });
        break;
      case 'punch':
        this.tone(130, 0.12, { f2: 50, vol: 0.6 * vol });
        this.noise(0.07, { f: 500, vol: 0.4 * vol });
        break;
      case 'swing':
        this.noise(0.12, { type: 'bandpass', f: 500, f2: 1400, q: 1.5, vol: 0.12 * vol });
        break;
      case 'step':
        this.noise(0.06, { f: 260 + Math.random() * 120, vol: 0.2 * vol, pan });
        break;
      case 'door':
        this.noise(0.4, { type: 'bandpass', f: 380, f2: 950, q: 2, vol: 0.2 * vol, attack: 0.05, pan });
        break;
      case 'pickup':
        this.tone(880, 0.07, { type: 'triangle', vol: 0.22 * vol });
        this.tone(1320, 0.1, { type: 'triangle', vol: 0.22 * vol, t: t + 0.07 });
        break;
      case 'key':
        [784, 988, 1175].forEach((f, i) => this.tone(f, 0.09, { type: 'triangle', vol: 0.22, t: t + i * 0.08 }));
        break;
      case 'hurt':
        this.tone(190, 0.18, { type: 'sawtooth', f2: 80, vol: 0.3 * vol, lp: 900 });
        this.noise(0.1, { f: 900, vol: 0.25 * vol });
        break;
      case 'grunt':
        this.tone(150, 0.22, { type: 'sawtooth', f2: 70, vol: 0.28 * vol, lp: 600, pan });
        break;
      case 'body':
        this.tone(80, 0.16, { f2: 40, vol: 0.4 * vol, pan });
        this.noise(0.12, { f: 300, vol: 0.25 * vol, pan });
        break;
      case 'alert':
        this.tone(660, 0.08, { type: 'square', vol: 0.12 * vol, lp: 2400 });
        this.tone(990, 0.16, { type: 'square', vol: 0.12 * vol, lp: 2400, t: t + 0.09 });
        break;
      case 'suspicious':
        this.tone(520, 0.14, { type: 'triangle', vol: 0.14 * vol });
        this.tone(440, 0.2, { type: 'triangle', vol: 0.12 * vol, t: t + 0.12 });
        break;
      case 'objective':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.22, t: t + i * 0.09 }));
        break;
      case 'success':
        [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.22, t: t + i * 0.13 }));
        break;
      case 'fail':
        [330, 294, 247, 196].forEach((f, i) => this.tone(f, 0.5, { type: 'sawtooth', vol: 0.16, lp: 900, t: t + i * 0.22 }));
        break;
      case 'click':
        this.tone(1100, 0.025, { type: 'square', vol: 0.12 * vol, lp: 3000 });
        break;
      case 'reload':
        this.noise(0.04, { type: 'highpass', f: 2200, vol: 0.2 });
        this.noise(0.05, { type: 'highpass', f: 1600, vol: 0.25, t: t + 0.32 });
        break;
      case 'ricochet':
        this.tone(2600, 0.16, { f2: 800, vol: 0.09 * vol, pan });
        this.noise(0.05, { type: 'highpass', f: 3000, vol: 0.14 * vol, pan });
        break;
      case 'impact':
        this.noise(0.05, { type: 'bandpass', f: 1800, q: 1, vol: 0.14 * vol, pan });
        break;
      case 'smash':
        this.noise(0.25, { type: 'highpass', f: 3200, vol: 0.35 * vol, pan });
        this.tone(1900, 0.1, { f2: 500, vol: 0.12 * vol, pan });
        break;
      case 'beep':
        this.tone(1480, 0.06, { type: 'square', vol: 0.08 * vol, lp: 3000 });
        break;
      case 'shutter':
        this.noise(0.03, { type: 'highpass', f: 2500, vol: 0.3 });
        this.noise(0.05, { type: 'highpass', f: 1800, vol: 0.3, t: t + 0.09 });
        break;
      case 'power':
        this.tone(220, 0.7, { type: 'sawtooth', f2: 35, vol: 0.25, lp: 700 });
        break;
    }
  }

  /** Play a sound at a world position, attenuated and panned relative to the listener. */
  playAt(name, x, z, vol = 1) {
    if (!this.ctx) return;
    const L = this.listener;
    const dx = x - L.x, dz = z - L.z;
    const d = Math.hypot(dx, dz);
    const v = vol / (1 + (d / 9) * (d / 9));
    if (v < 0.02) return;
    const pan = d > 0.5 ? ((dx * Math.cos(L.yaw) - dz * Math.sin(L.yaw)) / d) * 0.8 : 0;
    this.play(name, v, pan);
  }

  alarm(on) {
    if (!this.ctx) return;
    if (on && !this.siren) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = 720;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 1.3;
      const lg = ctx.createGain(); lg.gain.value = 110;
      lfo.connect(lg); lg.connect(osc.frequency);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
      const g = ctx.createGain(); g.gain.value = 0.05;
      osc.connect(f); f.connect(g); g.connect(this.sfxBus);
      osc.start(); lfo.start();
      this.siren = { osc, lfo, g };
    } else if (!on && this.siren) {
      const s = this.siren;
      this.siren = null;
      s.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => { s.osc.stop(); s.lfo.stop(); }, 500);
    }
  }

  // --- score -------------------------------------------------------------

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.stepI = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 60);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  /** 0 = unseen, 0.5 = guards suspicious, 1 = open combat. */
  setIntensity(v) { this.targetIntensity = v; }

  schedule() {
    const ctx = this.ctx;
    if (ctx.state !== 'running') { this.nextT = ctx.currentTime + 0.1; return; }
    while (this.nextT < ctx.currentTime + 0.2) {
      this.intensity += (this.targetIntensity - this.intensity) * 0.12;
      this.playStep(this.stepI, this.nextT);
      this.stepI = (this.stepI + 1) % 64;
      this.nextT += STEP;
    }
  }

  playStep(i, t) {
    const bar = BARS[(i >> 4) & 3], s = i & 15, k = this.intensity, bus = this.musicBus;

    // Bass: a sparse heartbeat when calm, the full line once things heat up.
    const off = BASS_STEPS[s];
    if (off !== undefined && (k > 0.25 || s === 0 || s === 8)) {
      this.tone(midi(bar.root + off), STEP * 1.8, { type: 'sawtooth', vol: 0.2 + k * 0.1, lp: 260 + k * 520, t, bus });
    }
    // Pad once per bar.
    if (s === 0) {
      for (const n of [bar.chord[0] - 12, bar.chord[2] - 12]) {
        this.tone(midi(n), STEP * 16, { type: 'triangle', vol: 0.05, attack: 0.6, t, bus });
      }
    }
    // Arpeggio joins when someone is looking for you.
    if (k > 0.3 && s % 2 === 0) {
      const n = bar.chord[(s / 2) % 3] + (s % 8 === 6 ? 12 : 0);
      this.tone(midi(n), STEP * 1.2, { type: 'triangle', vol: 0.035 + k * 0.05, t, bus });
    }
    if (k > 0.2 && s % 4 === 2) this.noise(0.03, { type: 'highpass', f: 7000, vol: 0.04 + k * 0.05, t, bus });
    if (k > 0.65) {
      if (s === 0 || s === 8 || s === 10) this.tone(120, 0.14, { f2: 42, vol: 0.5, t, bus });
      if (s === 4 || s === 12) this.noise(0.11, { type: 'bandpass', f: 1700, q: 0.7, vol: 0.2, t, bus });
      if (s % 2 === 1) this.noise(0.02, { type: 'highpass', f: 8000, vol: 0.04, t, bus });
    }
  }
}
