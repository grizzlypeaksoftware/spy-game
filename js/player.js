// The player: movement, stances, weapons and the first-person view model.
import * as THREE from 'three';
import { TILE } from './grid.js';

export const WEAPONS = {
  fist: { name: 'BARE HANDS', melee: true, rate: 0.5 },
  pistol: { name: 'KESTREL 9 · SUPPRESSED', mag: 8, dmg: 40, rate: 0.24, auto: false, spread: 0.004, noise: 5, reload: 1.3, snd: 'pistol', kick: 0.7 },
  smg: { name: 'VOLK SUBMACHINE GUN', mag: 30, dmg: 19, rate: 0.085, auto: true, spread: 0.026, noise: 34, reload: 1.9, snd: 'smg', kick: 0.45 },
  // Found on some operations only. The shotgun fires a spread of pellets; the rifle zooms on right click.
  shotgun: { name: 'BRANT 12 SHOTGUN', mag: 5, dmg: 17, pellets: 8, rate: 0.8, auto: false, spread: 0.075, noise: 42, reload: 2.3, snd: 'shotgun', kick: 1.4, range: 30, tracer: true },
  rifle: { name: 'LYNX MARKSMAN RIFLE', mag: 5, dmg: 115, rate: 0.95, auto: false, spread: 0.0012, noise: 46, reload: 2.5, snd: 'rifle', kick: 1.3, tracer: true, zoom: true },
};
const ORDER = ['fist', 'pistol', 'smg', 'shotgun', 'rifle'];
const SLOT = { Digit1: 'fist', Digit2: 'pistol', Digit3: 'smg', Digit4: 'shotgun', Digit5: 'rifle' };
// Muzzle flash: [height, distance, size] per weapon.
const FLASH = { pistol: [0.004, -0.3, 0.35], smg: [0.012, -0.36, 1], shotgun: [0.01, -0.5, 1.3], rifle: [0.012, -0.62, 0.9] };
const RADIUS = 0.35;
const STAND = 1.62, CROUCH = 0.95;

export class Player {
  constructor(game) {
    this.game = game;
    const s = game.grid.start;
    this.x = (s.c + 0.5) * TILE;
    this.z = (s.r + 0.5) * TILE;
    this.yaw = game.mission.startYaw;
    this.pitch = 0;
    this.vx = 0; this.vz = 0;
    this.eyeY = STAND;
    this.crouching = false;
    this.sprinting = false;
    this.moving = false;
    this.dead = false;
    this.deadT = 0;
    this.hp = 100;
    this.armor = 0;
    this.keys = new Set();
    this.owned = new Set(['fist', 'pistol']);
    this.ammo = {
      pistol: { mag: 8, res: game.diff.ammo }, smg: { mag: 0, res: 0 },
      shotgun: { mag: 0, res: 0 }, rifle: { mag: 0, res: 0 },
    };
    this.grenades = 0;
    this.throwT = 0;
    this.zoom = 0;
    this.weapon = 'pistol';
    this.pending = null;
    this.cool = 0;
    this.reloadT = 0;
    this.switchT = 0;
    this.kick = 0;
    this.punchT = 0;
    this.flashT = 0;
    this.bob = 0;
    this.stepAcc = 0;
    this.swayX = 0; this.swayY = 0;
    this.spreadHeat = 0;
    this.emptyMsgT = -10;
    this.ray = new THREE.Raycaster();
    this.buildViewModel();
  }

