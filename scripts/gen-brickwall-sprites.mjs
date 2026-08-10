/**
 * Procedural Cloister Wall modular sheets (Ashen/Rift brick + iron picket vibe).
 * Mesh of rustic pyramid-cap / iron-picket / variegated / arch-slat refs — original only.
 * Writes 512×512 transparent PNGs + syncs to www (no _refs).
 */
import sharp from 'sharp';
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'buildings', 'brickwall');
const WWW = join(ROOT, 'www', 'assets', 'buildings', 'brickwall');
const DESK = 'C:\\Users\\drpep\\Desktop\\TemporalRift-BrickWall-Sprites';
const SIZE = 512;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hash(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function brickColor(bx, by, damaged) {
  const t = hash(bx, by);
  const r = Math.round(140 + t * 70 + (damaged ? -18 : 0));
  const g = Math.round(58 + t * 35 + (1 - t) * 12);
  const b = Math.round(42 + t * 22);
  return [clamp(r, 70, 220), clamp(g, 30, 120), clamp(b, 25, 90)];
}
function stoneColor(x, y) {
  const t = hash(x + 3, y + 7);
  const v = 168 + t * 40;
  return [Math.round(v), Math.round(v - 4), Math.round(v - 10)];
}
function setPx(buf, w, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= w || y >= SIZE) return;
  const i = (y * w + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}
function fillRect(buf, w, x0, y0, rw, rh, colFn) {
  for (let y = y0; y < y0 + rh; y++) {
    for (let x = x0; x < x0 + rw; x++) {
      const c = colFn(x, y);
      setPx(buf, w, x, y, c[0], c[1], c[2], c[3] ?? 255);
    }
  }
}

function drawBrickBlock(buf, w, x0, y0, bw, bh, damaged) {
  const BR = 14, BH = 8, MORTAR = [188, 178, 162];
  for (let y = y0; y < y0 + bh; y++) {
    for (let x = x0; x < x0 + bw; x++) {
      const row = Math.floor((y - y0) / BH);
      const odd = row & 1;
      const localX = x - x0 + (odd ? BR / 2 : 0);
      const bx = Math.floor(localX / BR);
      const by = row;
      const inMortar =
        ((x - x0 + (odd ? BR / 2 : 0)) % BR) < 1.2 ||
        ((y - y0) % BH) < 1.1;
      if (damaged && hash(bx, by) > 0.82 && hash(x, y) > 0.55) {
        // missing brick hole
        if (hash(x * 3, y * 5) > 0.4) continue;
        setPx(buf, w, x, y, 55, 42, 36, 200);
        continue;
      }
      if (inMortar) {
        setPx(buf, w, x, y, MORTAR[0], MORTAR[1], MORTAR[2], 255);
      } else {
        const c = brickColor(bx, by, damaged);
        const shade = 0.9 + hash(x, y) * 0.18;
        setPx(buf, w, x, y,
          clamp(Math.round(c[0] * shade), 0, 255),
          clamp(Math.round(c[1] * shade), 0, 255),
          clamp(Math.round(c[2] * shade), 0, 255));
      }
    }
  }
}

function drawPyramidCap(buf, w, cx, topY, half, damaged) {
  const h = Math.round(half * 0.95);
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const hw = Math.max(1, Math.round(half * (1 - t)));
    for (let x = -hw; x <= hw; x++) {
      const c = stoneColor(cx + x, topY + y);
      const dark = 1 - t * 0.25 - (Math.abs(x) / (hw + 1)) * 0.12;
      if (damaged && t > 0.55 && hash(cx + x, topY + y) > 0.7) continue;
      setPx(buf, w, cx + x, topY + y,
        clamp(Math.round(c[0] * dark), 0, 255),
        clamp(Math.round(c[1] * dark), 0, 255),
        clamp(Math.round(c[2] * dark), 0, 255));
    }
  }
  // flat overhang base
  fillRect(buf, w, cx - half - 4, topY + h - 2, half * 2 + 8, 8, (x, y) => {
    const c = stoneColor(x, y);
    return [c[0], c[1], c[2], 255];
  });
}

