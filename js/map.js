// The field map: a top-down plan that fills in as the player sees each tile.
// Objectives are marked from the start (that much was in the briefing); guards never are.
import { TILE } from './grid.js';

const REVEAL_TILES = 8;

const COL = {
  bg: '#070a0d',
  floor: '#1b262b',
  outdoor: '#16202a',
  wall: '#66757b',
  low: '#3d4e54',
  tall: '#52646a',
  door: '#aab3b8',
  blue: '#3f82ff',
  red: '#e2493b',
  amber: '#e8b34a',
  teal: '#58c7b8',
  green: '#35e06a',
};
const PICKUP_COL = {
  keyBlue: COL.blue, keyRed: COL.red, armor: '#5b8fe0', ammoPistol: '#8fb86a', ammoSmg: '#d0a850', smg: '#9aa3a8',
  shotgun: '#c98a52', rifle: '#8fae78', ammoShells: '#c0392b', ammoRifle: '#b9c2a0', grenade: '#6f9a4e',
};

export class FieldMap {
  constructor(game) {
    this.game = game;
    this.grid = game.grid;
    this.seen = new Uint8Array(this.grid.cols * this.grid.rows);
    this.t = 0;
    this.reveal();
  }

  /** Mark every tile the player has a clear line to, out to a few metres. */
  reveal() {
    const g = this.grid, p = this.game.player;
    const pc = g.tileC(p.x), pr = g.tileR(p.z);
    for (let r = Math.max(0, pr - REVEAL_TILES); r <= Math.min(g.rows - 1, pr + REVEAL_TILES); r++) {
      for (let c = Math.max(0, pc - REVEAL_TILES); c <= Math.min(g.cols - 1, pc + REVEAL_TILES); c++) {
        const i = r * g.cols + c;
        if (this.seen[i]) continue;
        if (Math.hypot(c - pc, r - pr) > REVEAL_TILES) continue;
        if (g.los(p.x, p.z, g.cx(c), g.cz(r))) this.seen[i] = 1;
      }
    }
  }

  update(dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.2;
    this.reveal();
  }

  isSeen(x, z) {
    const g = this.grid;
    return this.seen[g.tileR(z) * g.cols + g.tileC(x)] === 1;
  }

  /** Name of the area the player is standing in. */
  zoneName() {
    const g = this.grid, p = this.game.player;
    return this.game.world.zoneOf(g.tileC(p.x), g.tileR(p.z)).name;
  }

  draw(canvas) {
    const game = this.game, g = this.grid, world = game.world;
    const s = Math.max(4, Math.floor(Math.min(canvas.width / g.cols, canvas.height / g.rows)));
    const ox = Math.floor((canvas.width - s * g.cols) / 2);
    const oy = Math.floor((canvas.height - s * g.rows) / 2);
    const k = s / TILE; // pixels per metre
    const X = (x) => ox + x * k, Y = (z) => oy + z * k;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        if (!this.seen[r * g.cols + c]) continue;
        const ch = g.ch(c, r);
        const px = ox + c * s, py = oy + r * s;
        if (ch === '#') { ctx.fillStyle = COL.wall; ctx.fillRect(px, py, s, s); continue; }
        ctx.fillStyle = world.zoneOf(c, r).ceil ? COL.floor : COL.outdoor;
        ctx.fillRect(px, py, s, s);
        if (ch === 'c' || ch === 'C') {
          ctx.fillStyle = ch === 'c' ? COL.low : COL.tall;
          ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
        } else if (ch === 'D') {
          const d = g.doorAt.get(r * g.cols + c);
          ctx.fillStyle = d.lock === 'blue' ? COL.blue : d.lock === 'red' ? COL.red : COL.door;
          const t = Math.max(2, Math.round(s * 0.3));
          if (d.alongX) ctx.fillRect(px, py + (s - t) / 2, s, t);
          else ctx.fillRect(px + (s - t) / 2, py, t, s);
        }
      }
    }

    const dot = (x, z, rad, color) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(X(x), Y(z), rad, 0, Math.PI * 2); ctx.fill();
    };
    for (const pk of game.pickups) {
      if (!pk.taken && this.isSeen(pk.x, pk.z)) dot(pk.x, pk.z, s * 0.22, PICKUP_COL[pk.kind] || COL.door);
    }
    for (const cam of game.cameras) {
      if (!cam.alive || !game.alarm.enabled || !this.isSeen(cam.x, cam.z)) continue;
      ctx.strokeStyle = COL.red; ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.beginPath();
      ctx.moveTo(X(cam.x), Y(cam.z));
      ctx.lineTo(X(cam.x + Math.sin(cam.yaw) * 3), Y(cam.z + Math.cos(cam.yaw) * 3));
      ctx.stroke();
      dot(cam.x, cam.z, s * 0.25, COL.red);
    }

    // Exit: red until every other objective is done.
    const ex = game.exit;
    ctx.strokeStyle = world.exitReady ? COL.green : COL.red;
    ctx.lineWidth = Math.max(2, s * 0.18);
    ctx.strokeRect(X(ex.x) - s * 0.45, Y(ex.z) - s * 0.45, s * 0.9, s * 0.9);

    // Open objectives as amber diamonds.
    const blink = 0.6 + 0.4 * Math.sin(performance.now() / 180);
    for (const it of game.interactables) {
      if (it.done || !it.objective || !game.objectives.some((o) => o.id === it.objective && !o.done)) continue;
      const cx = X(it.px), cy = Y(it.pz), d = s * 0.55;
      ctx.globalAlpha = blink;
      ctx.fillStyle = COL.amber;
      ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Player arrow.
    const p = game.player;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const cx = X(p.x), cy = Y(p.z), L = s * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + fx * L, cy + fz * L);
    ctx.lineTo(cx - fx * L * 0.6 - fz * L * 0.6, cy - fz * L * 0.6 + fx * L * 0.6);
    ctx.lineTo(cx - fx * L * 0.6 + fz * L * 0.6, cy - fz * L * 0.6 - fx * L * 0.6);
    ctx.fill();
  }
}