  buildViewModel() {
    const scene = this.vmScene = new THREE.Scene();
    this.vmCam = new THREE.PerspectiveCamera(52, 1, 0.01, 10);
    this.vmAmb = new THREE.AmbientLight(0xffffff, 1.2);
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(-1, 2, 1.5);
    scene.add(this.vmAmb, sun);
    this.vmRoot = new THREE.Group();
    scene.add(this.vmRoot);

    const box = (w, h, d, color, x, y, z, parent) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const SKIN = 0xc9a183, SLEEVE = 0x22262e, STEEL = 0x4a5057, DARK = 0x25282c;

    const pistol = new THREE.Group();
    box(0.042, 0.055, 0.2, STEEL, 0, 0, 0, pistol);
    box(0.036, 0.036, 0.17, DARK, 0, 0.004, -0.18, pistol);          // suppressor
    box(0.038, 0.11, 0.05, DARK, 0, -0.075, 0.07, pistol).rotation.x = 0.2;
    box(0.012, 0.014, 0.02, 0x9aa0a6, 0, 0.034, 0.08, pistol);        // rear sight
    box(0.075, 0.085, 0.09, SKIN, 0.004, -0.085, 0.075, pistol);
    box(0.085, 0.085, 0.36, SLEEVE, 0.03, -0.13, 0.28, pistol).rotation.x = -0.25;

    const smg = new THREE.Group();
    box(0.055, 0.08, 0.34, STEEL, 0, 0, 0, smg);
    box(0.026, 0.026, 0.15, DARK, 0, 0.012, -0.24, smg);
    box(0.034, 0.17, 0.05, DARK, 0, -0.11, -0.04, smg).rotation.x = 0.12;
    box(0.04, 0.06, 0.16, DARK, 0, -0.005, 0.25, smg);
    box(0.012, 0.03, 0.012, 0x9aa0a6, 0, 0.055, -0.14, smg);
    box(0.036, 0.1, 0.045, DARK, 0, -0.085, 0.1, smg).rotation.x = 0.25;
    box(0.075, 0.085, 0.09, SKIN, 0.004, -0.09, 0.105, smg);
    box(0.085, 0.085, 0.36, SLEEVE, 0.03, -0.14, 0.31, smg).rotation.x = -0.25;
    box(0.07, 0.07, 0.09, SKIN, -0.03, -0.06, -0.13, smg);            // support hand

    const shotgun = new THREE.Group();
    box(0.05, 0.06, 0.5, STEEL, 0, 0.01, -0.12, shotgun);            // barrel
    box(0.056, 0.05, 0.2, 0x5a3a22, 0, -0.035, -0.2, shotgun);       // pump
    box(0.058, 0.085, 0.2, DARK, 0, -0.005, 0.2, shotgun);           // receiver
    box(0.05, 0.08, 0.2, 0x5a3a22, 0, -0.04, 0.38, shotgun).rotation.x = -0.25;
    box(0.075, 0.085, 0.09, SKIN, 0.004, -0.085, 0.22, shotgun);
    box(0.085, 0.085, 0.36, SLEEVE, 0.03, -0.14, 0.42, shotgun).rotation.x = -0.25;
    box(0.07, 0.07, 0.09, SKIN, -0.03, -0.07, -0.2, shotgun);

    const rifle = new THREE.Group();
    box(0.03, 0.03, 0.62, DARK, 0, 0.012, -0.24, rifle);             // barrel
    box(0.05, 0.075, 0.36, 0x4a3524, 0, -0.01, 0.16, rifle);         // stock and receiver
    box(0.045, 0.045, 0.24, 0x4a3524, 0, -0.025, -0.1, rifle);       // fore-end
    box(0.034, 0.034, 0.2, DARK, 0, 0.062, 0.06, rifle);             // scope
    box(0.04, 0.04, 0.03, 0x1a3040, 0, 0.062, -0.05, rifle);
    box(0.075, 0.085, 0.09, SKIN, 0.004, -0.085, 0.2, rifle);
    box(0.085, 0.085, 0.36, SLEEVE, 0.03, -0.14, 0.4, rifle).rotation.x = -0.25;
    box(0.07, 0.07, 0.09, SKIN, -0.03, -0.065, -0.12, rifle);

    const fist = new THREE.Group();
    box(0.1, 0.1, 0.11, SKIN, 0, 0, -0.06, fist);
    box(0.1, 0.1, 0.4, SLEEVE, 0.005, -0.02, 0.2, fist).rotation.x = -0.1;

    this.models = { pistol, smg, shotgun, rifle, fist };
    for (const m of Object.values(this.models)) { m.visible = false; this.vmRoot.add(m); }
    this.models.pistol.visible = true;

    this.flash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({ map: this.game.tex.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.flash.visible = false;
    this.vmRoot.add(this.flash);
  }

  viewDir(yawOff = 0, pitchOff = 0) {
    const yaw = this.yaw + yawOff, pitch = this.pitch + pitchOff, cp = Math.cos(pitch);
    return { x: -Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
  }

  // --- per-frame -----------------------------------------------------------

  update(dt, game) {
    const inp = game.input;
    if (this.dead) {
      this.deadT += dt;
      this.eyeY += (0.35 - this.eyeY) * Math.min(1, dt * 5);
      return;
    }

    // Look
    const sens = 0.0022 * game.sensitivity * (1 - this.zoom * 0.62);
    this.yaw -= inp.mdx * sens;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - inp.mdy * sens));

    // Stance
    if (inp.pressed.has('KeyC')) {
      if (this.crouching) {
        // Only stand if there is room (always true here, kept for future low ceilings).
        this.crouching = false;
      } else this.crouching = true;
    }
    this.eyeY += ((this.crouching ? CROUCH : STAND) - this.eyeY) * Math.min(1, dt * 10);

    // Move
    const k = inp.keys;
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    this.sprinting = !this.crouching && f > 0 && (k.has('ShiftLeft') || k.has('ShiftRight'));
    const speed = this.crouching ? 2.0 : this.sprinting ? 6.2 : 3.8;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = fx * f + rx * s, wz = fz * f + rz * s;
    const wl = Math.hypot(wx, wz);
    if (wl > 0) { wx = (wx / wl) * speed; wz = (wz / wl) * speed; }
    const a = Math.min(1, dt * 12);
    this.vx += (wx - this.vx) * a;
    this.vz += (wz - this.vz) * a;

    const ox = this.x, oz = this.z;
    let nx = this.x + this.vx * dt, nz = this.z + this.vz * dt;
    for (const g of game.guards) {
      if (g.dead) continue;
      const dx = nx - g.x, dz = nz - g.z, d = Math.hypot(dx, dz);
      if (d < 0.75 && d > 0.001) { nx = g.x + (dx / d) * 0.75; nz = g.z + (dz / d) * 0.75; }
    }
    const res = game.grid.collide(nx, nz, RADIUS);
    this.x = res.x; this.z = res.z;
    const moved = Math.hypot(this.x - ox, this.z - oz);
    this.moving = moved > 0.4 * dt;

    // Footsteps make noise unless crouched.
    if (this.moving) {
      this.bob += moved * (this.crouching ? 2.6 : 1.9);
      this.stepAcc += moved;
      const stride = this.sprinting ? 2.0 : this.crouching ? 1.5 : 1.7;
      if (this.stepAcc > stride) {
        this.stepAcc = 0;
        game.audio.play('step', this.crouching ? 0.3 : this.sprinting ? 1.3 : 0.8);
        if (!this.crouching) game.emitNoise(this.x, this.z, this.sprinting ? 9 : 4.5, false);
      }
    }

    this.updateWeapon(dt, game);
    this.updateViewModel(dt, game);
  }

  // --- weapons -------------------------------------------------------------

  owns(w) { return this.owned.has(w); }
  get hasSmg() { return this.owned.has('smg'); }
  set hasSmg(v) { if (v) this.owned.add('smg'); else this.owned.delete('smg'); }

  switchTo(w) {
    if (w === this.weapon || !this.owns(w) || this.switchT > 0) return;
    this.pending = w;
    this.switchT = 0.3;
    this.reloadT = 0;
  }

  updateWeapon(dt, game) {
    const inp = game.input;
    this.cool = Math.max(0, this.cool - dt);
    this.kick = Math.max(0, this.kick - dt * 6);
    this.spreadHeat = Math.max(0, this.spreadHeat - dt * 2.5);
    this.flashT = Math.max(0, this.flashT - dt);
    this.punchT = Math.max(0, this.punchT - dt);

    this.throwT = Math.max(0, this.throwT - dt);
    const aiming = inp.aim && WEAPONS[this.weapon].zoom && this.switchT <= 0 && this.reloadT <= 0;
    this.zoom += ((aiming ? 1 : 0) - this.zoom) * Math.min(1, dt * 12);

    for (const [key, w] of Object.entries(SLOT)) if (inp.pressed.has(key)) this.switchTo(w);
    if (inp.pressed.has('KeyG') && this.throwT <= 0) {
      if (this.grenades > 0) {
        this.grenades--;
        this.throwT = 0.9;
        this.punchT = 0.28;
        game.throwGrenade(this);
      } else if (game.time - this.emptyMsgT > 4) { this.emptyMsgT = game.time; game.hud.message('No grenades.', 'warn', 2); }
    }
    if (inp.wheel) {
      const owned = ORDER.filter((w) => this.owns(w));
      const i = owned.indexOf(this.pending || this.weapon);
      this.switchTo(owned[(i + Math.sign(inp.wheel) + owned.length) % owned.length]);
    }

    if (this.switchT > 0) {
      const before = this.switchT;
      this.switchT = Math.max(0, this.switchT - dt);
      if (before > 0.15 && this.switchT <= 0.15 && this.pending) {
        this.models[this.weapon].visible = false;
        this.weapon = this.pending;
        this.pending = null;
        this.models[this.weapon].visible = true;
      }
      return;
    }

    const W = WEAPONS[this.weapon];
    if (W.melee) {
      if (inp.firePressed && this.cool <= 0) this.strike(game);
      return;
    }

    const am = this.ammo[this.weapon];
    if (this.reloadT > 0) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        const take = Math.min(W.mag - am.mag, am.res);
        am.mag += take; am.res -= take;
      }
      return;
    }
    if (inp.pressed.has('KeyR') && am.mag < W.mag && am.res > 0) { this.startReload(game); return; }