function drawIronPicket(buf, w, x, y0, h, damaged) {
  if (damaged && hash(x, y0) > 0.78) return; // missing picket
  const iron = [28, 26, 32];
  for (let y = y0; y < y0 + h; y++) {
    setPx(buf, w, x, y, iron[0], iron[1], iron[2]);
    setPx(buf, w, x + 1, y, iron[0] + 8, iron[1] + 6, iron[2] + 10);
  }
  // spear tip
  for (let i = 0; i < 6; i++) {
    const tw = Math.max(0, 3 - Math.floor(i / 2));
    for (let dx = -tw; dx <= tw; dx++) {
      setPx(buf, w, x + dx, y0 - 1 - i, 36, 34, 40);
    }
  }
}

function makeTransparent() {
  return Buffer.alloc(SIZE * SIZE * 4);
}

async function writePng(name, buf) {
  const path = join(OUT, `${name}.png`);
  await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path);
  return path;
}

async function genPillar(damaged) {
  const buf = makeTransparent();
  const cx = 256, foot = 500;
  const pw = 78, ph = 220;
  const px0 = cx - pw / 2, py0 = foot - ph;
  drawBrickBlock(buf, SIZE, px0, py0, pw, ph, damaged);
  // stone cap slab
  fillRect(buf, SIZE, px0 - 10, py0 - 14, pw + 20, 16, (x, y) => {
    const c = stoneColor(x, y);
    return [c[0], c[1], c[2], 255];
  });
  drawPyramidCap(buf, SIZE, cx, py0 - 52, 36, damaged);
  // ground shadow hint
  fillRect(buf, SIZE, cx - 40, foot - 6, 80, 8, () => [20, 16, 12, 70]);
  return writePng(damaged ? 'pillar-damaged' : 'pillar', buf);
}

async function genSegment(damaged) {
  const buf = makeTransparent();
  const foot = 500;
  const wallH = 110, wallW = 340;
  const x0 = (SIZE - wallW) / 2, y0 = foot - wallH - 70;
  drawBrickBlock(buf, SIZE, x0, y0, wallW, wallH, damaged);
  // stone coping
  fillRect(buf, SIZE, x0 - 4, y0 - 10, wallW + 8, 12, (x, y) => {
    const c = stoneColor(x, y);
    return [c[0], c[1], c[2], 255];
  });
  // iron pickets
  const picketTop = y0 - 10 - 78;
  for (let i = 0; i < 11; i++) {
    const px = Math.round(x0 + 18 + i * ((wallW - 36) / 10));
    drawIronPicket(buf, SIZE, px, picketTop + 8, 78, damaged);
  }
  // top rail
  fillRect(buf, SIZE, x0 + 12, picketTop + 10, wallW - 24, 4, () => [32, 30, 36, 255]);
  fillRect(buf, SIZE, x0 + 12, picketTop + 48, wallW - 24, 3, () => [32, 30, 36, 255]);
  // small pyramid caps along coping (rustic ref vibe)
  for (let i = 0; i < 5; i++) {
    const cx = Math.round(x0 + 30 + i * ((wallW - 60) / 4));
    drawPyramidCap(buf, SIZE, cx, y0 - 28, 10, damaged);
  }
  fillRect(buf, SIZE, x0 + 20, foot - 6, wallW - 40, 6, () => [20, 16, 12, 55]);
  return writePng(damaged ? 'segment-damaged' : 'segment', buf);
}

