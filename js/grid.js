// Tile grid: collision, line of sight, bullet raycasts and pathfinding.
// Pure logic with no rendering dependencies.

export const TILE = 2;      // metres per tile
export const WALL_H = 3.2;  // wall height
export const LOW_H = 1.1;   // low cover (crates, desks): crouch behind it to hide
export const TALL_H = 2.2;  // tall stacks and server racks
export const DOOR_H = 2.4;

export class Grid {
  constructor(rows) {
    this.rows = rows.length;
    this.cols = rows[0].length;
    this.t = [];
    this.doors = [];
    this.doorAt = new Map();
    this.start = null;
    this.exit = null;

    for (let r = 0; r < this.rows; r++) {
      if (rows[r].length !== this.cols) {
        throw new Error(`Map row ${r} is ${rows[r].length} wide, expected ${this.cols}`);
      }
      const line = [];
      for (let c = 0; c < this.cols; c++) {
        let ch = rows[r][c];
        if (ch === 'P') { this.start = { c, r }; ch = '.'; }
        else if (ch === 'X') { this.exit = { c, r }; ch = '.'; }
        else if (ch === 'D' || ch === '1' || ch === '2') {
          const door = {
            c, r,
            x: (c + 0.5) * TILE, z: (r + 0.5) * TILE,
            lock: ch === '1' ? 'blue' : ch === '2' ? 'red' : null,
            open: 0, want: false, hold: 0, alongX: false, mesh: null,
          };
          this.doors.push(door);
          this.doorAt.set(r * this.cols + c, door);
          ch = 'D';
        }
        line.push(ch);
      }
      this.t.push(line);
    }
    // A door "along X" has walls to its west and east, so you pass through it north-south.
    for (const d of this.doors) {
      d.alongX = this.ch(d.c - 1, d.r) === '#' && this.ch(d.c + 1, d.r) === '#';
    }
  }