    const trigger = W.auto ? inp.fire : inp.firePressed;
    if (trigger && this.cool <= 0) {
      if (am.mag > 0) this.fire(game, W, am);
      else if (am.res > 0) this.startReload(game);
      else if (inp.firePressed) {
        game.audio.play('click');
        if (game.time - this.emptyMsgT > 4) { this.emptyMsgT = game.time; game.hud.message('Out of ammunition.', 'warn', 2); }
      }
    }
  }

  startReload(game) {
    this.reloadT = WEAPONS[this.weapon].reload;
    game.audio.play('reload');
  }

  fire(game, W, am) {
    am.mag--;
    this.cool = W.rate;
    this.kick = Math.min(1.4, this.kick + W.kick);
    this.flashT = 0.045;
    this.flash.rotation.z = Math.random() * Math.PI;
    this.pitch = Math.min(1.45, this.pitch + (W.auto ? 0.006 : W.kick > 1 ? 0.03 : 0.012));
    game.stats.shots++;
    game.audio.play(W.snd);
    game.emitNoise(this.x, this.z, W.noise, true);

    let spread = W.spread * (1 + this.spreadHeat * 2) * (this.moving ? 1.6 : 1) * (this.crouching ? 0.7 : 1);
    if (W.zoom) spread += (1 - this.zoom) * 0.02; // the rifle is only accurate through the scope
    if (W.auto) this.spreadHeat = Math.min(1.5, this.spreadHeat + 0.22);
    game.scene.updateMatrixWorld();
    let any = false;
    for (let i = 0; i < (W.pellets || 1); i++) any = this.trace(game, W, spread) || any;
    if (any) game.stats.hits++;
  }

  /** One projectile. Returns true if it struck a guard or a camera. */
  trace(game, W, spread) {
    const reach = W.range || 90;
    const d = this.viewDir((Math.random() - 0.5) * 2 * spread, (Math.random() - 0.5) * 2 * spread);
    const wall = game.grid.raycast(this.x, this.eyeY, this.z, d.x, d.y, d.z, reach);
    const far = wall ? wall.dist : reach;
    const showTracer = W.auto || W.tracer;

    this.ray.set(new THREE.Vector3(this.x, this.eyeY, this.z), new THREE.Vector3(d.x, d.y, d.z));
    this.ray.far = far;
    const hit = this.ray.intersectObjects(game.hittables(), false)[0];

    // Tracer starts roughly at the muzzle rather than between the eyes.
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const sx = this.x + rx * 0.16 + d.x * 0.5, sy = this.eyeY - 0.14, sz = this.z + rz * 0.16 + d.z * 0.5;

    if (hit) {
      const pt = hit.point, ud = hit.object.userData;
      if (showTracer) game.world.tracer(sx, sy, sz, pt.x, pt.y, pt.z);
      game.world.spark(pt.x, pt.y, pt.z, 0.22);
      if (ud.guard) {
        const killed = ud.guard.damage(game, ud.zone, W.dmg, this.weapon === 'pistol');
        if (ud.zone === 'head') game.stats.headshots++;
        game.hud.hit(killed);
      } else if (ud.camera) {
        ud.camera.destroy(game);
        game.hud.hit(true);
      }
      return true;
    }
    if (wall) {
      if (showTracer) game.world.tracer(sx, sy, sz, wall.x, wall.y, wall.z);
      game.world.impact(wall);
      game.audio.playAt('impact', wall.x, wall.z, 0.8);
      // Rounds landing close to a guard get their attention.
      game.emitNoise(wall.x, wall.z, 4, true);
    }
    return false;
  }

  strike(game) {
    this.cool = WEAPONS.fist.rate;
    this.punchT = 0.28;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    let best = null, bd = 1.9;
    for (const g of game.guards) {
      if (g.dead) continue;
      const dx = g.x - this.x, dz = g.z - this.z, d = Math.hypot(dx, dz);
      if (d < bd && (dx * fx + dz * fz) / d > 0.6) { best = g; bd = d; }
    }
    if (!best) { game.audio.play('swing'); return; }
    game.audio.play('punch');
    game.hud.hit(false);
    if (!best.inCombat) {
      // An unaware guard goes down in one blow.
      best.die(game, 'head', true);
      game.stats.takedowns++;
      game.hud.hit(true);
    } else {
      best.damage(game, 'torso', 45, true);
      game.emitNoise(this.x, this.z, 3, false);
    }
  }

  // --- damage and pickups --------------------------------------------------

  damage(amount, sx, sz) {
    if (this.dead) return;
    const game = this.game;
    game.stats.damage += amount;
    let left = amount;
    if (this.armor > 0) {
      const ab = Math.min(this.armor, left);
      this.armor -= ab; left -= ab;
    }
    this.hp -= left;
    game.audio.play('hurt');
    const dx = sx - this.x, dz = sz - this.z;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    game.hud.damage(Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz));
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      game.onPlayerDeath();
    }
  }

  // --- view model ----------------------------------------------------------

  updateViewModel(dt, game) {
    const inp = game.input;
    const v = this.vmRoot;
    const speedF = Math.min(1, Math.hypot(this.vx, this.vz) / 3.8);
    const bx = Math.cos(this.bob) * 0.007 * speedF;
    const by = Math.abs(Math.sin(this.bob)) * 0.009 * speedF;
    this.swayX += (Math.max(-0.03, Math.min(0.03, -inp.mdx * 0.0005)) - this.swayX) * Math.min(1, dt * 8);
    this.swayY += (Math.max(-0.03, Math.min(0.03, inp.mdy * 0.0005)) - this.swayY) * Math.min(1, dt * 8);

    let drop = 0;
    if (this.switchT > 0) drop = Math.sin(Math.PI * (1 - this.switchT / 0.3));
    else if (this.reloadT > 0) drop = Math.sin(Math.PI * (1 - this.reloadT / WEAPONS[this.weapon].reload)) * 0.8;

    v.position.set(0.15 + bx + this.swayX, -0.115 - by + this.swayY - drop * 0.26, -0.5 + this.kick * 0.05);
    v.rotation.set(this.kick * 0.16 + drop * 0.7, 0.05, 0);

    v.visible = this.zoom < 0.5;
    if (this.weapon === 'fist') {
      const t = this.punchT > 0 ? Math.sin(Math.PI * (1 - this.punchT / 0.28)) : 0;
      this.models.fist.position.set(-t * 0.12, 0.02 + t * 0.05, -t * 0.34);
    }

    const showFlash = this.flashT > 0 && this.weapon !== 'fist';
    this.flash.visible = showFlash;
    if (showFlash) {
      const [fy, fz, fs] = FLASH[this.weapon];
      this.flash.position.set(0, fy, fz);
      this.flash.scale.setScalar(fs);
    }

    // Match the gun's brightness to the room.
    this.vmAmb.intensity = 0.5 + game.world.brightnessAt(this.x, this.z) * 1.6;
  }

  applyCamera(cam) {
    const bobY = this.dead ? 0 : Math.abs(Math.sin(this.bob)) * 0.035 * Math.min(1, Math.hypot(this.vx, this.vz) / 3.8);
    const fov = 70 - 46 * this.zoom;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.position.set(this.x, this.eyeY + bobY, this.z);
    cam.rotation.set(this.pitch, this.yaw, this.dead ? Math.min(0.9, this.deadT * 2) : 0, 'YXZ');
  }
}
