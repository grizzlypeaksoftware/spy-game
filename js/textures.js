// Every surface in the game is painted here at load time onto small canvases,
// so the project ships with no image files.
import * as THREE from 'three';

function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tex(w, h, seed, draw, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  draw(g, w, h, rng(seed));
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = opts.noMip ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = !opts.noMip;
  t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function grain(g, w, h, rnd, amt) {
  const im = g.getImageData(0, 0, w, h);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(im, 0, 0);
}

function stains(g, w, h, rnd, count, color) {
  g.fillStyle = color;
  for (let i = 0; i < count; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.1;
    g.beginPath();
    g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 9, 2 + rnd() * 6, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

// Walls are 64x128 and stretch over the full wall height, so y=0 is the ceiling line.
function wallBase(g, w, h, upper, lower, lowerH, rail) {
  g.fillStyle = upper; g.fillRect(0, 0, w, h);
  g.fillStyle = lower; g.fillRect(0, h - lowerH, w, lowerH);
  g.fillStyle = rail; g.fillRect(0, h - lowerH - 3, w, 3);
  g.fillRect(0, h - 5, w, 5);
  g.fillRect(0, 0, w, 3);
}

export function makeTextures() {
  const T = {};

  T.concrete = tex(64, 128, 11, (g, w, h, r) => {
    g.fillStyle = '#7c7e7d'; g.fillRect(0, 0, w, h);
    stains(g, w, h, r, 14, '#000');
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 31; y < h; y += 32) g.fillRect(0, y, w, 1);
    g.fillRect(0, 0, 1, h);
    const grad = g.createLinearGradient(0, h - 26, 0, h);
    grad.addColorStop(0, 'rgba(20,24,20,0)'); grad.addColorStop(1, 'rgba(20,24,20,0.55)');
    g.fillStyle = grad; g.fillRect(0, h - 26, w, 26);
    grain(g, w, h, r, 30);
  });

  T.brick = tex(64, 128, 12, (g, w, h, r) => {
    g.fillStyle = '#3d352f'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      const off = (y / 8) % 2 ? 8 : 0;
      for (let x = -16; x < w; x += 16) {
        const v = 0.8 + r() * 0.4;
        g.fillStyle = `rgb(${(118 * v) | 0},${(66 * v) | 0},${(50 * v) | 0})`;
        g.fillRect(x + off + 1, y + 1, 14, 6);
      }
    }
    stains(g, w, h, r, 8, '#000');
    grain(g, w, h, r, 26);
  });

  T.metal = tex(64, 128, 13, (g, w, h, r) => {
    for (let x = 0; x < w; x++) {
      const s = Math.sin((x / w) * Math.PI * 2 * 8);
      const v = 0.78 + s * 0.2;
      g.fillStyle = `rgb(${(86 * v) | 0},${(100 * v) | 0},${(112 * v) | 0})`;
      g.fillRect(x, 0, 1, h);
    }
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.fillRect(0, 62, w, 2); g.fillRect(0, 0, w, 3); g.fillRect(0, h - 4, w, 4);
    g.fillStyle = '#6b3d22';
    for (let i = 0; i < 26; i++) {
      g.globalAlpha = 0.25 + r() * 0.3;
      g.fillRect(r() * w, h - 4 - r() * 26, 1 + r() * 3, 1 + r() * 5);
    }
    g.globalAlpha = 1;
    grain(g, w, h, r, 18);
  });

  T.panel = tex(64, 128, 14, (g, w, h, r) => {
    wallBase(g, w, h, '#9fa39a', '#2f4d4c', 44, '#182827');
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(0, 3, 1, h - 52); g.fillRect(32, 3, 1, h - 52);
    grain(g, w, h, r, 16);
  });

  T.office = tex(64, 128, 15, (g, w, h, r) => {
    wallBase(g, w, h, '#a9987a', '#5c3e27', 50, '#2e1d10');
    g.fillStyle = 'rgba(80,50,20,0.14)';
    for (let x = 4; x < w; x += 8) g.fillRect(x, 3, 2, h - 58);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let x = 0; x < w; x += 16) g.fillRect(x, h - 50, 1, 45);
    grain(g, w, h, r, 16);
  });

  T.security = tex(64, 128, 16, (g, w, h, r) => {
    wallBase(g, w, h, '#5f6a75', '#3a434c', 40, '#1c2228');
    g.fillStyle = '#c98a2b'; g.fillRect(0, 40, w, 3);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, 3, 1, h); g.fillRect(32, 3, 1, h);
    g.fillStyle = '#8b96a0';
    for (const x of [3, 28, 35, 60]) for (const y of [8, 76, 94, 118]) g.fillRect(x, y, 1, 1);
    grain(g, w, h, r, 14);
  });

  T.server = tex(64, 128, 17, (g, w, h, r) => {
    g.fillStyle = '#23292f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#161a1e';
    g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h); g.fillRect(0, 0, w, 3); g.fillRect(0, h - 5, w, 5);
    for (let y = 56; y < 76; y += 4) { g.fillRect(6, y, 20, 2); g.fillRect(38, y, 20, 2); }
    g.fillStyle = '#2fd6e6'; g.fillRect(0, 34, w, 2);
    g.fillStyle = '#187f8c'; g.fillRect(0, 100, w, 1);
    grain(g, w, h, r, 10);
  });

  T.trim = tex(64, 128, 18, (g, w, h, r) => {
    g.fillStyle = '#2b2f33'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a4046'; g.fillRect(4, 0, 2, h); g.fillRect(58, 0, 2, h);
    grain(g, w, h, r, 12);
  });

  T.floorConcrete = tex(64, 64, 21, (g, w, h, r) => {
    g.fillStyle = '#6b6c69'; g.fillRect(0, 0, w, h);
    stains(g, w, h, r, 12, '#000');
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    grain(g, w, h, r, 26);
  });

  T.asphalt = tex(64, 64, 22, (g, w, h, r) => {
    g.fillStyle = '#3b3d40'; g.fillRect(0, 0, w, h);
    stains(g, w, h, r, 10, '#000');
    grain(g, w, h, r, 44);
  });

  T.carpet = tex(64, 64, 23, (g, w, h, r) => {
    g.fillStyle = '#5b2f33'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6d3b3e';
    for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) g.fillRect(x, y, 2, 2);
    grain(g, w, h, r, 22);
  });

  T.tile = tex(64, 64, 24, (g, w, h, r) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      g.fillStyle = (x + y) % 2 ? '#7a807f' : '#8f9493';
      g.fillRect(x * 32, y * 32, 32, 32);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, 0, w, 1); g.fillRect(0, 32, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h);
    grain(g, w, h, r, 14);
  });

  T.serverFloor = tex(64, 64, 25, (g, w, h, r) => {
    g.fillStyle = '#3d444b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#23282d';
    g.fillRect(0, 0, w, 1); g.fillRect(0, 32, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h);
    g.fillStyle = '#59636c';
    for (const x of [3, 28, 35, 60]) for (const y of [3, 28, 35, 60]) g.fillRect(x, y, 2, 2);
    grain(g, w, h, r, 12);
  });

  T.ceiling = tex(64, 64, 26, (g, w, h, r) => {
    g.fillStyle = '#4d4f51'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c2e30';
    g.fillRect(0, 0, w, 2); g.fillRect(0, 32, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(32, 0, 2, h);
    grain(g, w, h, r, 14);
  });

  const crate = (brace) => (g, w, h, r) => {
    g.fillStyle = '#8b6a3d'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,24,8,0.35)';
    for (let x = 12; x < w; x += 12) g.fillRect(x, 0, 1, h);
    if (brace) {
      g.strokeStyle = '#6b4e29'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(4, h - 4); g.lineTo(w - 4, 4); g.stroke();
    }
    g.fillStyle = '#6b4e29';
    g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    g.fillStyle = '#2a1c0c';
    for (const [x, y] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4]]) g.fillRect(x, y, 2, 2);
    if (brace) { g.fillStyle = 'rgba(20,20,20,0.7)'; g.fillRect(12, 44, 18, 3); g.fillRect(12, 49, 12, 3); }
    grain(g, w, h, r, 26);
  };
  T.crate = tex(64, 64, 31, crate(true));
  T.crateTop = tex(64, 64, 32, crate(false));

  T.desk = tex(64, 64, 33, (g, w, h, r) => {
    g.fillStyle = '#515b56'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a423e'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 5, w, 5);
    g.strokeStyle = '#2c3330'; g.lineWidth = 1;
    for (const x of [4, 34]) for (const y of [8, 32]) {
      g.strokeRect(x + 0.5, y + 0.5, 26, 20);
      g.fillStyle = '#9aa39e'; g.fillRect(x + 9, y + 9, 8, 2);
    }
    grain(g, w, h, r, 14);
  });

  T.deskTop = tex(64, 64, 34, (g, w, h, r) => {
    g.fillStyle = '#74573a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,24,8,0.25)';
    for (let y = 5; y < h; y += 9) g.fillRect(0, y, w, 1);
    g.fillStyle = '#233029'; g.fillRect(8, 30, 30, 22);
    g.fillStyle = '#e4e0d2'; g.fillRect(42, 10, 14, 18); g.fillRect(44, 34, 13, 17);
    g.fillStyle = '#8c8a80';
    for (let y = 13; y < 26; y += 3) g.fillRect(44, y, 10, 1);
    g.fillStyle = '#1b1d1f'; g.fillRect(10, 8, 24, 10);
    grain(g, w, h, r, 16);
  });

  T.rack = tex(64, 128, 35, (g, w, h, r) => {
    g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#262b30'; g.fillRect(2, 2, w - 4, h - 4);
    const leds = ['#35e06a', '#35e06a', '#e8b34a', '#2fd6e6', '#e2493b'];
    for (let y = 6; y < h - 8; y += 8) {
      g.fillStyle = '#0d0f11'; g.fillRect(4, y, w - 8, 6);
      g.fillStyle = '#30363c';
      for (let x = 22; x < w - 8; x += 3) g.fillRect(x, y + 1, 1, 4);
      for (let i = 0; i < 4; i++) {
        if (r() < 0.25) continue;
        g.fillStyle = leds[(r() * leds.length) | 0];
        g.fillRect(6 + i * 4, y + 2, 2, 2);
      }
    }
  });

  T.rackTop = tex(32, 32, 36, (g, w, h, r) => {
    g.fillStyle = '#1b1f23'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0d0f11';
    for (let y = 4; y < h; y += 4) g.fillRect(4, y, w - 8, 2);
    grain(g, w, h, r, 8);
  });

  const door = (stripe) => (g, w, h, r) => {
    g.fillStyle = '#6d747a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4c5258';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
    g.strokeStyle = '#4c5258'; g.lineWidth = 2;
    g.strokeRect(9, 12, w - 18, 34); g.strokeRect(9, 78, w - 18, 38);
    g.fillStyle = '#10161c'; g.fillRect(22, 18, 20, 22);
    g.fillStyle = 'rgba(120,170,200,0.25)'; g.fillRect(24, 20, 6, 18);
    g.fillStyle = stripe; g.fillRect(3, 54, w - 6, 14);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(3, 54, w - 6, 1); g.fillRect(3, 67, w - 6, 1);
    g.fillStyle = '#d9dde0'; g.fillRect(w - 13, 58, 6, 6);
    grain(g, w, h, r, 14);
  };
  T.door = {
    none: tex(64, 128, 41, door('#8a9096')),
    blue: tex(64, 128, 42, door('#2f6fe0')),
    red: tex(64, 128, 43, door('#d43a2f')),
  };

  T.lift = tex(64, 128, 44, (g, w, h, r) => {
    g.fillStyle = '#585e63'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2e31'; g.fillRect(31, 0, 2, h); g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
    g.save(); g.beginPath(); g.rect(3, 4, w - 6, 12); g.clip();
    for (let x = -16; x < w + 16; x += 12) {
      g.fillStyle = '#e8b34a'; g.beginPath();
      g.moveTo(x, 16); g.lineTo(x + 6, 16); g.lineTo(x + 18, 4); g.lineTo(x + 12, 4); g.fill();
    }
    g.restore();
    grain(g, w, h, r, 12);
  });

  T.screen = tex(32, 32, 45, (g, w, h, r) => {
    g.fillStyle = '#06131a'; g.fillRect(0, 0, w, h);
    for (let y = 3; y < h - 2; y += 3) {
      g.fillStyle = r() < 0.2 ? '#e8b34a' : '#3be08a';
      g.fillRect(3, y, 4 + r() * 22, 1);
    }
  });

  T.pad = tex(64, 64, 46, (g, w, h) => {
    g.fillStyle = '#1a1c1e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5;
    g.strokeRect(5, 5, w - 10, h - 10);
    g.lineWidth = 4;
    for (const y of [40, 28]) {
      g.beginPath(); g.moveTo(18, y + 8); g.lineTo(32, y - 6); g.lineTo(46, y + 8); g.stroke();
    }
  });

  // --- auction house ---

  T.plaster = tex(64, 128, 61, (g, w, h, r) => {
    wallBase(g, w, h, '#b9b3a2', '#8f8a7c', 34, '#5a5549');
    stains(g, w, h, r, 6, '#3a2f1c');
    grain(g, w, h, r, 14);
  });

  T.gallery = tex(64, 128, 62, (g, w, h, r) => {
    wallBase(g, w, h, '#2f4a3c', '#3b2a1c', 40, '#1c130b');
    g.fillStyle = 'rgba(190,170,110,0.13)';
    for (let y = 8; y < h - 46; y += 12) for (let x = (y / 12) % 2 ? 8 : 0; x < w; x += 16) {
      g.fillRect(x + 3, y, 2, 6); g.fillRect(x + 1, y + 2, 6, 2);
    }
    g.fillStyle = '#b08d3c'; g.fillRect(0, h - 44, w, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let x = 0; x < w; x += 32) g.fillRect(x, h - 40, 1, 35);
    grain(g, w, h, r, 12);
  });

  T.parquet = tex(64, 64, 63, (g, w, h, r) => {
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
      const v = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${(122 * v) | 0},${(82 * v) | 0},${(46 * v) | 0})`;
      g.fillRect(x, y, 16, 16);
      g.fillStyle = 'rgba(30,16,4,0.3)';
      if (((x + y) / 16) % 2) for (let i = 4; i < 16; i += 4) g.fillRect(x + i, y, 1, 16);
      else for (let i = 4; i < 16; i += 4) g.fillRect(x, y + i, 16, 1);
    }
    grain(g, w, h, r, 14);
  });

  T.marble = tex(64, 64, 64, (g, w, h, r) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      g.fillStyle = (x + y) % 2 ? '#2b2e31' : '#b4b1a8';
      g.fillRect(x * 32, y * 32, 32, 32);
    }
    g.strokeStyle = 'rgba(120,120,120,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      let x = r() * w, y = r() * h; g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 22; g.lineTo(x, y); }
      g.stroke();
    }
    grain(g, w, h, r, 10);
  });

  T.cobble = tex(64, 64, 65, (g, w, h, r) => {
    g.fillStyle = '#25272a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? -4 : 0; x < w; x += 8) {
      const v = 0.75 + r() * 0.45;
      g.fillStyle = `rgb(${(74 * v) | 0},${(76 * v) | 0},${(80 * v) | 0})`;
      g.fillRect(x + 1, y + 1, 6, 6);
    }
    grain(g, w, h, r, 22);
  });

  T.plinth = tex(64, 64, 66, (g, w, h, r) => {
    g.fillStyle = '#a8a59b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8b887f'; g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, w, 5);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 5, w, 1); g.fillRect(0, h - 9, w, 1);
    g.fillStyle = '#b08d3c'; g.fillRect(22, 24, 20, 9);
    g.fillStyle = '#4a3c1a'; g.fillRect(25, 27, 14, 1); g.fillRect(25, 30, 9, 1);
    stains(g, w, h, r, 5, '#000');
    grain(g, w, h, r, 12);
  });

  T.plinthTop = tex(64, 64, 67, (g, w, h, r) => {
    g.fillStyle = '#8b887f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16303a'; g.fillRect(5, 5, w - 10, h - 10);
    g.fillStyle = 'rgba(160,220,235,0.22)';
    g.beginPath(); g.moveTo(8, 40); g.lineTo(40, 8); g.lineTo(52, 8); g.lineTo(8, 52); g.fill();
    g.fillStyle = '#c9a54e'; g.fillRect(24, 26, 16, 12);
    g.fillStyle = '#7a1f1a'; g.fillRect(28, 29, 8, 6);
    grain(g, w, h, r, 8);
  });

  T.exitDoors = tex(64, 128, 68, (g, w, h, r) => {
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e120a'; g.fillRect(31, 0, 2, h); g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
    g.strokeStyle = '#5a3a22'; g.lineWidth = 2;
    for (const x of [7, 37]) { g.strokeRect(x, 50, 20, 30); g.strokeRect(x, 88, 20, 32); }
    g.fillStyle = '#0c1a26';
    for (const x of [7, 37]) g.fillRect(x, 10, 20, 32);
    g.fillStyle = 'rgba(140,190,230,0.3)';
    for (const x of [9, 39]) g.fillRect(x, 12, 5, 28);
    g.fillStyle = '#c9a54e'; g.fillRect(26, 62, 3, 12); g.fillRect(35, 62, 3, 12);
    grain(g, w, h, r, 12);
  });

  // --- breaking yard ---

  T.rust = tex(64, 128, 71, (g, w, h, r) => {
    g.fillStyle = '#4c3a30'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) {
      const v = 0.8 + r() * 0.4;
      g.fillStyle = `rgb(${(96 * v) | 0},${(62 * v) | 0},${(44 * v) | 0})`;
      g.fillRect(x + 1, y + 1, 30, 30);
      g.fillStyle = '#2a1e18';
      for (const [dx, dy] of [[3, 3], [27, 3], [3, 27], [27, 27]]) g.fillRect(x + dx, y + dy, 2, 2);
    }
    stains(g, w, h, r, 16, '#1a0d06');
    g.fillStyle = '#b5622a';
    for (let i = 0; i < 40; i++) { g.globalAlpha = 0.15 + r() * 0.25; g.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 9); }
    g.globalAlpha = 1;
    grain(g, w, h, r, 24);
  });

  T.gravel = tex(64, 64, 72, (g, w, h, r) => {
    g.fillStyle = '#3a3733'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const v = 40 + r() * 60;
      g.fillStyle = `rgb(${v | 0},${(v * 0.96) | 0},${(v * 0.9) | 0})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    stains(g, w, h, r, 6, '#000');
    grain(g, w, h, r, 24);
  });

  T.grate = tex(64, 64, 73, (g, w, h, r) => {
    g.fillStyle = '#17191b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4c5257';
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h);
    for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 2);
    g.fillStyle = '#6b7278'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    grain(g, w, h, r, 12);
  });

  T.plank = tex(64, 64, 74, (g, w, h, r) => {
    for (let y = 0; y < h; y += 8) {
      const v = 0.75 + r() * 0.4;
      g.fillStyle = `rgb(${(70 * v) | 0},${(58 * v) | 0},${(46 * v) | 0})`;
      g.fillRect(0, y, w, 8);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, y, w, 1);
      g.fillRect(((r() * 6) | 0) * 10 + 4, y, 1, 8);
    }
    stains(g, w, h, r, 10, '#0a1418');
    grain(g, w, h, r, 20);
  });

  T.hull = tex(64, 64, 75, (g, w, h, r) => {
    g.fillStyle = '#5a2f22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#33404a'; g.fillRect(0, 0, w, 22);
    g.fillStyle = '#c8c4b4'; g.fillRect(0, 22, w, 2);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h); g.fillRect(0, 0, w, 1);
    g.fillStyle = '#20150f';
    for (let x = 4; x < w; x += 8) { g.fillRect(x, 3, 1, 1); g.fillRect(x, h - 4, 1, 1); }
    g.fillStyle = '#b5622a';
    for (let i = 0; i < 30; i++) { g.globalAlpha = 0.2 + r() * 0.3; g.fillRect(r() * w, r() * h, 1 + r() * 3, 2 + r() * 8); }
    g.globalAlpha = 1;
    grain(g, w, h, r, 22);
  });

  T.hullTop = tex(64, 64, 76, (g, w, h, r) => {
    g.fillStyle = '#4a3229'; g.fillRect(0, 0, w, h);
    stains(g, w, h, r, 14, '#1a0d06');
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    grain(g, w, h, r, 24);
  });

  T.machine = tex(64, 64, 77, (g, w, h, r) => {
    g.fillStyle = '#4d5a52'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#39443d'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 6, w, 6); g.fillRect(0, 0, 2, h); g.fillRect(32, 0, 2, h);
    g.fillStyle = '#15191a'; g.fillRect(6, 10, 20, 14); g.fillRect(38, 10, 20, 14);
    g.fillStyle = '#3be08a'; g.fillRect(8, 13, 9, 1); g.fillRect(8, 17, 14, 1);
    g.fillStyle = '#e8b34a'; g.fillRect(40, 13, 12, 1); g.fillRect(40, 20, 6, 1);
    g.fillStyle = '#1c2120';
    for (let y = 34; y < 52; y += 4) { g.fillRect(6, y, 20, 2); g.fillRect(38, y, 20, 2); }
    g.fillStyle = '#d43a2f'; g.fillRect(27, 30, 3, 3);
    g.save(); g.beginPath(); g.rect(2, h - 6, w - 2, 6); g.clip();
    g.fillStyle = '#e8b34a';
    for (let x = -8; x < w + 8; x += 10) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 5, h); g.lineTo(x + 11, h - 6); g.lineTo(x + 6, h - 6); g.fill(); }
    g.restore();
    grain(g, w, h, r, 12);
  });

  T.machineTop = tex(64, 64, 78, (g, w, h, r) => {
    g.fillStyle = '#3f4a44'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#262d2a'; g.fillRect(8, 8, 20, 20); g.fillRect(36, 36, 20, 20);
    g.fillStyle = '#5c6a62';
    for (const [x, y] of [[3, 3], [59, 3], [3, 59], [59, 59]]) g.fillRect(x, y, 2, 2);
    g.strokeStyle = '#1a1f1d'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(40, 10); g.lineTo(40, 28); g.lineTo(18, 46); g.stroke();
    grain(g, w, h, r, 12);
  });

  // --- later operations ---

  // Bank vault: rows of numbered deposit boxes.
  const boxes = (base, face, lock) => (g, w, h, r) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 2; y < h - 2; y += 14) for (let x = 2; x < w; x += 15) {
      const v = 0.9 + r() * 0.2;
      g.fillStyle = face; g.globalAlpha = v > 1 ? 1 : 0.85; g.fillRect(x, y, 13, 12); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, 13, 1);
      g.fillStyle = lock; g.fillRect(x + 9, y + 5, 2, 3);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 2, y + 3, 5, 1);
    }
    grain(g, w, h, r, 10);
  };
  T.vault = tex(64, 128, 81, boxes('#2c3236', '#7d878c', '#d6b24a'));
  T.deposit = tex(64, 128, 82, boxes('#23282b', '#8f989c', '#c9a03c'));

  // Rail yard
  T.ballast = tex(64, 64, 83, (g, w, h, r) => {
    g.fillStyle = '#34312e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      const v = 36 + r() * 56;
      g.fillStyle = `rgb(${v | 0},${(v * 0.95) | 0},${(v * 0.88) | 0})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    g.fillStyle = '#3d2c20';
    for (let x = 4; x < w; x += 16) g.fillRect(x, 0, 7, h);
    g.fillStyle = '#8b9196'; g.fillRect(0, 14, w, 3); g.fillRect(0, 47, w, 3);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, 17, w, 1); g.fillRect(0, 50, w, 1);
    grain(g, w, h, r, 20);
  });
  T.wagon = tex(64, 128, 84, (g, w, h, r) => {
    g.fillStyle = '#5b2a22'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h);
    g.fillStyle = '#3a1a15'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 22, w, 4);
    g.fillStyle = '#15171a'; g.fillRect(0, h - 18, w, 18);
    g.fillStyle = '#3c4146'; g.beginPath(); g.arc(16, h - 8, 7, 0, 7); g.arc(48, h - 8, 7, 0, 7); g.fill();
    g.fillStyle = '#d8d2c0'; g.fillRect(22, 40, 20, 12);
    g.fillStyle = '#5b2a22'; g.fillRect(25, 43, 14, 1); g.fillRect(25, 47, 9, 1);
    stains(g, w, h, r, 10, '#000');
    grain(g, w, h, r, 20);
  });
  T.wagonTop = tex(64, 64, 85, (g, w, h, r) => {
    g.fillStyle = '#3d3936'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h);
    stains(g, w, h, r, 10, '#000');
    grain(g, w, h, r, 18);
  });

  // Mountain station
  T.snow = tex(64, 64, 86, (g, w, h, r) => {
    g.fillStyle = '#b9c6d2'; g.fillRect(0, 0, w, h);
    stains(g, w, h, r, 16, '#5d7186');
    g.fillStyle = '#e8f0f6';
    for (let i = 0; i < 90; i++) g.fillRect(r() * w, r() * h, 1, 1);
    grain(g, w, h, r, 10);
  });
  T.rock = tex(64, 128, 87, (g, w, h, r) => {
    g.fillStyle = '#3d444b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const v = 44 + r() * 50;
      g.fillStyle = `rgb(${v | 0},${(v * 1.05) | 0},${(v * 1.12) | 0})`;
      g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 10, 3 + r() * 7, r() * 3, 0, 7); g.fill();
    }
    g.fillStyle = '#c4d0da'; g.fillRect(0, h - 10, w, 10);
    for (let x = 0; x < w; x += 4) g.fillRect(x, h - 10 - r() * 7, 4, 8);
    g.fillRect(0, 0, w, 3);
    grain(g, w, h, r, 22);
  });
  T.bunker = tex(64, 128, 88, (g, w, h, r) => {
    g.fillStyle = '#6c7068'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2);
    g.fillRect(31, 0, 2, h);
    g.fillStyle = '#4c5049'; g.fillRect(0, h - 26, w, 26);
    g.fillStyle = '#b89a3a'; g.fillRect(0, h - 29, w, 3);
    stains(g, w, h, r, 14, '#1c2018');
    grain(g, w, h, r, 22);
  });
  T.mast = tex(64, 128, 89, (g, w, h, r) => {
    g.fillStyle = '#20262b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8d979e'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 32) {
      g.beginPath(); g.moveTo(4, y); g.lineTo(60, y + 32); g.moveTo(60, y); g.lineTo(4, y + 32); g.stroke();
      g.strokeRect(4, y, 56, 32);
    }
    g.fillStyle = '#3a4248'; g.fillRect(18, 78, 28, 34);
    g.fillStyle = '#ff5a48'; g.fillRect(22, 84, 4, 3);
    g.fillStyle = '#3be08a'; g.fillRect(30, 84, 4, 3); g.fillRect(38, 84, 4, 3);
    grain(g, w, h, r, 12);
  });

  // Casino
  T.carpetRed = tex(64, 64, 90, (g, w, h, r) => {
    g.fillStyle = '#5a1820'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7a2a2c';
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
      g.beginPath(); g.moveTo(x + 8, y + 2); g.lineTo(x + 14, y + 8); g.lineTo(x + 8, y + 14); g.lineTo(x + 2, y + 8); g.fill();
    }
    g.fillStyle = '#b08a3a';
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) g.fillRect(x - 1, y - 1, 2, 2);
    grain(g, w, h, r, 16);
  });
  T.velvet = tex(64, 128, 91, (g, w, h, r) => {
    wallBase(g, w, h, '#4a141c', '#2a1712', 40, '#a8843a');
    g.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = 0; x < w; x += 16) g.fillRect(x, 3, 1, h - 46);
    g.fillStyle = '#a8843a';
    for (let x = 8; x < w; x += 16) g.fillRect(x, 40, 1, 1);
    grain(g, w, h, r, 12);
  });
  T.felt = tex(64, 64, 92, (g, w, h, r) => {
    g.fillStyle = '#4a2c1a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1f6b46'; g.fillRect(4, 4, w - 8, h - 8);
    g.strokeStyle = 'rgba(240,230,190,0.5)'; g.lineWidth = 1; g.strokeRect(9.5, 9.5, w - 19, h - 19);
    g.fillStyle = '#d8d2c0'; g.fillRect(20, 28, 6, 8); g.fillRect(28, 28, 6, 8);
    g.fillStyle = '#c0392b'; g.fillRect(44, 40, 4, 4); g.fillStyle = '#e8b34a'; g.fillRect(40, 44, 4, 4);
    grain(g, w, h, r, 10);
  });
  T.tableSide = tex(64, 64, 93, (g, w, h, r) => {
    g.fillStyle = '#3d2416'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a3620'; g.fillRect(0, 0, w, 8);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 8, w, 2); g.fillRect(0, 0, 1, h); g.fillRect(32, 10, 1, h);
    g.fillStyle = '#a8843a'; g.fillRect(0, h - 4, w, 2);
    grain(g, w, h, r, 14);
  });
  T.slot = tex(64, 128, 94, (g, w, h, r) => {
    g.fillStyle = '#1c1a22'; g.fillRect(0, 0, w, h);
    for (const x of [2, 34]) {
      g.fillStyle = '#34303c'; g.fillRect(x, 30, 28, 94);
      g.fillStyle = '#c0392b'; g.fillRect(x + 2, 32, 24, 10);
      g.fillStyle = '#ffd86a'; g.fillRect(x + 5, 35, 18, 3);
      g.fillStyle = '#e8ecef'; g.fillRect(x + 3, 48, 22, 18);
      g.fillStyle = '#c0392b'; g.fillRect(x + 5, 53, 5, 8);
      g.fillStyle = '#2c7be0'; g.fillRect(x + 12, 53, 5, 8);
      g.fillStyle = '#e8b34a'; g.fillRect(x + 19, 53, 5, 8);
      g.fillStyle = '#8d8798'; g.fillRect(x + 4, 74, 20, 6);
      g.fillStyle = '#3be08a'; g.fillRect(x + 6, 88, 4, 3); g.fillRect(x + 14, 88, 4, 3);
    }
    grain(g, w, h, r, 10);
  });

  // Laboratory
  T.lab = tex(64, 128, 95, (g, w, h, r) => {
    wallBase(g, w, h, '#b9c2c4', '#8f9a9d', 34, '#2f7f95');
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 3, 1, h); g.fillRect(32, 3, 1, h);
    grain(g, w, h, r, 8);
  });
  T.clean = tex(64, 128, 96, (g, w, h, r) => {
    g.fillStyle = '#cfd6d4'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 1);
    g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h);
    g.fillStyle = '#e8b34a'; g.fillRect(0, h - 8, w, 3);
    g.fillStyle = '#7d8a8a'; g.fillRect(0, h - 5, w, 5);
    grain(g, w, h, r, 6);
  });
  T.labFloor = tex(64, 64, 97, (g, w, h, r) => {
    g.fillStyle = '#7f8c8c'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h); g.fillRect(0, 32, w, 1);
    stains(g, w, h, r, 4, '#fff');
    grain(g, w, h, r, 8);
  });
  T.bench = tex(64, 64, 98, (g, w, h, r) => {
    g.fillStyle = '#c4cccb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8c9695'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(31, 5, 2, h - 10);
    g.fillStyle = '#5c6665'; g.fillRect(12, 28, 8, 2); g.fillRect(44, 28, 8, 2);
    grain(g, w, h, r, 8);
  });
  T.benchTop = tex(64, 64, 99, (g, w, h, r) => {
    g.fillStyle = '#9aa5a6'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    g.fillStyle = '#2b3336'; g.fillRect(10, 12, 16, 12);
    g.fillStyle = '#58c7b8'; g.fillRect(12, 14, 8, 1); g.fillRect(12, 18, 11, 1);
    g.fillStyle = '#e8ecef'; g.fillRect(38, 34, 14, 18);
    grain(g, w, h, r, 8);
  });
  T.tank = tex(64, 128, 100, (g, w, h, r) => {
    g.fillStyle = '#aab4b5'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7d8889'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = '#10262c'; g.fillRect(8, 18, 48, 62);
    g.fillStyle = '#2fb7c9'; g.fillRect(10, 40, 44, 38);
    g.fillStyle = '#8fe6f0'; g.fillRect(10, 40, 44, 2);
    for (let i = 0; i < 14; i++) g.fillRect(12 + r() * 40, 44 + r() * 32, 1, 1);
    g.fillStyle = '#e8b34a'; g.fillRect(8, 90, 48, 8);
    g.fillStyle = '#15191a'; for (let x = 10; x < 56; x += 10) g.fillRect(x, 90, 5, 8);
    grain(g, w, h, r, 8);
  });

  // Launch site
  T.deck = tex(64, 64, 101, (g, w, h, r) => {
    g.fillStyle = '#3b4146'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#50575d';
    for (let y = 4; y < h; y += 8) for (let x = (y / 8) % 2 ? 6 : 2; x < w; x += 8) g.fillRect(x, y, 4, 1);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    stains(g, w, h, r, 8, '#000');
    grain(g, w, h, r, 16);
  });
  T.launcher = tex(64, 128, 102, (g, w, h, r) => {
    g.fillStyle = '#3d4a44'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d9dcd6'; g.fillRect(14, 6, 36, 96);
    g.fillStyle = '#c0392b'; g.fillRect(14, 6, 36, 12); g.fillRect(14, 60, 36, 4);
    g.fillStyle = '#20262b'; g.fillRect(14, 96, 36, 6); g.fillRect(8, 20, 4, 90); g.fillRect(52, 20, 4, 90);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(30, 18, 1, 78);
    g.save(); g.beginPath(); g.rect(0, h - 12, w, 12); g.clip();
    g.fillStyle = '#15191a'; g.fillRect(0, h - 12, w, 12);
    g.fillStyle = '#e8b34a';
    for (let x = -12; x < w + 12; x += 12) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 6, h); g.lineTo(x + 18, h - 12); g.lineTo(x + 12, h - 12); g.fill(); }
    g.restore();
    grain(g, w, h, r, 12);
  });

  // Estate
  T.lawn = tex(64, 64, 103, (g, w, h, r) => {
    g.fillStyle = '#22361f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) {
      const v = 0.7 + r() * 0.7;
      g.fillStyle = `rgb(${(34 * v) | 0},${(66 * v) | 0},${(32 * v) | 0})`;
      g.fillRect(r() * w, r() * h, 1, 1 + r() * 3);
    }
    stains(g, w, h, r, 6, '#000');
    grain(g, w, h, r, 14);
  });
  T.hedge = tex(64, 64, 104, (g, w, h, r) => {
    g.fillStyle = '#16301a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      const v = 0.6 + r() * 0.9;
      g.fillStyle = `rgb(${(26 * v) | 0},${(70 * v) | 0},${(34 * v) | 0})`;
      g.fillRect(r() * w, r() * h, 2 + r() * 2, 2 + r() * 2);
    }
    grain(g, w, h, r, 18);
  });
  T.stucco = tex(64, 128, 105, (g, w, h, r) => {
    g.fillStyle = '#b8a88a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8c7c62'; g.fillRect(0, h - 18, w, 18);
    g.fillStyle = '#d2c4a6'; g.fillRect(0, 0, w, 5);
    stains(g, w, h, r, 12, '#3c2f1c');
    g.fillStyle = '#2f4a2c';
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.5; g.fillRect(r() * w, h - 30 + r() * 28, 2 + r() * 3, 2 + r() * 3); }
    g.globalAlpha = 1;
    grain(g, w, h, r, 16);
  });
  T.terracotta = tex(64, 64, 106, (g, w, h, r) => {
    g.fillStyle = '#4a2a1c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
      const v = 0.85 + r() * 0.3;
      g.fillStyle = `rgb(${(150 * v) | 0},${(82 * v) | 0},${(54 * v) | 0})`;
      g.fillRect(x + 1, y + 1, 14, 14);
    }
    stains(g, w, h, r, 6, '#000');
    grain(g, w, h, r, 14);
  });
  T.books = tex(64, 128, 107, (g, w, h, r) => {
    g.fillStyle = '#2c1c12'; g.fillRect(0, 0, w, h);
    const cols = ['#6e2a24', '#2a4a5c', '#3c5a34', '#8a6a2c', '#4a3a5c', '#7a5a44'];
    for (let y = 4; y < h - 6; y += 24) {
      for (let x = 3; x < w - 3;) {
        const bw = 3 + ((r() * 4) | 0), bh = 15 + ((r() * 5) | 0);
        g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x, y + 20 - bh, bw, bh);
        g.fillStyle = 'rgba(255,220,150,0.35)'; g.fillRect(x, y + 24 - bh, bw, 1);
        x += bw + 1;
      }
      g.fillStyle = '#4a3020'; g.fillRect(0, y + 20, w, 3);
    }
    grain(g, w, h, r, 10);
  });

  // Small effect sprites
  T.hole = tex(16, 16, 51, (g, w, h) => {
    const gr = g.createRadialGradient(8, 8, 1, 8, 8, 8);
    gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.45, 'rgba(15,15,15,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { clamp: true });

  T.flash = tex(32, 32, 52, (g, w, h) => {
    const gr = g.createRadialGradient(16, 16, 1, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,235,1)'); gr.addColorStop(0.35, 'rgba(255,200,90,0.8)'); gr.addColorStop(1, 'rgba(255,140,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,230,160,0.9)'; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      g.beginPath(); g.moveTo(16 - Math.cos(a) * 15, 16 - Math.sin(a) * 15); g.lineTo(16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15); g.stroke();
    }
  }, { clamp: true, noMip: true });

  const mark = (ch, color) => (g, w, h) => {
    g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText(ch, w / 2, h / 2 + 3);
    g.fillStyle = color; g.fillText(ch, w / 2, h / 2 + 3);
  };
  T.markQuestion = tex(64, 64, 53, mark('?', '#e8b34a'), { clamp: true, noMip: true });
  T.markAlert = tex(64, 64, 54, mark('!', '#ff4a3a'), { clamp: true, noMip: true });

  return T;
}