async function genCorner(damaged) {
  // L-shaped wall massing for preview / optional draw
  const buf = makeTransparent();
  const foot = 500;
  // pillar at corner
  const cx = 256, cy = foot - 160;
  drawBrickBlock(buf, SIZE, cx - 36, cy, 72, 160, damaged);
  fillRect(buf, SIZE, cx - 44, cy - 12, 88, 14, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  drawPyramidCap(buf, SIZE, cx, cy - 48, 32, damaged);
  // east stub
  drawBrickBlock(buf, SIZE, cx + 36, foot - 100, 140, 100, damaged);
  fillRect(buf, SIZE, cx + 32, foot - 110, 148, 12, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  for (let i = 0; i < 5; i++) {
    drawIronPicket(buf, SIZE, cx + 50 + i * 24, foot - 100 - 70, 70, damaged);
  }
  // south stub (drawn as downward-ish mass — top-down friendly side stub)
  drawBrickBlock(buf, SIZE, cx - 36, foot - 60, 72, 50, damaged);
  // north-west visual stub via short left arm
  drawBrickBlock(buf, SIZE, cx - 160, foot - 100, 124, 100, damaged);
  fillRect(buf, SIZE, cx - 164, foot - 110, 132, 12, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  for (let i = 0; i < 4; i++) {
    drawIronPicket(buf, SIZE, cx - 150 + i * 26, foot - 100 - 70, 70, damaged);
  }
  return writePng(damaged ? 'corner-damaged' : 'corner', buf);
}

async function genTee(damaged) {
  const buf = makeTransparent();
  const foot = 500;
  const cx = 256;
  drawBrickBlock(buf, SIZE, cx - 36, foot - 220, 72, 220, damaged);
  fillRect(buf, SIZE, cx - 44, foot - 232, 88, 14, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  drawPyramidCap(buf, SIZE, cx, foot - 268, 32, damaged);
  // three arms: W E S
  drawBrickBlock(buf, SIZE, cx - 190, foot - 110, 154, 100, damaged);
  drawBrickBlock(buf, SIZE, cx + 36, foot - 110, 154, 100, damaged);
  drawBrickBlock(buf, SIZE, cx - 36, foot - 60, 72, 50, damaged);
  fillRect(buf, SIZE, cx - 194, foot - 120, 162, 12, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  fillRect(buf, SIZE, cx + 32, foot - 120, 162, 12, (x, y) => {
    const c = stoneColor(x, y); return [c[0], c[1], c[2], 255];
  });
  for (let i = 0; i < 5; i++) {
    drawIronPicket(buf, SIZE, cx - 175 + i * 28, foot - 110 - 70, 70, damaged);
    drawIronPicket(buf, SIZE, cx + 50 + i * 28, foot - 110 - 70, 70, damaged);
  }
  return writePng(damaged ? 'tee-damaged' : 'tee', buf);
}

async function checkerPreview(names) {
  const tiles = [];
  for (const name of names) {
    const img = await sharp(join(OUT, `${name}.png`))
      .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    tiles.push(img);
  }
  const checker = Buffer.alloc(512 * 512 * 4);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const on = ((x >> 4) & 1) ^ ((y >> 4) & 1);
      const v = on ? 210 : 170;
      const i = (y * 512 + x) * 4;
      checker[i] = v; checker[i + 1] = v; checker[i + 2] = v; checker[i + 3] = 255;
    }
  }
  const base = await sharp(checker, { raw: { width: 512, height: 512, channels: 4 } }).png().toBuffer();
  // 2x2 grid of first 4
  const comps = [
    { input: tiles[0], left: 8, top: 8 },
    { input: tiles[1], left: 264, top: 8 },
    { input: tiles[2], left: 8, top: 264 },
    { input: tiles[3], left: 264, top: 264 },
  ];
  await sharp(base).composite(comps).png().toFile(join(DESK, 'preview-modular.png'));
}

mkdirSync(OUT, { recursive: true });
mkdirSync(WWW, { recursive: true });
mkdirSync(DESK, { recursive: true });

await genPillar(false);
await genPillar(true);
await genSegment(false);
await genSegment(true);
await genCorner(false);
await genCorner(true);
await genTee(false);
await genTee(true);

const files = [
  'pillar', 'pillar-damaged', 'segment', 'segment-damaged',
  'corner', 'corner-damaged', 'tee', 'tee-damaged',
];
for (const f of files) {
  copyFileSync(join(OUT, `${f}.png`), join(WWW, `${f}.png`));
  copyFileSync(join(OUT, `${f}.png`), join(DESK, `${f}.png`));
}
await checkerPreview(['pillar', 'segment', 'corner', 'tee']);
copyFileSync(join(DESK, 'preview-modular.png'), join(OUT, 'preview-modular.png'));

writeFileSync(join(DESK, 'README.txt'),
`Temporal Rift — Cloister Wall (brick stronghold) modular sprites
Original Ashen/Rift mesh of rustic brick + iron picket refs (no product branding).

Files:
  pillar.png / pillar-damaged.png — connector post
  segment.png / segment-damaged.png — wall between pillars
  corner.png / tee.png (+ damaged) — optional junction sheets
  preview-modular.png — checker review

Gameplay systems ON (BRICKWALL_ENABLED); store ship deferred with Continuity/art batch.
`);

console.log('brickwall sprites written to', OUT);
console.log('synced www + Desktop', DESK);
