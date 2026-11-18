// Guards and security cameras: models, senses and behaviour.
import * as THREE from 'three';
import { TILE } from './grid.js';

const TYPES = {
  guard: { hp: 100, torso: 0x56684f, legs: 0x343f33, cap: 0x222a22, skin: 0xcfa585 },
  officer: { hp: 90, torso: 0x34406a, legs: 0x222840, cap: 0x8a2222, skin: 0xd6b090 },
  heavy: { hp: 150, torso: 0x2e3136, legs: 0x1e2024, cap: 0x121315, skin: 0xbd9374 },
  // People a mission is sent after: set `objective` on the guard to tie one to an objective.
  target: { hp: 130, torso: 0xb9b2a0, legs: 0x8c8676, cap: 0x3a2c22, skin: 0xd2a98a },
  boss: { hp: 220, torso: 0x6e1f24, legs: 0x1c1c20, cap: 0xb4b4b4, skin: 0xcaa288 },
};
const ZONE_MULT = { head: 4, torso: 1, arm: 0.6, leg: 0.55 };
const EYE = 1.62;

const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = `${w},${h},${d}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); }
  return g;
}
const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
const rand = (a, b) => a + Math.random() * (b - a);
const tmpColor = new THREE.Color();

export class Guard {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.type = TYPES[def.type] || TYPES.guard;
    this.patrol = def.patrol.map(([c, r]) => ({ x: (c + 0.5) * TILE, z: (r + 0.5) * TILE }));
    this.x = this.patrol[0].x;
    this.z = this.patrol[0].z;
    this.homeFacing = def.facing ?? 0;
    this.facing = this.homeFacing;
    this.hp = this.type.hp;
    this.runner = !!def.runner;
    this.drops = def.drops || null;

    this.state = 'patrol';
    this.dead = false;
    this.awareness = 0;
    this.wary = false;
    this.seesPlayer = false;
    this.wp = this.patrol.length > 1 ? 1 : 0;
    this.wait = rand(0, 1.5);
    this.path = null;
    this.pathKey = -1;
    this.moving = false;
    this.moveDir = this.facing;
    this.walkPhase = Math.random() * 6;
    this.lastKnown = null;
    this.inv = null;
    this.reaction = 0;
    this.fireT = 0;
    this.burst = 3;
    this.lostT = 0;
    this.strafeT = rand(1, 2.5);
    this.strafeGoal = null;
    this.flinch = 0;
    this.slowT = 0;
    this.armHurt = 0;
    this.muzzleT = 0;
    this.markT = 0;
    this.bodyT = rand(0, 0.5);
    this.bodySeen = false;
    this.fallT = 0;
    this.fallDir = -1;
    this.idleT = Math.random() * 10;

    this.build();
  }

  build() {
    const T = this.type;
    this.mats = [];
    this.hitParts = [];
    const part = (w, h, d, color, zone) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      this.mats.push({ mat, base: new THREE.Color(color) });
      const m = new THREE.Mesh(boxGeo(w, h, d), mat);
      if (zone) { m.userData.guard = this; m.userData.zone = zone; this.hitParts.push(m); }
      return m;
    };

    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);

    const leg = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.86, 0);
      const m = part(0.19, 0.86, 0.22, T.legs, 'leg');
      m.position.y = -0.43;
      pivot.add(m);
      this.body.add(pivot);
      return pivot;
    };
    this.legL = leg(-0.12);
    this.legR = leg(0.12);

    const torso = part(0.5, 0.62, 0.28, T.torso, 'torso');
    torso.position.y = 1.17;
    this.body.add(torso);
    const belt = part(0.52, 0.07, 0.3, 0x15171a);
    belt.position.y = 0.89;
    this.body.add(belt);

    this.head = new THREE.Group();
    this.head.position.y = 1.62;
    const skull = part(0.25, 0.27, 0.25, T.skin, 'head');
    const cap = part(0.28, 0.1, 0.29, T.cap, 'head');
    cap.position.y = 0.17;
    const brim = part(0.26, 0.03, 0.12, T.cap);
    brim.position.set(0, 0.13, 0.18);
    const eyes = part(0.2, 0.04, 0.02, 0x1a1410);
    eyes.position.set(0, 0.03, 0.126);
    this.head.add(skull, cap, brim, eyes);
    this.body.add(this.head);

    const arm = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.44, 0);
      const m = part(0.15, 0.6, 0.17, T.torso, 'arm');
      m.position.y = -0.28;
      const hand = part(0.13, 0.1, 0.14, T.skin);
      hand.position.y = -0.62;
      pivot.add(m, hand);
      this.body.add(pivot);
      return pivot;
    };
    this.armL = arm(-0.33);
    this.armR = arm(0.33);
    const gun = part(0.07, 0.52, 0.11, 0x101214);
    gun.position.set(0, -0.82, 0.06);
    this.armR.add(gun);

    // Muzzle flash, parented to the gun arm.
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.game.tex.flash, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    this.flash.scale.setScalar(0.5);
    this.flash.position.set(0, -1.15, 0.06);
    this.flash.visible = false;
    this.armR.add(this.flash);

    // "?" / "!" marker above the head.
    this.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.game.tex.markQuestion, depthWrite: false, transparent: true }));
    this.mark.scale.setScalar(0.5);
    this.mark.position.y = 2.2;
    this.mark.visible = false;
    this.root.add(this.mark);

    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.y = this.facing;
    this.game.scene.add(this.root);
  }

  get inCombat() { return this.state === 'combat' || this.state === 'alarmRun'; }

  showMark(alert) {
    this.mark.material.map = alert ? this.game.tex.markAlert : this.game.tex.markQuestion;
    this.mark.visible = true;
    this.markT = alert ? 1.4 : 2.2;
  }

  // --- senses --------------------------------------------------------------

  perceive(dt, game) {
    const p = game.player;
    const dx = p.x - this.x, dz = p.z - this.z;
    const dist = Math.hypot(dx, dz);
    const combat = this.inCombat;
    const range = combat ? 46 : 24;
    let sees = false;
    if (!p.dead && dist < range) {
      const da = Math.abs(wrap(Math.atan2(dx, dz) - this.facing));
      if (da < (combat ? 1.9 : 0.96)) sees = game.grid.visible(this.x, EYE, this.z, p.x, p.eyeY, p.z);
    }
    this.seesPlayer = sees;
    this.distToPlayer = dist;
    if (combat) return;

    if (sees) {
      const light = game.world.brightnessAt(p.x, p.z);
      let rate = (1.9 - 1.5 * dist / range) * (0.4 + 0.8 * Math.min(1, light)) * game.diff.detect;
      if (p.crouching) rate *= 0.6;
      if (p.sprinting) rate *= 1.3;
      if (this.wary) rate *= 1.4;
      if (this.state !== 'patrol') rate *= 1.4;
      if (dist < 3.5) rate *= 2.5;
      this.awareness += rate * dt;
      if (this.awareness >= 1) {
        this.lastKnown = { x: p.x, z: p.z };
        this.enterCombat(game, true);
      } else if (this.awareness > 0.4 && this.state === 'patrol') {
        this.investigate(game, p.x, p.z, false);
      } else if (this.inv) {
        this.inv.x = p.x; this.inv.z = p.z;
      }
    } else {
      this.awareness = Math.max(0, this.awareness - 0.2 * dt);
    }
  }

  /** Look for fallen colleagues while on patrol. */
  checkBodies(dt, game) {
    this.bodyT -= dt;
    if (this.bodyT > 0) return;
    this.bodyT = 0.5;
    for (const o of game.guards) {
      if (!o.dead || o.bodySeen) continue;
      const dx = o.x - this.x, dz = o.z - this.z, d = Math.hypot(dx, dz);
      if (d > 12 || Math.abs(wrap(Math.atan2(dx, dz) - this.facing)) > 0.96) continue;
      if (!game.grid.visible(this.x, EYE, this.z, o.x, 0.3, o.z)) continue;
      o.bodySeen = true;
      game.stats.bodies++;
      this.awareness = Math.max(this.awareness, 0.6);
      this.investigate(game, o.x, o.z, true);
      this.inv.thenSearch = true;
      return;
    }
  }

  hear(game, x, z, loud) {
    if (this.dead || this.inCombat) return;
    this.awareness = Math.max(this.awareness, loud ? 0.7 : 0.45);
    this.investigate(game, x, z, loud);
  }

  // --- state changes -------------------------------------------------------

  investigate(game, x, z, urgent) {
    if (this.dead || this.inCombat) return;
    if (this.state === 'investigate' && this.inv) {
      this.inv.x = x; this.inv.z = z;
      this.inv.urgent = this.inv.urgent || urgent;
      if (this.inv.phase === 'scan') this.inv.phase = 'walk';
      return;
    }
    this.state = 'investigate';
    this.inv = { x, z, urgent, phase: 'look', t: urgent ? 0.35 : 1.0, thenSearch: false };
    this.path = null; this.pathKey = -1;
    this.showMark(false);
    game.onSuspicious(this);
  }

  enterCombat(game, shout) {
    if (this.dead || this.inCombat) return;
    const p = game.player;
    this.state = 'combat';
    this.awareness = 1;
    this.wary = true;
    this.inv = null;
    this.reaction = game.diff.reaction * rand(0.7, 1.3);
    this.burst = 3;
    this.fireT = 0;
    this.lostT = 0;
    this.path = null; this.pathKey = -1;
    this.strafeGoal = null;
    if (!this.lastKnown) this.lastKnown = { x: p.x, z: p.z };
    this.showMark(true);
    game.onGuardAlerted(this);

    if (shout) {
      for (const o of game.guards) {
        if (o === this || o.dead || o.inCombat) continue;
        if (Math.hypot(o.x - this.x, o.z - this.z) < 15) {
          o.lastKnown = { ...this.lastKnown };
          o.enterCombat(game, false);
        }
      }
    }
    if (this.runner && game.alarm.enabled && !game.alarm.active) {
      const panel = game.nearestPanel(this.x, this.z);
      if (panel) {
        this.state = 'alarmRun';
        this.panel = panel;
        game.warnRunner();
      }
    }
  }

  startSearch(x, z) {
    this.state = 'search';
    this.searchT = rand(14, 20);
    this.searchC = { x, z };
    this.searchGoal = null;
    this.scanT = 0;
    this.scanDir = Math.random() < 0.5 ? -1 : 1;
    this.path = null; this.pathKey = -1;
  }

  damage(game, zone, dmg, silent) {
    if (this.dead) return false;
    let mult = ZONE_MULT[zone] || 1;
    if (!this.inCombat) mult *= 1.6; // caught off guard
    this.hp -= dmg * mult;
    if (this.hp <= 0) {
      this.die(game, zone, silent);
      return true;
    }
    this.flinch = 0.35;
    if (zone === 'leg') this.slowT = 3;
    if (zone === 'arm') this.armHurt = 3.5;
    game.audio.playAt('grunt', this.x, this.z, 0.8);
    this.lastKnown = { x: game.player.x, z: game.player.z };
    this.enterCombat(game, true);
    return false;
  }

  die(game, zone, silent) {
    this.dead = true;
    this.state = 'dead';
    this.seesPlayer = false;
    this.awareness = 0;
    this.fallDir = zone === 'leg' ? 1 : -1;
    this.mark.visible = false;
    this.flash.visible = false;
    game.audio.playAt(silent ? 'body' : 'grunt', this.x, this.z, 0.9);
    game.onGuardDown(this);
  }

  // --- movement ------------------------------------------------------------

  /** Walk toward a point along the tile path. Returns true on arrival. */
  goTo(game, tx, tz, speed, dt) {
    const g = game.grid;
    const gc = Math.floor(tx / TILE), gr = Math.floor(tz / TILE);
    const key = gr * g.cols + gc;
    if (this.pathKey !== key || !this.path) {
      this.path = g.findPath(g.tileC(this.x), g.tileR(this.z), gc, gr) || [];
      this.pathKey = key;
    }
    if (!this.path.length) return true;
    if (this.slowT > 0) speed *= 0.5;
    const n = this.path[0];
    for (let i = 0; i < 2 && i < this.path.length; i++) {
      const door = g.doorAt.get(this.path[i].r * g.cols + this.path[i].c);
      if (door) door.hold = 0.5;
    }
    if (g.solid(n.c, n.r)) return false; // waiting for a door
    const dx = n.x - this.x, dz = n.z - this.z, d = Math.hypot(dx, dz);
    const step = speed * dt;
    if (d <= step) {
      this.x = n.x; this.z = n.z;
      this.path.shift();
    } else {
      this.x += (dx / d) * step;
      this.z += (dz / d) * step;
      this.moveDir = Math.atan2(dx, dz);
    }
    this.moving = true;
    this.walkPhase += step * 3.4;
    return this.path.length === 0;
  }

  turnToward(angle, rate, dt) {
    const d = wrap(angle - this.facing);
    const m = rate * dt;
    this.facing = wrap(this.facing + Math.max(-m, Math.min(m, d)));
  }

  // --- main update ---------------------------------------------------------

  update(dt, game) {
    if (this.dead) {
      if (this.fallT < 1) {
        this.fallT = Math.min(1, this.fallT + dt * 2.4);
        const e = 1 - (1 - this.fallT) * (1 - this.fallT);
        this.body.rotation.x = this.fallDir * e * Math.PI / 2;
        this.body.position.y = e * 0.14;
        this.tint(game);
      }
      return;
    }

    const p = game.player;
    this.flinch = Math.max(0, this.flinch - dt);
    this.slowT = Math.max(0, this.slowT - dt);
    this.armHurt = Math.max(0, this.armHurt - dt);
    this.moving = false;
    this.perceive(dt, game);
    let faceMove = true;

    switch (this.state) {
      case 'patrol': {
        this.checkBodies(dt, game);
        const wp = this.patrol[this.wp];
        const away = Math.hypot(wp.x - this.x, wp.z - this.z) > 0.1;
        if (this.patrol.length === 1) {
          if (away) this.goTo(game, wp.x, wp.z, 1.5, dt);
          else {
            this.idleT += dt;
            this.turnToward(this.homeFacing + Math.sin(this.idleT * 0.45) * 0.55, 1.5, dt);
            faceMove = false;
          }
        } else if (this.wait > 0) {
          this.wait -= dt;
          this.idleT += dt;
          this.turnToward(this.moveDir + Math.sin(this.idleT * 1.3) * 0.7, 1.6, dt);
          faceMove = false;
        } else if (this.goTo(game, wp.x, wp.z, 1.5, dt)) {
          this.wp = (this.wp + 1) % this.patrol.length;
          this.wait = rand(1.2, 2.6);
          this.path = null;
        }
        break;
      }

      case 'investigate': {
        const inv = this.inv;
        if (inv.phase === 'look') {
          this.turnToward(Math.atan2(inv.x - this.x, inv.z - this.z), 4, dt);
          faceMove = false;
          inv.t -= dt;
          if (inv.t <= 0) inv.phase = 'walk';
        } else if (inv.phase === 'walk') {
          if (this.goTo(game, inv.x, inv.z, inv.urgent ? 3.4 : 1.9, dt)) { inv.phase = 'scan'; inv.t = 3; }
        } else {
          this.facing = wrap(this.facing + dt * 1.5);
          faceMove = false;
          inv.t -= dt;
          if (inv.t <= 0) {
            this.wary = true;
            if (inv.thenSearch) {
              this.startSearch(inv.x, inv.z);
              for (const o of game.guards) {
                if (o !== this && !o.dead && o.state === 'patrol' && Math.hypot(o.x - this.x, o.z - this.z) < 15) {
                  o.wary = true;
                  o.startSearch(inv.x, inv.z);
                }
              }
            } else {
              this.state = 'patrol';
              this.path = null;
            }
            this.inv = null;
          }
        }
        break;
      }

      case 'search': {
        this.searchT -= dt;
        if (this.searchT <= 0) { this.state = 'patrol'; this.path = null; break; }
        if (this.scanT > 0) {
          this.scanT -= dt;
          this.facing = wrap(this.facing + dt * 1.7 * this.scanDir);
          faceMove = false;
        } else {
          if (!this.searchGoal) {
            for (let i = 0; i < 10; i++) {
              const c = Math.floor(this.searchC.x / TILE) + Math.round(rand(-5, 5));
              const r = Math.floor(this.searchC.z / TILE) + Math.round(rand(-5, 5));
              if (game.grid.ch(c, r) === '.') { this.searchGoal = { x: (c + 0.5) * TILE, z: (r + 0.5) * TILE }; break; }
            }
            if (!this.searchGoal) this.searchGoal = { ...this.searchC };
          }
          if (this.goTo(game, this.searchGoal.x, this.searchGoal.z, 2.4, dt)) {
            this.searchGoal = null;
            this.scanT = rand(1.2, 2.4);
            this.scanDir = Math.random() < 0.5 ? -1 : 1;
          }
        }
        break;
      }

      case 'alarmRun': {
        if (game.alarm.active || !game.alarm.enabled) { this.state = 'combat'; break; }
        if (this.goTo(game, this.panel.x, this.panel.z, 4.4, dt)) {
          game.triggerAlarm(this.lastKnown.x, this.lastKnown.z, 'A guard reached an alarm panel.');
          this.state = 'combat';
          this.path = null;
        }
        break;
      }

      case 'combat': {
        this.reaction -= dt;
        if (this.seesPlayer) {
          this.lostT = 0;
          this.lastKnown = { x: p.x, z: p.z };
          this.turnToward(Math.atan2(p.x - this.x, p.z - this.z), 7, dt);
          faceMove = false;
          if (this.distToPlayer > 16) {
            this.goTo(game, p.x, p.z, 3.6, dt);
          } else {
            this.strafeT -= dt;
            if (this.strafeT <= 0 && !this.strafeGoal) {
              this.strafeT = rand(1.5, 3.5);
              const c = game.grid.tileC(this.x) + Math.round(rand(-1.4, 1.4));
              const r = game.grid.tileR(this.z) + Math.round(rand(-1.4, 1.4));
              const gx = (c + 0.5) * TILE, gz = (r + 0.5) * TILE;
              if (game.grid.ch(c, r) === '.' && Math.hypot(gx - p.x, gz - p.z) > 3 &&
                  game.grid.visible(gx, EYE, gz, p.x, p.eyeY, p.z)) {
                this.strafeGoal = { x: gx, z: gz };
              }
            }
            if (this.strafeGoal && this.goTo(game, this.strafeGoal.x, this.strafeGoal.z, 2.4, dt)) this.strafeGoal = null;
          }
          if (this.reaction <= 0 && this.flinch <= 0) {
            this.fireT -= dt;
            if (this.fireT <= 0) {
              this.shoot(game);
              this.burst--;
              if (this.burst > 0) this.fireT = 0.14;
              else { this.burst = 2 + Math.floor(Math.random() * 3); this.fireT = rand(0.8, 1.6); }
            }
          }
        } else {
          this.lostT += dt;
          this.strafeGoal = null;
          const arrived = this.goTo(game, this.lastKnown.x, this.lastKnown.z, 3.6, dt);
          if (arrived || this.lostT > 14) this.startSearch(this.lastKnown.x, this.lastKnown.z);
        }
        break;
      }
    }

    if (faceMove && this.moving) this.turnToward(this.moveDir, 8, dt);

    // Do not walk into the player's face.
    if (!p.dead) {
      const dx = this.x - p.x, dz = this.z - p.z, d = Math.hypot(dx, dz);
      if (d < 1.15 && d > 0.001) {
        const nx = p.x + (dx / d) * 1.15, nz = p.z + (dz / d) * 1.15;
        if (game.grid.walkable(Math.floor(nx / TILE), Math.floor(nz / TILE))) { this.x = nx; this.z = nz; }
      }
    }

    // Keep guards from standing inside one another.
    for (const o of game.guards) {
      if (o === this || o.dead) continue;
      const dx = this.x - o.x, dz = this.z - o.z, d = Math.hypot(dx, dz);
      if (d < 0.7 && d > 0.001) {
        const push = (0.7 - d) * 0.5;
        const nx = this.x + (dx / d) * push, nz = this.z + (dz / d) * push;
        if (game.grid.walkable(Math.floor(nx / TILE), Math.floor(nz / TILE))) { this.x = nx; this.z = nz; }
      }
    }

    this.animate(dt, game);
  }

  shoot(game) {
    const p = game.player;
    const dist = this.distToPlayer;
    const fx = Math.sin(this.facing), fz = Math.cos(this.facing);
    const mx = this.x + fx * 0.6, my = 1.36, mz = this.z + fz * 0.6;
    this.muzzleT = 0.06;
    game.audio.playAt('rifle', this.x, this.z);
    game.alertNearby(this.x, this.z, 24, this);

    let acc = 0.44 * game.diff.acc * Math.max(0.2, Math.min(1, 1.05 - dist / 48));
    if (p.sprinting) acc *= 0.7; else if (p.moving) acc *= 0.88;
    if (p.crouching) acc *= 0.85;
    if (this.armHurt > 0) acc *= 0.5;

    if (Math.random() < acc) {
      // Stop the streak short of the camera so it never fills the screen.
      if (dist > 3) {
        const k = (dist - 1.6) / dist;
        game.world.tracer(mx, my, mz, mx + (p.x - mx) * k, my + (p.eyeY - 0.25 - my) * k, mz + (p.z - mz) * k);
      }
      p.damage(rand(5, 8) * game.diff.dmg, this.x, this.z);
    } else {
      // A miss still goes somewhere: trace it into the scenery.
      const yaw = Math.atan2(p.x - mx, p.z - mz) + rand(0.04, 0.11) * (Math.random() < 0.5 ? -1 : 1);
      const pitch = Math.atan2(p.eyeY - 0.2 - my, dist) + rand(-0.05, 0.05);
      const cp = Math.cos(pitch);
      const dx = Math.sin(yaw) * cp, dy = Math.sin(pitch), dz = Math.cos(yaw) * cp;
      const h = game.grid.raycast(mx, my, mz, dx, dy, dz, 60);
      if (h) {
        game.world.tracer(mx, my, mz, h.x, h.y, h.z);
        game.world.impact(h);
        if (Math.hypot(h.x - p.x, h.z - p.z) < 8) game.audio.playAt(Math.random() < 0.4 ? 'ricochet' : 'impact', h.x, h.z, 1.5);
      }
    }
  }

  tint(game) {
    game.world.lightAt(this.x, this.z, tmpColor);
    const r = Math.max(0.2, Math.min(1.25, tmpColor.r));
    const g = Math.max(0.2, Math.min(1.25, tmpColor.g));
    const b = Math.max(0.22, Math.min(1.25, tmpColor.b));
    for (const m of this.mats) m.mat.color.setRGB(m.base.r * r, m.base.g * g, m.base.b * b);
  }

  animate(dt, game) {
    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.y = this.facing;

    const swing = this.moving ? Math.sin(this.walkPhase) * 0.6 : 0;
    this.legL.rotation.x += (swing - this.legL.rotation.x) * Math.min(1, dt * 14);
    this.legR.rotation.x += (-swing - this.legR.rotation.x) * Math.min(1, dt * 14);

    const aiming = this.state === 'combat' && this.seesPlayer;
    const kick = this.muzzleT > 0 ? 0.12 : 0;
    const armR = aiming ? -Math.PI / 2 + kick : -0.5 - swing * 0.2;
    const armL = aiming ? -1.25 : -swing * 0.7;
    this.armR.rotation.x += (armR - this.armR.rotation.x) * Math.min(1, dt * 12);
    this.armL.rotation.x += (armL - this.armL.rotation.x) * Math.min(1, dt * 12);
    this.armL.rotation.z = aiming ? 0.45 : 0;

    this.body.rotation.z = this.flinch > 0 ? Math.sin(this.flinch * 30) * 0.12 : 0;
    this.body.position.y = this.moving ? Math.abs(Math.sin(this.walkPhase)) * 0.03 : 0;
    this.head.rotation.y = this.state === 'search' || (this.inv && this.inv.phase === 'scan') ? Math.sin(game.time * 3) * 0.5 : 0;

    this.muzzleT = Math.max(0, this.muzzleT - dt);
    this.flash.visible = this.muzzleT > 0;
    if (this.markT > 0) {
      this.markT -= dt;
      if (this.markT <= 0) this.mark.visible = false;
    }
    this.tint(game);
  }
}

// ---------------------------------------------------------------------------

export class SecCamera {
  constructor(game, def) {
    this.game = game;
    this.x = (def.c + 0.5) * TILE + def.ox;
    this.z = (def.r + 0.5) * TILE + def.oz;
    this.y = 2.75;
    this.baseYaw = def.yaw;
    this.sweep = def.sweep;
    this.range = def.range;
    this.yaw = def.yaw;
    this.phase = Math.random() * 6;
    this.alive = true;
    this.meter = 0;
    this.seesPlayer = false;

    this.root = new THREE.Group();
    this.root.position.set(this.x, this.y, this.z);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x8d949a });
    const body = new THREE.Mesh(boxGeo(0.2, 0.18, 0.42), bodyMat);
    body.userData.camera = this;
    this.hitPart = body;
    this.ledMat = new THREE.MeshBasicMaterial({ color: 0x35e06a });
    const led = new THREE.Mesh(boxGeo(0.05, 0.05, 0.02), this.ledMat);
    led.position.set(0.06, 0.05, 0.215);
    const lens = new THREE.Mesh(boxGeo(0.1, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: 0x0a0c0e }));
    lens.position.set(-0.02, 0, 0.215);

    // Faint cone showing where the camera is looking.
    const len = Math.min(this.range, 9);
    const coneGeo = new THREE.ConeGeometry(Math.tan(0.4) * len, len, 14, 1, true);
    coneGeo.translate(0, -len / 2, 0);
    coneGeo.rotateX(-Math.PI / 2);
    this.coneMat = new THREE.MeshBasicMaterial({
      color: 0x35e06a, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, fog: false,
    });
    this.cone = new THREE.Mesh(coneGeo, this.coneMat);
    this.pivot = new THREE.Group();
    this.pivot.add(body, led, lens, this.cone);
    this.pivot.rotation.order = 'YXZ';
    this.pivot.rotation.x = 0.32;
    this.root.add(this.pivot);
    game.scene.add(this.root);
  }

  destroy(game) {
    if (!this.alive) return;
    this.alive = false;
    this.meter = 0;
    this.seesPlayer = false;
    this.cone.visible = false;
    this.ledMat.color.set(0x111111);
    this.pivot.rotation.x = 0.9;
    game.audio.playAt('smash', this.x, this.z, 1.4);
    game.world.spark(this.x, this.y, this.z, 0.7);
    game.stats.camerasDown++;
  }

  powerDown() {
    this.meter = 0;
    this.seesPlayer = false;
    this.cone.visible = false;
    this.ledMat.color.set(0x111111);
  }

  update(dt, game) {
    if (!this.alive || !game.alarm.enabled) return;
    this.phase += dt * 0.55;
    this.yaw = this.baseYaw + Math.sin(this.phase) * this.sweep;
    this.pivot.rotation.y = this.yaw;

    const p = game.player;
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    let sees = false;
    if (!p.dead && dist < this.range && Math.abs(wrap(Math.atan2(dx, dz) - this.yaw)) < 0.42) {
      sees = game.grid.visible(this.x, this.y, this.z, p.x, p.eyeY, p.z);
    }
    this.seesPlayer = sees;
    if (sees && !game.alarm.active) {
      this.meter += dt / (1.5 / game.diff.detect);
      if (this.meter >= 1) {
        this.meter = 0;
        game.triggerAlarm(p.x, p.z, 'A camera picked you up.');
      }
    } else {
      this.meter = Math.max(0, this.meter - dt * 0.6);
    }
    const hot = this.meter > 0.02 || (sees && game.alarm.active);
    this.coneMat.color.set(hot ? 0xff4a3a : 0x35e06a);
    this.coneMat.opacity = hot ? 0.12 : 0.05;
    this.ledMat.color.set(hot ? 0xff4a3a : 0x35e06a);
  }
}
