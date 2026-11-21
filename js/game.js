// Game orchestration: input, the mission state, alarms, pickups, objectives and the frame loop.
import * as THREE from 'three';
import { Grid, TILE, LOW_H } from './grid.js';
import { MISSIONS, DIFFICULTIES } from './mission.js';
import { makeTextures } from './textures.js';
import { World, SIDE } from './world.js';
import { Guard, SecCamera } from './enemy.js';
import { Player, WEAPONS } from './player.js';
import { Sfx } from './audio.js';
import { Hud } from './hud.js';
import { FieldMap } from './map.js';
import { Post } from './post.js';

const PICKUPS = {
  keyBlue: { color: 0x3f82ff, size: [0.34, 0.03, 0.22] },
  keyRed: { color: 0xff4a3a, size: [0.34, 0.03, 0.22] },
  armor: { color: 0x3a66b8, size: [0.42, 0.46, 0.2] },
  ammoPistol: { color: 0x7fa85a, size: [0.24, 0.14, 0.16] },
  ammoSmg: { color: 0xd0a850, size: [0.28, 0.16, 0.16] },
  smg: { color: 0x565c63, size: [0.08, 0.13, 0.56] },
  shotgun: { color: 0x7a4a2a, size: [0.08, 0.12, 0.78] },
  rifle: { color: 0x3c4a34, size: [0.07, 0.12, 0.92] },
  ammoShells: { color: 0xc0392b, size: [0.22, 0.14, 0.16] },
  ammoRifle: { color: 0xb9c2a0, size: [0.24, 0.12, 0.14] },
  grenade: { color: 0x4f6b3a, size: [0.16, 0.2, 0.16] },
};
const GRENADE = { fuse: 2.4, radius: 6.5, damage: 230, selfDamage: 110 };

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.missionIndex = 0;
    this.mission = MISSIONS[0];
    this.noLock = new URLSearchParams(location.search).has('nolock');
    this.sensitivity = 1;
    this.state = 'menu';
    this.time = 0;
    this.menuT = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.autoClear = false;
    this.post = new Post(this.renderer);
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 140);
    this.tex = makeTextures();
    this.audio = new Sfx();
    this.hud = new Hud();
    this.input = { keys: new Set(), pressed: new Set(), mdx: 0, mdy: 0, fire: false, firePressed: false, wheel: 0 };

    this.bindInput();
    this.setup('operative', 0);
    this.resize();
    addEventListener('resize', () => this.resize());
    this.last = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  // --- setup ---------------------------------------------------------------

  setup(diffKey, index = this.missionIndex) {
    if (this.world) this.world.dispose();
    this.missionIndex = Math.max(0, Math.min(MISSIONS.length - 1, index));
    const MISSION = this.mission = MISSIONS[this.missionIndex];
    this.diff = DIFFICULTIES[diffKey] || DIFFICULTIES.operative;
    this.grid = new Grid(MISSION.map);
    this.scene = new THREE.Scene();
    const sky = MISSION.sky ?? 0x05070c;
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, 14, 70);
    this.world = new World(this.scene, this.grid, MISSION, this.tex);
    this.time = 0;

    this.stats = {
      shots: 0, hits: 0, headshots: 0, kills: 0, takedowns: 0, alerts: 0, alarms: 0,
      bodies: 0, damage: 0, camerasDown: 0,
    };
    this.alarm = { enabled: true, active: false, t: 0, trackT: 0, waves: 0, pending: 0, reT: 0 };
    // An objective can need several interactables (three charges, say).
    this.objectives = MISSION.objectives.filter((o) => o.min <= this.diff.level).map((o) => ({
      ...o, done: false, have: 0,
      need: Math.max(1, MISSION.interactables.filter((i) => i.objective === o.id).length +
        MISSION.guards.filter((g) => g.objective === o.id).length),
    }));
    this.countdowns = [];
    this.grenades = [];
    this.camera.fov = 70;
    this.camera.updateProjectionMatrix();
    this.download = null;
    this.downloadVisitors = null;
    this.lockedDoor = null;
    this.hinted = new Set();
    this.holdT = 0;
    this.holdTarget = null;
    this.deathT = 0;
    this.lastSting = -10;
    this.lastRunnerMsg = -10;
    this.radioQueue = [];

    this.player = new Player(this);
    this.guards = MISSION.guards.map((d) => new Guard(this, d));
    this.cameras = MISSION.cameras.map((d) => new SecCamera(this, d));
    this.pickups = [];
    for (const p of MISSION.pickups) this.spawnPickup(p.kind, (p.c + 0.5) * TILE, (p.r + 0.5) * TILE);
    this.buildPanels();
    this.buildInteractables();
    this.world.setExitReady(false);
    this.exit = { x: (this.grid.exit.c + 0.5) * TILE, z: (this.grid.exit.r + 0.5) * TILE };
    this.map = new FieldMap(this);
  }

  buildPanels() {
    this.panels = this.mission.panels.map((d) => {
      const m = this.world.mount(d.c, d.r, d.side, 0.05);
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.1), new THREE.MeshBasicMaterial({ color: 0x8c1d17 }));
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), new THREE.MeshBasicMaterial({ color: 0xff5a48 }));
      lamp.position.set(0, 0.1, 0.06);
      g.add(box, lamp);
      g.position.set(m.x, 1.45, m.z);
      g.rotation.y = m.yaw;
      this.scene.add(g);
      return { x: (d.c + 0.5) * TILE, z: (d.r + 0.5) * TILE, lamp };
    });
  }

  buildInteractables() {
    const basic = (color) => new THREE.MeshBasicMaterial({ color });
    this.interactables = [];
    for (const d of this.mission.interactables) {
      const hasObjective = this.objectives.some((o) => o.id === d.objective);
      if (!hasObjective && d.kind !== 'breaker') continue;
      const m = this.world.mount(d.c, d.r, d.side, 0.02);
      const [sx, sz] = SIDE[d.side];
      const g = new THREE.Group();
      let markerY = 1.9;
      const it = { ...d, x: m.x, z: m.z, done: false, group: g };

      if (d.style === 'console') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.15, 0.34), basic(0x2a3036));
        body.position.set(0, 0.575, 0.17);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ map: this.tex.screen }));
        screen.position.set(0, 0.86, 0.345);
        it.screenMat = screen.material;
        g.add(body, screen);
        markerY = 1.6;
      } else if (d.style === 'tag') {
        const tag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.06), new THREE.MeshBasicMaterial({ color: 0xe8b34a, transparent: true, opacity: 0.35 }));
        tag.position.set(0, 1.0, 0.03);
        it.tagMat = tag.material;
        g.add(tag);
        markerY = 1.5;
      } else if (d.style === 'charge') {
        // A ghost outline until it is planted, then a block with a live lamp.
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xe8b34a, transparent: true, opacity: 0.35 }));
        block.position.set(0, 1.0, 0.05);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), basic(0xff3a2a));
        lamp.position.set(0.1, 1.04, 0.11);
        lamp.visible = false;
        it.tagMat = block.material;
        it.lamp = lamp;
        g.add(block, lamp);
        markerY = 1.5;
      } else if (d.style === 'safe') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.12), basic(0x3a4046));
        body.position.set(0, 1.25, 0.06);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.05), basic(0x59636c));
        door.position.set(0, 1.25, 0.14);
        const dial = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), basic(0xc9a54e));
        dial.position.set(0.12, 1.25, 0.18);
        it.safeDoor = door;
        it.safeDial = dial;
        g.add(body, door, dial);
        markerY = 1.95;
      } else if (d.style === 'papers') {
        // Sits on the desk in the neighbouring tile rather than on the wall.
        const papers = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.36), basic(0xe9e4d4));
        papers.position.set(0.15, LOW_H + 0.02, -0.5);
        const folder = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.02, 0.42), basic(0x8a2f24));
        folder.position.set(0.15, LOW_H + 0.005, -0.5);
        g.add(folder, papers);
        markerY = 1.7;
      } else if (d.style === 'breaker') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.16), basic(0x5d646b));
        box.position.set(0, 1.4, 0.08);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.17), basic(0xe8b34a));
        stripe.position.set(0, 1.7, 0.08);
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), basic(0xd43a2f));
        lever.position.set(0.12, 1.4, 0.2);
        it.lever = lever;
        g.add(box, stripe, lever);
        markerY = 2.15;
      }

      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), new THREE.MeshBasicMaterial({ color: 0xffc94d, fog: false }));
      marker.position.set(0, markerY, d.style === 'papers' ? -0.5 : 0.25);
      it.marker = marker;
      it.markerY = markerY;
      g.add(marker);
      g.position.set(m.x, 0, m.z);
      g.rotation.y = m.yaw;
      this.scene.add(g);
      // Stand-off point used for range checks: a little into the room from the mount.
      it.px = m.x - sx * 0.3; it.pz = m.z - sz * 0.3;
      this.interactables.push(it);
    }
  }

  spawnPickup(kind, x, z) {
    const def = PICKUPS[kind];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...def.size), new THREE.MeshBasicMaterial({ color: def.color }));
    mesh.position.set(x, 0.6, z);
    const shadow = this.world.blob(0.7);
    shadow.position.set(x, 0.015, z);
    this.scene.add(mesh, shadow);
    this.pickups.push({ kind, x, z, mesh, shadow, phase: Math.random() * 6, taken: false });
  }

  // --- input ---------------------------------------------------------------

  bindInput() {
    const k = this.input;
    const locked = () => this.noLock || document.pointerLockElement === this.canvas;

    addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (this.state === 'paused' && this.noLock && e.code === 'KeyP') { this.resume(); return; }
      if (this.state !== 'playing') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) k.pressed.add(e.code);
      k.keys.add(e.code);
      if (this.noLock && e.code === 'KeyP') this.pause();
    });
    addEventListener('keyup', (e) => k.keys.delete(e.code));
    addEventListener('blur', () => { k.keys.clear(); k.fire = false; k.aim = false; });
    addEventListener('mousemove', (e) => {
      if (this.state !== 'playing' || !locked()) return;
      // Browsers occasionally report a huge jump when the pointer lock engages.
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      k.mdx += e.movementX; k.mdy += e.movementY;
    });
    addEventListener('mousedown', (e) => {
      if (this.state !== 'playing' || !locked()) return;
      if (e.button === 2) k.aim = true;
      if (e.button !== 0) return;
      k.fire = true; k.firePressed = true;
    });
    addEventListener('mouseup', (e) => { if (e.button === 0) k.fire = false; if (e.button === 2) k.aim = false; });
    addEventListener('wheel', (e) => { if (this.state === 'playing') k.wheel += Math.sign(e.deltaY); }, { passive: true });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      if (this.noLock) return;
      if (document.pointerLockElement === this.canvas) {
        if (this.state === 'paused') this.setPlaying();
      } else if (this.state === 'playing') {
        this.pause();
      }
    });
    document.addEventListener('pointerlockerror', () => {
      if (this.state === 'paused') this.ui.onPause(this.objectives, true);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause();
    });
  }

  clearInput() {
    const k = this.input;
    k.pressed.clear(); k.firePressed = false; k.mdx = 0; k.mdy = 0; k.wheel = 0;
  }

  // --- flow ----------------------------------------------------------------

  start(diffKey, index = this.missionIndex) {
    this.audio.init();
    this.setup(diffKey, index);
    this.hud.reset();
    this.hud.show(true);
    this.state = 'paused';
    this.audio.startMusic();
    this.audio.setIntensity(0);
    for (const [text, delay] of this.mission.radio.start) this.radio(text, delay);
    this.startClocks('start');
    this.resume();
  }

  setPlaying() {
    this.state = 'playing';
    this.input.keys.clear();
    this.input.fire = false;
    this.clearInput();
    this.last = performance.now();
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    this.ui.onResume();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.audio.init();
    if (this.noLock) { this.setPlaying(); return; }
    let req;
    try { req = this.canvas.requestPointerLock(); } catch { req = null; }
    if (req && req.catch) req.catch(() => this.ui.onPause(this.objectives, true));
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.keys.clear();
    this.input.fire = false;
    if (this.audio.ctx) this.audio.ctx.suspend();
    this.ui.onPause(this.objectives, false);
  }

  quit() {
    this.state = 'menu';
    this.audio.alarm(false);
    this.audio.stopMusic();
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    if (document.pointerLockElement) document.exitPointerLock();
    this.hud.show(false);
    this.setup('operative');
  }

  /** Show a different mission behind the menus. */
  preview(index) {
    if (this.state === 'menu' && index !== this.missionIndex) this.setup('operative', index);
  }

  drawMap(canvas) { this.map.draw(canvas); }

  finish(success, reason) {
    if (this.state === 'ended') return;
    this.state = 'ended';
    this.audio.alarm(false);
    this.audio.stopMusic();
    this.audio.play(success ? 'success' : 'fail');
    if (document.pointerLockElement) document.exitPointerLock();
    this.hud.show(false);
    const s = this.stats;
    let rating = null;
    if (success) {
      if (s.alerts === 0 && s.alarms === 0) rating = { name: 'GHOST', note: 'Nobody ever knew you were there.' };
      else if (s.alarms === 0) rating = { name: 'PROFESSIONAL', note: 'Seen, but the alarm never sounded.' };
      else rating = { name: 'BLUNT INSTRUMENT', note: 'Everybody heard you. The job still got done.' };
    }
    this.ui.onEnd({
      success, reason, rating,
      mission: this.mission,
      missionIndex: this.missionIndex,
      level: this.diff.level,
      difficulty: this.diff.name,
      time: this.time,
      stats: s,
      accuracy: s.shots ? Math.round((s.hits / s.shots) * 100) : null,
      objectives: this.objectives,
    });
  }

  onPlayerDeath() {
    this.deathT = 1.8;
    this.audio.setIntensity(0);
  }

  // --- messages ------------------------------------------------------------

  radio(text, delay = 0) {
    this.radioQueue.push({ text, t: this.time + delay });
  }

  hintOnce(id, text) {
    if (this.hinted.has(id)) return;
    this.hinted.add(id);
    this.radio(text);
  }

  // --- world events --------------------------------------------------------

  hittables() {
    const list = [];
    for (const g of this.guards) if (!g.dead) list.push(...g.hitParts);
    for (const c of this.cameras) if (c.alive) list.push(c.hitPart);
    return list;
  }

  /** Something made a sound. Guards within earshot react; walls muffle it. */
  emitNoise(x, z, radius, loud) {
    for (const g of this.guards) {
      if (g.dead || g.inCombat) continue;
      const d = Math.hypot(g.x - x, g.z - z);
      if (d > radius) continue;
      if (d > radius * 0.55 && !this.grid.los(x, z, g.x, g.z)) continue;
      g.hear(this, x, z, loud);
    }
  }

  // --- grenades ------------------------------------------------------------

  throwGrenade(p) {
    const d = p.viewDir(0, 0.12);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.11), new THREE.MeshBasicMaterial({ color: 0x4f6b3a }));
    this.scene.add(mesh);
    this.grenades.push({
      x: p.x + d.x * 0.4, y: p.eyeY - 0.15, z: p.z + d.z * 0.4,
      vx: d.x * 15 + p.vx * 0.5, vy: d.y * 15 + 1.5, vz: d.z * 15 + p.vz * 0.5,
      fuse: GRENADE.fuse, mesh,
    });
    this.audio.play('swing');
  }

  updateGrenades(dt) {
    const grid = this.grid;
    const blocked = (x, y, z) => y < grid.height(Math.floor(x / TILE), Math.floor(z / TILE));
    for (const g of this.grenades) {
      g.fuse -= dt;
      g.vy -= 16 * dt;
      // Move one axis at a time so it bounces off whichever face it meets.
      let bounced = false;
      const nx = g.x + g.vx * dt;
      if (blocked(nx, g.y, g.z)) { g.vx *= -0.4; bounced = true; } else g.x = nx;
      const nz = g.z + g.vz * dt;
      if (blocked(g.x, g.y, nz)) { g.vz *= -0.4; bounced = true; } else g.z = nz;
      let ny = g.y + g.vy * dt;
      const floor = Math.max(0, Number.isFinite(grid.height(Math.floor(g.x / TILE), Math.floor(g.z / TILE))) ? grid.height(Math.floor(g.x / TILE), Math.floor(g.z / TILE)) : 0) + 0.07;
      if (ny < floor && g.vy < 0) {
        ny = floor;
        if (g.vy < -2) bounced = true;
        g.vy *= -0.35; g.vx *= 0.6; g.vz *= 0.6;
        if (Math.abs(g.vy) < 0.8) g.vy = 0;
      }
      g.y = Math.min(ny, 3.1);
      if (bounced && Math.hypot(g.vx, g.vy, g.vz) > 1.5) {
        // The clatter carries: guards nearby come to look, which makes it a lure as well.
        this.audio.playAt('clink', g.x, g.z, 0.7);
        this.emitNoise(g.x, g.z, 7, false);
      }
      g.mesh.position.set(g.x, g.y, g.z);
      g.mesh.rotation.x += dt * 9; g.mesh.rotation.z += dt * 6;
      if (g.fuse <= 0) this.explode(g);
    }
    this.grenades = this.grenades.filter((g) => g.fuse > 0);
  }

  explode(g) {
    this.scene.remove(g.mesh);
    g.mesh.geometry.dispose(); g.mesh.material.dispose();
    const ex = g.x, ey = Math.max(g.y, 0.5) + 0.3, ez = g.z, R = GRENADE.radius;
    this.audio.playAt('explosion', ex, ez, 1.6);
    this.world.blast(ex, ey, ez);
    this.hud.flash();
    const reach = (x, y, z) => {
      const d = Math.hypot(x - ex, z - ez);
      return d < R && (d < 1.2 || this.grid.visible(ex, ey, ez, x, y, z)) ? 1 - d / R : 0;
    };
    let downed = 0;
    for (const guard of this.guards) {
      if (guard.dead) continue;
      const f = reach(guard.x, 1.2, guard.z);
      if (f > 0 && guard.damage(this, 'torso', GRENADE.damage * f, false)) downed++;
    }
    if (downed) this.hud.hit(true);
    for (const c of this.cameras) if (c.alive && reach(c.x, 2.4, c.z) > 0.25) c.destroy(this);
    const p = this.player;
    const pf = reach(p.x, p.eyeY, p.z);
    if (pf > 0) p.damage(GRENADE.selfDamage * pf, ex, ez);
    this.emitNoise(ex, ez, 48, true);
  }

  /** Gunfire from a guard pulls in everyone nearby. */
  alertNearby(x, z, radius, src) {
    for (const g of this.guards) {
      if (g === src || g.dead || g.inCombat) continue;
      if (Math.hypot(g.x - x, g.z - z) > radius) continue;
      g.lastKnown = { ...src.lastKnown };
      g.enterCombat(this, false);
    }
  }

  onGuardAlerted() {
    this.stats.alerts++;
    if (this.time - this.lastSting > 0.6) { this.audio.play('alert'); this.lastSting = this.time; }
  }

  onSuspicious() {
    if (this.time - this.lastSting > 1.5) { this.audio.play('suspicious'); this.lastSting = this.time; }
  }

  warnRunner() {
    if (this.time - this.lastRunnerMsg < 8) return;
    this.lastRunnerMsg = this.time;
    this.hud.message('A guard is running for an alarm panel. Stop him.', 'warn', 4);
  }

  onGuardDown(g) {
    this.stats.kills++;
    if (g.drops) this.dropItem(g.drops, g.x, g.z);
    if (g.def.objective) this.advanceObjective(g.def.objective, 'Down:');
    // Heavies posted by the mission carry a grenade; alarm reinforcements do not.
    if (g.def.type === 'heavy' && !g.def.reinforcement) this.spawnPickup('grenade', g.x + 0.3, g.z - 0.4);
    this.spawnPickup(['officer', 'target', 'boss'].includes(g.def.type) ? 'ammoPistol' : 'smg', g.x - 0.3, g.z - 0.3);
  }

  /**
   * Drop something a guard was carrying. A keycard must never land where the player
   * cannot get to it (say, behind a locked door the guard had wandered through), so
   * it is moved to the nearest floor the player can reach with the cards they hold.
   */
  dropItem(kind, gx, gz) {
    const G = this.grid, p = this.player;
    let x = gx + 0.4, z = gz + 0.3;
    if (G.ch(G.tileC(x), G.tileR(z)) !== '.') { x = gx; z = gz; }
    if (kind === 'keyBlue' || kind === 'keyRed') {
      const open = (c, r) => {
        const ch = G.ch(c, r);
        if (ch === '.') return true;
        if (ch !== 'D') return false;
        const d = G.doorAt.get(r * G.cols + c);
        return !d.lock || p.keys.has(d.lock);
      };
      const seen = new Set([G.tileR(p.z) * G.cols + G.tileC(p.x)]);
      const queue = [[G.tileC(p.x), G.tileR(p.z)]];
      for (let i = 0; i < queue.length; i++) {
        const [c, r] = queue[i];
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = (r + dr) * G.cols + c + dc;
          if (seen.has(k) || !open(c + dc, r + dr)) continue;
          seen.add(k);
          queue.push([c + dc, r + dr]);
        }
      }
      if (!seen.has(G.tileR(z) * G.cols + G.tileC(x))) {
        let best = null, bd = Infinity;
        for (const [c, r] of queue) {
          if (G.ch(c, r) !== '.') continue;
          const d = Math.hypot(G.cx(c) - gx, G.cz(r) - gz);
          if (d < bd) { bd = d; best = [c, r]; }
        }
        if (best) {
          x = G.cx(best[0]); z = G.cz(best[1]);
          this.hud.message('The keycard skidded clear of the locked door. It is on your side.', 'info', 6);
        }
      }
    }
    this.spawnPickup(kind, x, z);
  }

  nearestPanel(x, z) {
    let best = null, bd = 60;
    for (const p of this.panels) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  triggerAlarm(x, z, why) {
    const a = this.alarm;
    if (!a.enabled || a.active) return;
    a.active = true;
    a.t = 40;
    a.trackT = 2.5;
    this.stats.alarms++;
    this.hud.alarm(true);
    this.audio.alarm(true);
    this.hud.message(`ALARM. ${why}`, 'warn', 6);
    this.startClocks('alarm');
    for (const g of this.guards) {
      if (g.dead) continue;
      g.lastKnown = { x, z };
      g.enterCombat(this, false);
    }
    const maxWaves = this.diff.level >= 2 ? 2 : 1;
    if (a.waves < maxWaves) {
      a.waves++;
      a.pending = this.diff.reinforce;
      a.reT = 5;
      this.radio(this.mission.radio.alarm, 1.5);
    }
  }

  updateAlarm(dt) {
    const a = this.alarm, p = this.player;
    if (!a.active) return;
    a.t -= dt;
    a.trackT -= dt;
    if (a.trackT <= 0) {
      // While the alarm runs the cameras keep feeding guards your position.
      a.trackT = 3;
      for (const g of this.guards) if (!g.dead && g.state === 'combat' && !g.seesPlayer) { g.lastKnown = { x: p.x, z: p.z }; g.pathKey = -1; g.lostT = 0; }
    }
    if (a.pending > 0) {
      a.reT -= dt;
      if (a.reT <= 0) {
        a.reT = 0.9;
        const re = this.mission.reinforce;
        const spot = re[a.pending % re.length];
        const sx = (spot[0] + 0.5) * TILE, sz = (spot[1] + 0.5) * TILE;
        if (Math.hypot(sx - p.x, sz - p.z) > 10 || !this.grid.los(sx, sz, p.x, p.z)) {
          const g = new Guard(this, { type: 'heavy', patrol: [spot], reinforcement: true });
          g.lastKnown = { x: p.x, z: p.z };
          this.guards.push(g);
          g.enterCombat(this, false);
        }
        a.pending--;
      }
    }
    for (const pn of this.panels) pn.lamp.material.color.set(Math.sin(this.time * 12) > 0 ? 0xffffff : 0xff3a2a);
    if (a.t <= 0 && !this.guards.some((g) => g.seesPlayer)) this.endAlarm('The alarm has timed out. They are still looking.');
  }

  endAlarm(msg) {
    const a = this.alarm;
    if (!a.active) return;
    a.active = false;
    this.hud.alarm(false);
    this.audio.alarm(false);
    for (const pn of this.panels) pn.lamp.material.color.set(a.enabled ? 0xff5a48 : 0x221110);
    if (msg) this.hud.message(msg, 'info', 5);
  }

  // --- objectives and interaction -----------------------------------------

  completeObjective(id) {
    const o = this.objectives.find((x) => x.id === id);
    if (!o || o.done) return;
    o.done = true;
    this.audio.play('objective');
    this.hud.message(`OBJECTIVE COMPLETE: ${o.text}`, 'objective', 6);
    const left = this.objectives.filter((x) => !x.done && x.id !== 'extract');
    if (!left.length && id !== 'extract') {
      this.world.setExitReady(true);
      this.radio(this.mission.radio.exitOpen, 1.5);
    }
    // Clocks that were waiting on this objective stop; clocks that follow it start.
    for (const c of this.countdowns) if (c.def.until === id && c.def.stopped) this.hud.message(c.def.stopped, 'info', 5);
    this.countdowns = this.countdowns.filter((c) => c.def.until !== id);
    this.startClocks('objective', id);
  }

  /**
   * Mission clocks. A mission lists one or several under `countdown`; each starts
   * `after` an objective, or `on` 'start' or 'alarm', and fails the mission at zero
   * unless its `until` objective is finished first.
   */
  startClocks(event, id) {
    const cd = this.mission.countdown;
    for (const def of !cd ? [] : Array.isArray(cd) ? cd : [cd]) {
      const hit = event === 'objective' ? def.after === id : def.on === event;
      if (!hit || this.countdowns.some((c) => c.def === def)) continue;
      if (def.until) {
        const o = this.objectives.find((x) => x.id === def.until);
        if (!o || o.done) continue;
      }
      this.countdowns.push({ t: def.seconds[this.diff.level], label: def.label, def });
      if (def.radio) this.radio(def.radio, 0.5);
    }
  }

  /** The clock closest to running out, if any. */
  get countdown() {
    return this.countdowns.reduce((a, c) => (!a || c.t < a.t ? c : a), null);
  }

  /** One interactable for this objective is done; finish the objective when they all are. */
  advanceObjective(id, partial) {
    const o = this.objectives.find((x) => x.id === id);
    if (!o || o.done) return;
    o.have = Math.min(o.need, o.have + 1);
    if (o.have >= o.need) this.completeObjective(id);
    else {
      this.audio.play('beep');
      this.hud.message(`${partial} ${o.have} of ${o.need}.`, 'objective', 4);
    }
  }

  findInteractable() {
    const p = this.player;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let best = null, bd = 2.3;
    for (const it of this.interactables) {
      if (it.done) continue;
      const dx = it.x - p.x, dz = it.z - p.z, d = Math.hypot(dx, dz);
      if (d > bd) continue;
      if (d > 0.7 && (dx * fx + dz * fz) / d < 0.4) continue;
      best = it; bd = d;
    }
    return best;
  }

  useInteractable(it) {
    it.done = true;
    it.marker.visible = false;
    if (it.tagMat) { it.tagMat.opacity = 1; it.tagMat.color.set(0x2a2d31); }
    if (it.lamp) it.lamp.visible = true;
    switch (it.kind) {
      case 'download':
        this.download = { t: 0, dur: it.time, it, warned: false };
        this.audio.play('beep');
        this.radio(it.radio);
        if (this.diff.level >= 1) {
          this.radio(it.company, 3);
          // The two closest calm guards come to take a look.
          const calm = this.guards.filter((g) => !g.dead && !g.inCombat)
            .sort((a, b) => Math.hypot(a.x - it.x, a.z - it.z) - Math.hypot(b.x - it.x, b.z - it.z))
            .filter((g) => Math.hypot(g.x - it.x, g.z - it.z) > 8).slice(0, 2);
          this.downloadVisitors = { t: 4, guards: calm, it };
        }
        break;
      case 'plant':
        this.audio.play('beep');
        this.advanceObjective(it.objective, it.partial || 'Charge set:');
        break;
      case 'photo':
        this.hud.flash();
        this.audio.play('shutter');
        this.advanceObjective(it.objective, 'Photographed:');
        break;
      case 'use':
        if (it.safeDoor) { it.safeDoor.position.x -= 0.5; it.safeDial.visible = false; }
        if (it.screenMat) it.screenMat.color.set(0x553322);
        this.audio.play(it.safeDoor ? 'key' : 'power');
        this.advanceObjective(it.objective, 'Done:');
        break;
      case 'breaker':
        it.lever.position.y -= 0.2;
        this.alarm.enabled = false;
        this.audio.play('power');
        for (const c of this.cameras) c.powerDown();
        this.endAlarm(null);
        for (const pn of this.panels) pn.lamp.material.color.set(0x221110);
        this.hud.message('Alarm grid offline. Cameras and alarm panels are dead.', 'info', 6);
        this.completeObjective(it.objective);
        break;
    }
  }

  updateInteraction(dt) {
    const p = this.player, k = this.input.keys;
    let prompt = null;

    const it = p.dead ? null : this.findInteractable();
    if (it) {
      prompt = `Hold E: ${it.label}`;
      if (k.has('KeyE')) {
        if (this.holdTarget !== it) { this.holdTarget = it; this.holdT = 0; }
        this.holdT += dt;
        if (this.holdT >= it.hold) {
          this.useInteractable(it);
          this.holdTarget = null;
        }
      } else this.holdTarget = null;
    } else this.holdTarget = null;

    if (!prompt && this.lockedDoor) {
      const lock = this.lockedDoor.lock;
      prompt = `Locked. ${lock === 'blue' ? 'Blue' : 'Red'} keycard required.`;
      if (!this.player.keys.has(lock)) this.hintOnce(lock, lock === 'blue' ? this.mission.radio.doorBlue : this.mission.radio.doorRed);
    }

    // Extraction
    if (!p.dead && Math.hypot(p.x - this.exit.x, p.z - this.exit.z) < 1.3) {
      const left = this.objectives.filter((o) => !o.done && o.id !== 'extract').length;
      if (left) prompt = `${this.mission.exitName}. ${left} objective${left > 1 ? 's' : ''} still open.`;
      else {
        this.completeObjective('extract');
        this.finish(true);
        return;
      }
    }

    // Download progress
    let progressShown = false;
    const dl = this.download;
    if (dl) {
      const near = Math.hypot(p.x - dl.it.x, p.z - dl.it.z) < 9 && this.grid.los(p.x, p.z, dl.it.px, dl.it.pz);
      if (near) {
        const before = dl.t;
        dl.t += dt;
        if (Math.floor(before) !== Math.floor(dl.t)) this.audio.playAt('beep', dl.it.x, dl.it.z, 0.6);
        this.hud.progress(`${dl.it.progress}  ${Math.floor((dl.t / dl.dur) * 100)}%`, dl.t / dl.dur);
        dl.warned = false;
      } else {
        this.hud.progress(dl.it.lost, dl.t / dl.dur);
        if (!dl.warned) { dl.warned = true; this.audio.play('click'); }
      }
      progressShown = true;
      if (dl.t >= dl.dur) {
        this.download = null;
        progressShown = false;
        this.completeObjective(dl.it.objective);
      }
    }
    if (this.downloadVisitors) {
      this.downloadVisitors.t -= dt;
      if (this.downloadVisitors.t <= 0) {
        const t = this.downloadVisitors.it;
        for (const g of this.downloadVisitors.guards) if (!g.dead && !g.inCombat) g.hear(this, t.px, t.pz, false);
        this.downloadVisitors = null;
      }
    }
    if (!progressShown) {
      if (this.holdTarget) this.hud.progress(this.holdTarget.label.toUpperCase(), this.holdT / this.holdTarget.hold);
      else this.hud.progress(null);
    }
    this.hud.prompt(prompt);
  }

  updatePickups(dt) {
    const p = this.player;
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      pk.phase += dt;
      pk.mesh.rotation.y = pk.phase * 1.8;
      pk.mesh.position.y = 0.6 + Math.sin(pk.phase * 2.2) * 0.07;
      if (p.dead || Math.hypot(p.x - pk.x, p.z - pk.z) > 1.0) continue;
      let took = true;
      switch (pk.kind) {
        case 'keyBlue':
          p.keys.add('blue'); this.audio.play('key');
          this.hud.message('Blue keycard acquired.', 'info');
          this.radio(this.mission.radio.keyBlue, 0.5);
          break;
        case 'keyRed':
          p.keys.add('red'); this.audio.play('key');
          this.hud.message('Red keycard acquired.', 'info');
          this.radio(this.mission.radio.keyRed, 0.5);
          break;
        case 'armor':
          if (p.armor >= 100) { took = false; break; }
          p.armor = 100; this.audio.play('pickup');
          this.hud.message('Body armour.', 'info', 2.5);
          break;
        case 'ammoPistol':
          p.ammo.pistol.res += 16; this.audio.play('pickup');
          this.hud.message('Pistol rounds +16', 'info', 2.5);
          break;
        case 'ammoSmg':
          p.ammo.smg.res += 30; this.audio.play('pickup');
          this.hud.message('Submachine gun rounds +30', 'info', 2.5);
          break;
        case 'ammoShells':
          p.ammo.shotgun.res += 6; this.audio.play('pickup');
          this.hud.message('Shotgun shells +6', 'info', 2.5);
          break;
        case 'ammoRifle':
          p.ammo.rifle.res += 5; this.audio.play('pickup');
          this.hud.message('Rifle rounds +5', 'info', 2.5);
          break;
        case 'grenade':
          if (p.grenades >= 4) { took = false; break; }
          p.grenades++; this.audio.play('pickup');
          this.hud.message(p.grenades === 1 ? 'Grenade. Press G to throw it.' : `Grenade (${p.grenades})`, 'info', p.grenades === 1 ? 5 : 2.5);
          break;
        case 'shotgun':
        case 'rifle': {
          this.audio.play('pickup');
          const W = WEAPONS[pk.kind], am = p.ammo[pk.kind], shotgun = pk.kind === 'shotgun';
          if (!p.owned.has(pk.kind)) {
            p.owned.add(pk.kind);
            am.mag = W.mag; am.res += shotgun ? 5 : 5;
            this.hud.message(shotgun
              ? 'Brant 12 shotgun. Press 4 to draw it. Brutal up close, and very loud.'
              : 'Lynx marksman rifle. Press 5 to draw it; hold right mouse to aim.', 'info', 6);
          } else {
            am.res += shotgun ? 4 : 3;
            this.hud.message(shotgun ? 'Shotgun shells +4' : 'Rifle rounds +3', 'info', 2.5);
          }
          break;
        }
        case 'smg':
          this.audio.play('pickup');
          if (!p.hasSmg) {
            p.hasSmg = true;
            p.ammo.smg.mag = 20;
            this.hud.message('Volk submachine gun. Press 3 to draw it. It is loud.', 'info', 5);
          } else {
            p.ammo.smg.res += 12;
            this.hud.message('Submachine gun rounds +12', 'info', 2.5);
          }
          break;
      }
      if (took) {
        pk.taken = true;
        this.scene.remove(pk.mesh, pk.shadow);
      }
    }
  }

  // --- frame ---------------------------------------------------------------

  update(dt) {
    this.time += dt;
    const p = this.player;
    p.update(dt, this);
    this.world.updateDoors(dt, this);
    for (const g of this.guards) g.update(dt, this);
    for (const c of this.cameras) c.update(dt, this);
    this.updatePickups(dt);
    this.updateGrenades(dt);
    this.updateAlarm(dt);
    this.world.update(dt);
    for (const it of this.interactables) {
      if (!it.done) { it.marker.rotation.y += dt * 2; it.marker.position.y = it.markerY + Math.sin(this.time * 3) * 0.05; }
    }

    while (this.radioQueue.length && this.radioQueue[0].t <= this.time) {
      this.hud.message(this.radioQueue.shift().text, 'radio', 7);
      this.audio.play('beep', 0.6);
    }
    this.radioQueue.sort((a, b) => a.t - b.t);

    if (p.dead) {
      this.deathT -= dt;
      if (this.deathT <= 0) { this.finish(false, 'Agent down.'); return; }
    }
    this.updateInteraction(dt);
    if (this.state !== 'playing') return;

    for (const c of this.countdowns) {
      const before = c.t;
      c.t -= dt;
      if (c.t <= 10 && Math.floor(before) !== Math.floor(c.t)) this.audio.play('beep', 0.8);
      if (c.t <= 0) { this.finish(false, c.def.fail); return; }
    }
    const clock = this.countdown;
    this.hud.timer(clock ? clock.label : null, clock ? clock.t : 0);
    this.map.update(dt);

    // HUD
    let level = 0, status = 'hidden';
    for (const g of this.guards) {
      if (g.dead) continue;
      if (g.inCombat) status = 'combat';
      else {
        level = Math.max(level, g.awareness);
        if ((g.state === 'investigate' || g.state === 'search') && status !== 'combat') status = 'suspicious';
      }
    }
    for (const c of this.cameras) level = Math.max(level, c.meter);
    if (this.alarm.active) status = 'combat';
    this.hud.detection(level, status);
    this.audio.setIntensity(p.dead ? 0 : status === 'combat' || this.countdown ? 1 : status === 'suspicious' ? 0.5 : level > 0.3 ? 0.35 : 0);

    const W = WEAPONS[p.pending || p.weapon];
    const am = p.ammo[p.pending || p.weapon];
    this.hud.weapon(p.reloadT > 0 ? 'RELOADING' : W.name, am ? am.mag : null, am ? am.res : 0, p.grenades);
    this.hud.vitals(p.hp, p.armor, p.crouching);
    this.hud.setKeys(p.keys);
    const tab = this.input.keys.has('Tab');
    this.hud.objectives(this.objectives, tab, this.map.zoneName());
    if (tab) this.map.draw(this.hud.mapCanvas);
    this.hud.update(dt, p.hp);

    this.audio.listener.x = p.x; this.audio.listener.z = p.z; this.audio.listener.yaw = p.yaw;
    this.clearInput();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    // Render at roughly 540 lines and scale up with hard pixels.
    const scale = Math.max(1, Math.round(h / 540));
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(Math.ceil(w / scale), Math.ceil(h / scale), false);
    this.post.setSize(Math.ceil(w / scale), Math.ceil(h / scale));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.player) { this.player.vmCam.aspect = w / h; this.player.vmCam.updateProjectionMatrix(); }
  }

  frame(now) {
    requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;

    if (this.state === 'playing') this.update(dt);
    else this.clearInput();

    if (this.state === 'menu') {
      // Slow pan around the level behind the menus.
      this.menuT += dt;
      const [mc, mr] = this.mission.menuCam;
      this.camera.position.set(this.grid.cx(mc), 2.5, this.grid.cz(mr));
      this.camera.rotation.set(-0.16, this.menuT * 0.1 + 2.4, 0, 'YXZ');
    } else {
      this.player.applyCamera(this.camera);
    }

    if (this.world.sky) this.world.sky.position.copy(this.camera.position);
    const r = this.renderer;
    this.post.begin();
    r.render(this.scene, this.camera);
    if (this.state === 'playing' || this.state === 'paused') {
      const vm = this.player.vmCam;
      if (vm.aspect !== this.camera.aspect) { vm.aspect = this.camera.aspect; vm.updateProjectionMatrix(); }
      r.clearDepth();
      r.render(this.player.vmScene, vm);
    }
    this.post.end(now / 1000);
  }
}