  ch(c, r) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return '#';
    return this.t[r][c];
  }

  tileC(x) { return Math.floor(x / TILE); }
  tileR(z) { return Math.floor(z / TILE); }
  cx(c) { return (c + 0.5) * TILE; }
  cz(r) { return (r + 0.5) * TILE; }

  /** Blocks movement right now (walls, props, doors that are not open). */
  solid(c, r) {
    const ch = this.ch(c, r);
    if (ch === '.') return false;
    if (ch === 'D') return this.doorAt.get(r * this.cols + c).open < 0.85;
    return true;
  }

  /** Tiles guards may path through (doors open for them). */
  walkable(c, r) {
    const ch = this.ch(c, r);
    return ch === '.' || ch === 'D';
  }

  /** Height of whatever stands in the tile, for 3D ray tests. */
  height(c, r) {
    const ch = this.ch(c, r);
    if (ch === '.') return 0;
    if (ch === '#') return Infinity;
    if (ch === 'c') return LOW_H;
    if (ch === 'C') return TALL_H;
    if (ch === 'D') return this.doorAt.get(r * this.cols + c).open < 0.5 ? Infinity : 0;
    return 0;
  }

  /** Flat line of sight that ignores low cover. Used for light and sound. */
  los(x0, z0, x1, z1) {
    let c = Math.floor(x0 / TILE), r = Math.floor(z0 / TILE);
    const c1 = Math.floor(x1 / TILE), r1 = Math.floor(z1 / TILE);
    const dx = x1 - x0, dz = z1 - z0;
    const sc = dx > 0 ? 1 : -1, sr = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(TILE / dx) : Infinity;
    const tdz = dz !== 0 ? Math.abs(TILE / dz) : Infinity;
    let tmx = dx !== 0 ? (dx > 0 ? (c + 1) * TILE - x0 : x0 - c * TILE) / Math.abs(dx) : Infinity;
    let tmz = dz !== 0 ? (dz > 0 ? (r + 1) * TILE - z0 : z0 - r * TILE) / Math.abs(dz) : Infinity;
    for (let i = 0; i < 256 && (c !== c1 || r !== r1); i++) {
      if (tmx < tmz) { c += sc; tmx += tdx; } else { r += sr; tmz += tdz; }
      if (c === c1 && r === r1) break;
      if (tmx > 1 && tmz > 1 && (c !== c1 || r !== r1)) {
        // Past the end of the segment without landing on the target tile (edge grazing).
        return this.height(c, r) < TALL_H;
      }
      if (this.height(c, r) >= TALL_H) return false;
    }
    return true;
  }

  /**
   * 3D ray against the level. Direction must be normalised.
   * Returns null or { dist, x, y, z, nx, ny, nz, kind }.
   */
  raycast(ox, oy, oz, dx, dy, dz, maxDist) {
    let c = Math.floor(ox / TILE), r = Math.floor(oz / TILE);
    const sc = dx > 0 ? 1 : -1, sr = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? TILE / Math.abs(dx) : Infinity;
    const tdz = dz !== 0 ? TILE / Math.abs(dz) : Infinity;
    let tmx = dx !== 0 ? (dx > 0 ? (c + 1) * TILE - ox : ox - c * TILE) / Math.abs(dx) : Infinity;
    let tmz = dz !== 0 ? (dz > 0 ? (r + 1) * TILE - oz : oz - r * TILE) / Math.abs(dz) : Infinity;
    let curH = this.height(c, r);
    if (curH === Infinity || oy < curH) curH = 0;
    let t = 0;
    const hit = (d, nx, ny, nz, kind) => ({
      dist: d, x: ox + dx * d, y: oy + dy * d, z: oz + dz * d, nx, ny, nz, kind,
    });

    for (let i = 0; i < 400; i++) {
      const tn = Math.min(tmx, tmz, maxDist);
      const yn = oy + dy * tn;
      if (dy < 0 && yn < curH) {
        const th = (curH - oy) / dy;
        if (th >= t - 1e-6) return hit(th, 0, 1, 0, curH > 0 ? 'prop' : 'floor');
      } else if (dy > 0 && yn > WALL_H) {
        return hit((WALL_H - oy) / dy, 0, -1, 0, 'ceil');
      }
      if (tn >= maxDist) return null;
      let nx = 0, nz = 0;
      if (tmx < tmz) { c += sc; tmx += tdx; nx = -sc; } else { r += sr; tmz += tdz; nz = -sr; }
      t = tn;
      const h = this.height(c, r);
      if (oy + dy * t < h) {
        const ch = this.ch(c, r);
        return hit(t, nx, 0, nz, ch === '#' ? 'wall' : ch === 'D' ? 'door' : 'prop');
      }
      curH = h;
    }
    return null;
  }

  /** True when nothing in the level blocks the segment between two 3D points. */
  visible(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const d = Math.hypot(dx, dy, dz);
    if (d < 0.05) return true;
    return !this.raycast(ax, ay, az, dx / d, dy / d, dz / d, d - 0.05);
  }

  /** Push a circle out of solid tiles. Returns the corrected position. */
  collide(x, z, rad) {
    for (let pass = 0; pass < 3; pass++) {
      const c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
      const r0 = Math.floor((z - rad) / TILE), r1 = Math.floor((z + rad) / TILE);
      let moved = false;
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (!this.solid(c, r)) continue;
          const nx = Math.max(c * TILE, Math.min(x, (c + 1) * TILE));
          const nz = Math.max(r * TILE, Math.min(z, (r + 1) * TILE));
          let dx = x - nx, dz = z - nz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= rad * rad) continue;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            x += (dx / d) * (rad - d);
            z += (dz / d) * (rad - d);
          } else {
            // Centre is inside the tile: leave through the nearest edge.
            dx = x - (c + 0.5) * TILE; dz = z - (r + 0.5) * TILE;
            if (Math.abs(dx) > Math.abs(dz)) x = dx > 0 ? (c + 1) * TILE + rad : c * TILE - rad;
            else z = dz > 0 ? (r + 1) * TILE + rad : r * TILE - rad;
          }
          moved = true;
        }
      }
      if (!moved) break;
    }
    return { x, z };
  }

  /** A* over walkable tiles (8 directions, no corner cutting). Returns tile centres, start excluded. */
  findPath(c0, r0, c1, r1) {
    if (!this.walkable(c1, r1)) {
      const near = this.nearestWalkable(c1, r1);
      if (!near) return null;
      c1 = near.c; r1 = near.r;
    }
    if (!this.walkable(c0, r0)) {
      const near = this.nearestWalkable(c0, r0);
      if (!near) return null;
      c0 = near.c; r0 = near.r;
    }
    if (c0 === c1 && r0 === r1) return [];
    const W = this.cols, N = W * this.rows;
    const g = new Float32Array(N).fill(Infinity);
    const f = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const start = r0 * W + c0, goal = r1 * W + c1;
    const heur = (c, r) => {
      const a = Math.abs(c - c1), b = Math.abs(r - r1);
      return Math.max(a, b) + 0.4142 * Math.min(a, b);
    };
    g[start] = 0; f[start] = heur(c0, r0);
    const open = [start];
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
      const cur = open[bi];
      open[bi] = open[open.length - 1]; open.pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cc = cur % W, cr = (cur - cc) / W;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = cc + dc, nr = cr + dr;
          if (!this.walkable(nc, nr)) continue;
          if (dc && dr && (!this.walkable(cc + dc, cr) || !this.walkable(cc, cr + dr))) continue;
          const ni = nr * W + nc;
          if (closed[ni]) continue;
          const ng = g[cur] + (dc && dr ? 1.4142 : 1);
          if (ng < g[ni]) {
            g[ni] = ng; f[ni] = ng + heur(nc, nr); came[ni] = cur;
            open.push(ni);
          }
        }
      }
    }
    if (came[goal] === -1) return null;
    const path = [];
    for (let i = goal; i !== start; i = came[i]) {
      const c = i % W, r = (i - c) / W;
      path.push({ c, r, x: (c + 0.5) * TILE, z: (r + 0.5) * TILE });
    }
    return path.reverse();
  }

  nearestWalkable(c, r) {
    for (let rad = 1; rad <= 3; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (this.walkable(c + dc, r + dr)) return { c: c + dc, r: r + dr };
        }
      }
    }
    return null;
  }
}
