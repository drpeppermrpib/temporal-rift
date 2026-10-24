'use strict';
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const W = 960, H = 540;

function load(p) { return PNG.sync.read(fs.readFileSync(p)); }
function blit(dst, src, dx, dy, scale) {
  const dw = Math.round(src.width * scale), dh = Math.round(src.height * scale);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(src.width - 1, (x / scale) | 0);
      const sy = Math.min(src.height - 1, (y / scale) | 0);
      const si = (sy * src.width + sx) << 2;
      const a = src.data[si + 3] / 255;
      if (a < 0.02) continue;
      const X = dx + x - (dw >> 1), Y = dy + y - dh;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const di = (Y * W + X) << 2;
      const ia = 1 - a;
      dst.data[di] = (src.data[si] * a + dst.data[di] * ia) | 0;
      dst.data[di + 1] = (src.data[si + 1] * a + dst.data[di + 1] * ia) | 0;
      dst.data[di + 2] = (src.data[si + 2] * a + dst.data[di + 2] * ia) | 0;
      dst.data[di + 3] = 255;
    }
  }
}

const out = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) << 2;
    const n = ((x * 17 + y * 31) & 7);
    out.data[i] = 42 + n; out.data[i + 1] = 78 + n; out.data[i + 2] = 48 + (n >> 1); out.data[i + 3] = 255;
  }
}

const trees = [
  load(path.join(ROOT, 'assets/world/trees/pine_small.png')),
  load(path.join(ROOT, 'assets/world/trees/pine_med.png')),
  load(path.join(ROOT, 'assets/world/trees/pine_tall.png')),
];
const rocks = [
  load(path.join(ROOT, 'assets/world/rocks/rock_boulder.png')),
  load(path.join(ROOT, 'assets/world/rocks/rock_cluster.png')),
  load(path.join(ROOT, 'assets/world/rocks/rock_slab.png')),
  load(path.join(ROOT, 'assets/world/rocks/rock_mossy.png')),
];

const items = [
  { img: trees[2], x: 160, y: 420, s: 1.15 },
  { img: trees[1], x: 320, y: 390, s: 1.0 },
  { img: trees[0], x: 450, y: 410, s: 0.95 },
  { img: trees[2], x: 780, y: 430, s: 1.05 },
  { img: rocks[0], x: 240, y: 460, s: 0.85 },
  { img: rocks[1], x: 520, y: 455, s: 0.9 },
  { img: rocks[2], x: 640, y: 470, s: 0.8 },
  { img: rocks[3], x: 380, y: 475, s: 0.85 },
  { img: trees[1], x: 600, y: 360, s: 0.9 },
];
items.sort((a, b) => a.y - b.y);
for (const it of items) blit(out, it.img, it.x, it.y, it.s);

const dest = path.join(ROOT, 'world-preview-2.8.7.png');
fs.writeFileSync(dest, PNG.sync.write(out));
console.log('wrote', dest);
