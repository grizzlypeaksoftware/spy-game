// Turns the tile grid into geometry. Lighting is baked into vertex colours once at
// load, which is cheap to draw and gives the level its hard-edged late-90s look.
import * as THREE from 'three';
import { TILE, WALL_H, LOW_H, TALL_H, DOOR_H } from './grid.js';

export const SIDE = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

const FLOOR_TEX = {
  concrete: 'floorConcrete', asphalt: 'asphalt', carpet: 'carpet', tile: 'tile', serverFloor: 'serverFloor',
};
const PROPS = {
  crate: { side: 'crate', top: 'crateTop', u: 2, vPerM: 1 / 1.1, topUV: 2, glow: 0 },
  desk: { side: 'desk', top: 'deskTop', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  rack: { side: 'rack', top: 'rackTop', u: 2, vPerM: 1 / TALL_H, topUV: 2, glow: 0.55 },
  plinth: { side: 'plinth', top: 'plinthTop', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  hull: { side: 'hull', top: 'hullTop', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  machine: { side: 'machine', top: 'machineTop', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0.3 },
  deposit: { side: 'deposit', top: 'machineTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0 },
  wagon: { side: 'wagon', top: 'wagonTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0 },
  drift: { side: 'crate', top: 'snow', u: 2, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  mast: { side: 'mast', top: 'machineTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0.35 },
  table: { side: 'tableSide', top: 'felt', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  slot: { side: 'slot', top: 'machineTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0.7 },
  bench: { side: 'bench', top: 'benchTop', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  tank: { side: 'tank', top: 'benchTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0.4 },
  rail: { side: 'launcher', top: 'hullTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0.15 },
  hedge: { side: 'hedge', top: 'hedge', u: 1, vPerM: 1 / 1.1, topUV: 1, glow: 0 },
  shelf: { side: 'books', top: 'deskTop', u: 1, vPerM: 1 / TALL_H, topUV: 1, glow: 0 },
};

class Builder {
  constructor(world) {
    this.world = world;
    this.buckets = new Map();
    this.cache = new Map();
    this.tmp = [0, 0, 0];
  }

  bucket(name) {
    let b = this.buckets.get(name);
    if (!b) { b = { pos: [], uv: [], col: [] }; this.buckets.set(name, b); }
    return b;
  }

  /** Lit quad. Corners a-b-c-d go around the face; winding is fixed up from the normal. */
  quad(mat, a, b, c, d, n, uv = [0, 0, 1, 1], sub = 2, glow = 0) {
    let ua = [uv[0], uv[1]], ub = [uv[2], uv[1]], uc = [uv[2], uv[3]], ud = [uv[0], uv[3]];
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const crx = e1[1] * e2[2] - e1[2] * e2[1];
    const cry = e1[2] * e2[0] - e1[0] * e2[2];
    const crz = e1[0] * e2[1] - e1[1] * e2[0];
    if (crx * n[0] + cry * n[1] + crz * n[2] < 0) { [b, d] = [d, b]; [ub, ud] = [ud, ub]; }
    const bk = this.bucket(mat);
    const cx = (a[0] + b[0] + c[0] + d[0]) / 4;
    const cy = (a[1] + b[1] + c[1] + d[1]) / 4;
    const cz = (a[2] + b[2] + c[2] + d[2]) / 4;

    const vert = (s, t) => {
      const w0 = (1 - s) * (1 - t), w1 = s * (1 - t), w2 = s * t, w3 = (1 - s) * t;
      const x = a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3;
      const y = a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3;
      const z = a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3;
      bk.pos.push(x, y, z);
      bk.uv.push(ua[0] * w0 + ub[0] * w1 + uc[0] * w2 + ud[0] * w3, ua[1] * w0 + ub[1] * w1 + uc[1] * w2 + ud[1] * w3);
      // Sample slightly inside the face and off the surface so the light test never starts in a wall.
      const sx = x + (cx - x) * 0.15 + n[0] * 0.08;
      const sy = y + (cy - y) * 0.15 + n[1] * 0.08;
      const sz = z + (cz - z) * 0.15 + n[2] * 0.08;
      const key = `${Math.round(sx * 50)},${Math.round(sy * 50)},${Math.round(sz * 50)},${n[0]},${n[1]},${n[2]}`;
      let col = this.cache.get(key);
      if (!col) {
        col = [0, 0, 0];
        this.world.light(sx, sy, sz, n[0], n[1], n[2], col);
        this.cache.set(key, col);
      }
      bk.col.push(Math.max(col[0], glow), Math.max(col[1], glow), Math.max(col[2], glow));
    };

    for (let i = 0; i < sub; i++) {
      for (let j = 0; j < sub; j++) {
        const s0 = i / sub, s1 = (i + 1) / sub, t0 = j / sub, t1 = (j + 1) / sub;
        vert(s0, t0); vert(s1, t0); vert(s1, t1);
        vert(s0, t0); vert(s1, t1); vert(s0, t1);
      }
    }
  }
}

export class World {
  constructor(scene, grid, mission, tex) {
    this.scene = scene;
    this.grid = grid;
    this.mission = mission;
    this.tex = tex;
    this.owned = [];        // geometries and materials to free on restart
    this.ambient = mission.ambient || [0.085, 0.1, 0.13];
    this.time = 0;

    const col = new THREE.Color();
    this.lights = mission.lights.map((l) => {
      col.set(l.color);
      return {
        x: (l.c + 0.5) * TILE, y: WALL_H - 0.35, z: (l.r + 0.5) * TILE,
        r: col.r, g: col.g, b: col.b, i: l.i, rad: l.rad, c: l.c, rr: l.r, hex: l.color,
      };
    });

    this.buildStatic();
    this.buildProbes();
    this.buildDoors();
    this.buildFixtures();
    this.buildExit();
    this.buildFx();
  }

  zoneOf(c, r) {
    for (const z of this.mission.zones) {
      if (c >= z.c0 && c <= z.c1 && r >= z.r0 && r <= z.r1) return z;
    }
    return this.mission.defaultZone;
  }

  /** Baked light arriving at a point with the given surface normal. */
  light(px, py, pz, nx, ny, nz, out) {
    let r = this.ambient[0], g = this.ambient[1], b = this.ambient[2];
    for (const L of this.lights) {
      const dx = L.x - px, dy = L.y - py, dz = L.z - pz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > L.rad * L.rad) continue;
      const d = Math.sqrt(d2) || 1e-4;
      const ndl = (nx * dx + ny * dy + nz * dz) / d;
      if (ndl < -0.05) continue;
      if (!this.grid.los(L.x, L.z, px, pz)) continue;
      let att = 1 - d / L.rad;
      att *= att;
      const k = L.i * att * (0.3 + 0.7 * Math.max(0, ndl)) * 1.25;
      r += L.r * k; g += L.g * k; b += L.b * k;
    }
    out[0] = r; out[1] = g; out[2] = b;
  }

  buildStatic() {
    const g = this.grid, B = new Builder(this), H = WALL_H;
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const ch = g.ch(c, r);
        if (ch === '#') continue;
        const zone = this.zoneOf(c, r);
        const x0 = c * TILE, x1 = x0 + TILE, z0 = r * TILE, z1 = z0 + TILE;

        if (ch !== 'c' && ch !== 'C') {
          B.quad(FLOOR_TEX[zone.floor] || zone.floor, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [0, 1, 0]);
        }
        if (zone.ceil) B.quad('ceiling', [x0, H, z0], [x1, H, z0], [x1, H, z1], [x0, H, z1], [0, -1, 0]);

        if (g.ch(c, r - 1) === '#') B.quad(zone.wall, [x0, 0, z0], [x1, 0, z0], [x1, H, z0], [x0, H, z0], [0, 0, 1]);
        if (g.ch(c, r + 1) === '#') B.quad(zone.wall, [x1, 0, z1], [x0, 0, z1], [x0, H, z1], [x1, H, z1], [0, 0, -1]);
        if (g.ch(c - 1, r) === '#') B.quad(zone.wall, [x0, 0, z1], [x0, 0, z0], [x0, H, z0], [x0, H, z1], [1, 0, 0]);
        if (g.ch(c + 1, r) === '#') B.quad(zone.wall, [x1, 0, z0], [x1, 0, z1], [x1, H, z1], [x1, H, z0], [-1, 0, 0]);

        if (ch === 'c' || ch === 'C') {
          // A zone may use a different prop for its tall blocks (`propTall`).
          const P = PROPS[(ch === 'C' && zone.propTall) || zone.prop] || PROPS.crate;
          const h = ch === 'c' ? LOW_H : TALL_H;
          const uv = [0, 0, P.u, h * P.vPerM];
          const same = (cc, rr) => { const o = g.ch(cc, rr); return o === ch || o === '#'; };
          if (!same(c, r - 1)) B.quad(P.side, [x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], [0, 0, -1], uv, 2, P.glow);
          if (!same(c, r + 1)) B.quad(P.side, [x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], [0, 0, 1], uv, 2, P.glow);
          if (!same(c - 1, r)) B.quad(P.side, [x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], [-1, 0, 0], uv, 2, P.glow);
          if (!same(c + 1, r)) B.quad(P.side, [x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], [1, 0, 0], uv, 2, P.glow);
          B.quad(P.top, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], [0, 1, 0], [0, 0, P.topUV, P.topUV]);

          // A monitor on some desks.
          if (zone.prop === 'desk' && (c * 7 + r * 3) % 2 === 0) {
            const mx = x0 + 1, mz = z0 + 0.55, y0 = h + 0.04, y1 = h + 0.5;
            B.quad('screen', [mx - 0.32, y0, mz], [mx + 0.32, y0, mz], [mx + 0.32, y1, mz], [mx - 0.32, y1, mz], [0, 0, 1], [0, 0, 1, 1], 1, 0.9);
            B.quad('trim', [mx + 0.32, y0, mz], [mx - 0.32, y0, mz], [mx - 0.32, y1, mz], [mx + 0.32, y1, mz], [0, 0, -1], [0, 0, 1, 0.2], 1);
          }
        }

        if (ch === 'D') {
          // Lintel above the doorway.
          const d = g.doorAt.get(r * g.cols + c);
          const t = 0.14, uv = [0, 0, 1, 0.25];
          if (d.alongX) {
            const zc = z0 + 1;
            B.quad('trim', [x0, DOOR_H, zc + t], [x1, DOOR_H, zc + t], [x1, H, zc + t], [x0, H, zc + t], [0, 0, 1], uv, 1);
            B.quad('trim', [x1, DOOR_H, zc - t], [x0, DOOR_H, zc - t], [x0, H, zc - t], [x1, H, zc - t], [0, 0, -1], uv, 1);
            B.quad('trim', [x0, DOOR_H, zc - t], [x1, DOOR_H, zc - t], [x1, DOOR_H, zc + t], [x0, DOOR_H, zc + t], [0, -1, 0], uv, 1);
          } else {
            const xc = x0 + 1;
            B.quad('trim', [xc + t, DOOR_H, z1], [xc + t, DOOR_H, z0], [xc + t, H, z0], [xc + t, H, z1], [1, 0, 0], uv, 1);
            B.quad('trim', [xc - t, DOOR_H, z0], [xc - t, DOOR_H, z1], [xc - t, H, z1], [xc - t, H, z0], [-1, 0, 0], uv, 1);
            B.quad('trim', [xc - t, DOOR_H, z0], [xc + t, DOOR_H, z0], [xc + t, DOOR_H, z1], [xc - t, DOOR_H, z1], [0, -1, 0], uv, 1);
          }
        }
      }
    }

    for (const [name, b] of B.buckets) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
      const map = this.tex[name];
      if (!map) throw new Error(`No texture named "${name}"`);
      const mat = new THREE.MeshBasicMaterial({ map, vertexColors: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.owned.push(geo, mat);
    }
  }

  /** One light sample per tile, used to tint characters, doors and pickups. */
  buildProbes() {
    const g = this.grid;
    this.probes = new Float32Array(g.cols * g.rows * 3);
    const out = [0, 0, 0];
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        if (g.ch(c, r) === '#') continue;
        this.light((c + 0.5) * TILE, 1.1, (r + 0.5) * TILE, 0, 1, 0, out);
        this.probes.set(out, (r * g.cols + c) * 3);
      }
    }
  }

  lightAt(x, z, out) {
    const g = this.grid;
    const c = Math.max(0, Math.min(g.cols - 1, Math.floor(x / TILE)));
    const r = Math.max(0, Math.min(g.rows - 1, Math.floor(z / TILE)));
    const i = (r * g.cols + c) * 3;
    out.r = this.probes[i]; out.g = this.probes[i + 1]; out.b = this.probes[i + 2];
    return out;
  }

  brightnessAt(x, z) {
    const g = this.grid;
    const c = Math.max(0, Math.min(g.cols - 1, Math.floor(x / TILE)));
    const r = Math.max(0, Math.min(g.rows - 1, Math.floor(z / TILE)));
    const i = (r * g.cols + c) * 3;
    return Math.min(1.2, this.probes[i] * 0.3 + this.probes[i + 1] * 0.59 + this.probes[i + 2] * 0.11);
  }

  buildDoors() {
    const geo = new THREE.BoxGeometry(TILE, DOOR_H, 0.14);
    this.owned.push(geo);
    const col = new THREE.Color();
    for (const d of this.grid.doors) {
      // Light the door from the brighter of its two sides.
      let best = 0;
      const mat = new THREE.MeshBasicMaterial({ map: this.tex.door[d.lock || 'none'] });
      for (const [dc, dr] of Object.values(SIDE)) {
        if (this.grid.ch(d.c + dc, d.r + dr) === '#') continue;
        this.lightAt((d.c + dc + 0.5) * TILE, (d.r + dr + 0.5) * TILE, col);
        const lum = col.r + col.g + col.b;
        if (lum > best) { best = lum; mat.color.copy(col); }
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, DOOR_H / 2, d.z);
      if (!d.alongX) mesh.rotation.y = Math.PI / 2;
      this.scene.add(mesh);
      this.owned.push(mat);
      d.mesh = mesh;
    }
  }

  updateDoors(dt, game) {
    const p = game.player;
    game.lockedDoor = null;
    for (const d of this.grid.doors) {
      let want = false;
      d.hold = Math.max(0, d.hold - dt);
      if (d.hold > 0) want = true;
      const pd = Math.hypot(p.x - d.x, p.z - d.z);
      if (pd < 1.75 && !p.dead) {
        if (!d.lock || p.keys.has(d.lock)) want = true;
        else game.lockedDoor = d;
      }
      if (!want) {
        for (const gd of game.guards) {
          if (!gd.dead && Math.hypot(gd.x - d.x, gd.z - d.z) < 1.3) { want = true; break; }
        }
      }
      if (want !== d.want) {
        d.want = want;
        game.audio.playAt('door', d.x, d.z);
      }
      const target = want ? 1 : 0;
      if (d.open !== target) {
        d.open += Math.sign(target - d.open) * Math.min(Math.abs(target - d.open), dt * 2.8);
        const off = d.open * (TILE - 0.06);
        d.mesh.position.x = d.x + (d.alongX ? off : 0);
        d.mesh.position.z = d.z + (d.alongX ? 0 : off);
      }
    }
  }

  buildFixtures() {
    const lampGeo = new THREE.BoxGeometry(1.0, 0.08, 0.3);
    const poleGeo = new THREE.BoxGeometry(0.1, WALL_H, 0.1);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x15171a });
    this.owned.push(lampGeo, poleGeo, poleMat);
    for (const L of this.lights) {
      const mat = new THREE.MeshBasicMaterial({ color: L.hex });
      mat.color.multiplyScalar(1.6);
      this.owned.push(mat);
      const lamp = new THREE.Mesh(lampGeo, mat);
      lamp.position.set(L.x, WALL_H - 0.05, L.z);
      this.scene.add(lamp);
      if (!this.zoneOf(L.c, L.rr).ceil) {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(L.x + 0.45, WALL_H / 2, L.z);
        this.scene.add(pole);
      }
    }
  }

  /** World position for something mounted on the wall (or prop) beside a tile. */
  mount(c, r, side, inset = 0.06) {
    const [dx, dz] = SIDE[side];
    return {
      x: (c + 0.5) * TILE + dx * (TILE / 2 - inset),
      z: (r + 0.5) * TILE + dz * (TILE / 2 - inset),
      yaw: Math.atan2(-dx, -dz), // faces back into the tile
    };
  }

  buildExit() {
    const e = this.grid.exit;
    if (!e) return;
    const padGeo = new THREE.PlaneGeometry(1.7, 1.7);
    this.padMat = new THREE.MeshBasicMaterial({ map: this.tex.pad, color: 0xd43a2f });
    const pad = new THREE.Mesh(padGeo, this.padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set((e.c + 0.5) * TILE, 0.02, (e.r + 0.5) * TILE);
    this.scene.add(pad);
    this.owned.push(padGeo, this.padMat);

    const side = ['e', 'w', 'n', 's'].find((s) => this.grid.ch(e.c + SIDE[s][0], e.r + SIDE[s][1]) === '#');
    if (side) {
      const m = this.mount(e.c, e.r, side, 0.03);
      const geo = new THREE.PlaneGeometry(1.8, 2.6);
      const mat = new THREE.MeshBasicMaterial({ map: this.tex[this.mission.exitTex || 'lift'] });
      const col = this.lightAt(pad.position.x, pad.position.z, new THREE.Color());
      mat.color.copy(col).multiplyScalar(1.1);
      const lift = new THREE.Mesh(geo, mat);
      lift.position.set(m.x, 1.3, m.z);
      lift.rotation.y = m.yaw;
      this.scene.add(lift);
      this.owned.push(geo, mat);
    }
  }

  setExitReady(ready) {
    this.exitReady = ready;
    if (this.padMat) this.padMat.color.set(ready ? 0x35e06a : 0xd43a2f);
  }

  buildFx() {
    const holeGeo = new THREE.PlaneGeometry(0.14, 0.14);
    const holeMat = new THREE.MeshBasicMaterial({
      map: this.tex.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    });
    this.owned.push(holeGeo, holeMat);
    this.decals = [];
    this.decalI = 0;
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(holeGeo, holeMat);
      m.visible = false;
      this.scene.add(m);
      this.decals.push(m);
    }

    const trGeo = new THREE.BoxGeometry(0.03, 0.03, 1);
    this.owned.push(trGeo);
    this.tracers = [];
    this.tracerI = 0;
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.8, depthWrite: false });
      const m = new THREE.Mesh(trGeo, mat);
      m.visible = false; m.userData.life = 0;
      this.scene.add(m);
      this.tracers.push(m);
      this.owned.push(mat);
    }

    this.sparks = [];
    this.sparkI = 0;
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.SpriteMaterial({ map: this.tex.flash, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const s = new THREE.Sprite(mat);
      s.visible = false; s.userData.life = 0;
      this.scene.add(s);
      this.sparks.push(s);
      this.owned.push(mat);
    }
  }

  /** Mark and spark where a bullet lands. `h` is a Grid.raycast hit. */
  impact(h) {
    if (!h) return;
    this.spark(h.x + h.nx * 0.05, h.y + h.ny * 0.05, h.z + h.nz * 0.05, 0.3);
    if (h.kind === 'door') return;
    if (h.kind === 'ceil' && !this.zoneOf(Math.floor(h.x / TILE), Math.floor(h.z / TILE)).ceil) return;
    const m = this.decals[this.decalI++ % this.decals.length];
    m.position.set(h.x + h.nx * 0.012, h.y + h.ny * 0.012, h.z + h.nz * 0.012);
    if (h.ny !== 0) m.rotation.set(-Math.PI / 2 * h.ny, 0, 0);
    else m.rotation.set(0, Math.atan2(h.nx, h.nz), 0);
    m.visible = true;
  }

  spark(x, y, z, size = 0.3, life = 0.09) {
    const s = this.sparks[this.sparkI++ % this.sparks.length];
    s.position.set(x, y, z);
    s.scale.setScalar(size);
    s.userData.life = life;
    s.visible = true;
  }

  /** A grenade going off: one large flash and a ring of smaller ones. */
  blast(x, y, z) {
    this.spark(x, y, z, 7, 0.22);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.spark(x + Math.cos(a) * 1.6, y + (i % 2) * 0.7, z + Math.sin(a) * 1.6, 3, 0.16 + (i % 3) * 0.04);
    }
  }

  tracer(x0, y0, z0, x1, y1, z1) {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    if (len < 0.5) return;
    const m = this.tracers[this.tracerI++ % this.tracers.length];
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.lookAt(x1, y1, z1);
    m.scale.set(1, 1, len);
    m.userData.life = 0.07;
    m.visible = true;
  }

  update(dt) {
    this.time += dt;
    for (const m of this.tracers) {
      if (!m.visible) continue;
      m.userData.life -= dt;
      if (m.userData.life <= 0) m.visible = false;
    }
    for (const s of this.sparks) {
      if (!s.visible) continue;
      s.userData.life -= dt;
      if (s.userData.life <= 0) s.visible = false;
    }
    if (this.padMat) {
      const pulse = 0.65 + 0.35 * Math.sin(this.time * (this.exitReady ? 5 : 2));
      this.padMat.color.set(this.exitReady ? 0x35e06a : 0xd43a2f).multiplyScalar(pulse);
    }
  }

  dispose() {
    for (const o of this.owned) o.dispose();
    this.owned.length = 0;
  }
}
