/**
 * World tree variety — Continuity remesh pipeline (same house path as unit art):
 *   GenerateImage original sheets (refs inspiration only) → flood-key → 512 → www.
 * Classic TR pines kept native aspect (drawH locks). Photo-stock isolates retired.
 *
 * Sources: assets/world/trees/_raw/{name}_gen.png
 * Ship:    assets/world/trees/{name}.png + www sync (no _refs / _raw / _probe)
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TREE_DIR = join(ROOT, 'assets', 'world', 'trees');
const RAW = join(TREE_DIR, '_raw');
const SIZE = 512;
const LIGHT_MIN = 210;
const CHROMA_MAX = 28;
const GREY_DIST = 42;
const BLACK_MAX = 28;

mkdirSync(RAW, { recursive: true });
mkdirSync(TREE_DIR, { recursive: true });

const VARIANT_SHEETS = [
  'tree_single_broad',
  'tree_single_short',
  'tree_single_slender',
  'tree_single_leafy',
  'tree_single_fir',
  'tree_few_pair',
  'tree_few_grove',
  'tree_few_classic',
  'tree_few_mix',
  'tree_bunch_spruce',
  'tree_bunch_mix',
];

const SHIP = [
  'pine_small', 'pine_med', 'pine_tall',
  ...VARIANT_SHEETS,
];

function isBg(r, g, b, a, seed) {
  if (a < 16) return true;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  // light / near-white studio
  if (mx >= LIGHT_MIN && (mx - mn) <= CHROMA_MAX) return true;
  // near-black studio (legacy)
  if (r <= BLACK_MAX && g <= BLACK_MAX && b <= BLACK_MAX) return true;
  // mid-grey studio (GenerateImage common)
  const dist = Math.abs(r - seed[0]) + Math.abs(g - seed[1]) + Math.abs(b - seed[2]);
  return dist <= GREY_DIST * 3 && (mx - mn) <= 30 && mx < 190 && mx > 40;
}

async function processGen(name) {
  const gen = join(RAW, `${name}_gen.png`);
  if (!existsSync(gen)) throw new Error('missing gen sheet: ' + gen);

  const { data, info } = await sharp(gen).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = data;
  const n = w * h;
  const seed = [px[0], px[1], px[2]];

  const alpha = new Uint8Array(n);
  alpha.fill(255);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (alpha[idx] === 0) return;
    const i = idx * 4;
    if (!isBg(px[i], px[i + 1], px[i + 2], px[i + 3], seed)) return;
    alpha[idx] = 0;
    queue.push(idx);
  };
  // dense border seeds (light / grey / black studio)
  for (let x = 0; x < w; x += 4) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += 4) { push(0, y); push(w - 1, y); }
  push(0, 0); push(w - 1, 0); push(0, h - 1); push(w - 1, h - 1);
  push(Math.floor(w / 2), 0); push(Math.floor(w / 2), h - 1);

  for (let qi = 0; qi < queue.length; qi++) {
    const idx = queue[qi];
    const x = idx % w, y = (idx / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  const out = Buffer.alloc(n * 4);
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const i = idx * 4;
      out[i] = px[i]; out[i + 1] = px[i + 1]; out[i + 2] = px[i + 2];
      let a = alpha[idx];
      if (px[i + 3] < 16) a = 0;
      // fringe soften near keyed bg
      if (a === 255) {
        let touch = false;
        if (x > 0 && alpha[idx - 1] === 0) touch = true;
        if (x < w - 1 && alpha[idx + 1] === 0) touch = true;
        if (y > 0 && alpha[idx - w] === 0) touch = true;
        if (y < h - 1 && alpha[idx + w] === 0) touch = true;
        if (touch) {
          const mx = Math.max(px[i], px[i + 1], px[i + 2]);
          const mn = Math.min(px[i], px[i + 1], px[i + 2]);
          if (mx >= LIGHT_MIN - 25 && (mx - mn) <= CHROMA_MAX + 8) a = Math.round(255 * ((255 - mx) / 45));
          else if (mx <= 45 && (mx - mn) <= 20) a = Math.round(255 * (mx / 45));
        }
      }
      out[i + 3] = a;
      if (a > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) throw new Error('empty after key: ' + name);

  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const srcOff = ((minY + y) * w + minX) * 4;
    out.copy(cropped, y * cw * 4, srcOff, srcOff + cw * 4);
  }

  const bottomPad = 8;
  const scale = Math.min(SIZE / cw, (SIZE - bottomPad) / ch);
  const nw = Math.max(1, Math.round(cw * scale));
  const nh = Math.max(1, Math.round(ch * scale));
  const left = Math.floor((SIZE - nw) / 2);
  const top = SIZE - nh - bottomPad;
  const resized = await sharp(cropped, { raw: { width: cw, height: ch, channels: 4 } })
    .resize(nw, nh, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  const outPath = join(TREE_DIR, `${name}.png`);
  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  // keep processed ship copy under _raw for audit (gen stays as *_gen.png)
  copyFileSync(outPath, join(RAW, `${name}.png`));
  const meta = await sharp(outPath).metadata();
  console.log(`  ${name}.png: ${meta.width}x${meta.height} bytes=${statSync(outPath).size}`);
  return outPath;
}

console.log('=== classic TR pines (leave native size) ===');
for (const n of ['pine_small', 'pine_med', 'pine_tall']) {
  const src = join(TREE_DIR, `${n}.png`);
  if (!existsSync(src)) throw new Error('missing ' + n);
  const bak = join(RAW, `${n}_orig.png`);
  if (!existsSync(bak)) copyFileSync(src, bak);
  console.log(`  keep ${n}.png`);
}

console.log('=== meshed GenerateImage variants (flood-key → 512) ===');
for (const name of VARIANT_SHEETS) {
  await processGen(name);
}

const www = join(ROOT, 'www', 'assets', 'world', 'trees');
mkdirSync(www, { recursive: true });
for (const name of SHIP) {
  const src = join(TREE_DIR, `${name}.png`);
  if (!existsSync(src)) throw new Error('missing ship sheet: ' + name);
  copyFileSync(src, join(www, `${name}.png`));
}
console.log(`synced ${SHIP.length} sheets → www/assets/world/trees (no _refs/_raw/_probe)`);

for (const name of SHIP) {
  const p = join(TREE_DIR, `${name}.png`);
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let z = 0, t = 0;
  for (let i = 3; i < data.length; i += 4) { t++; if (data[i] < 16) z++; }
  console.log(`${name} transparent%=${((z / t) * 100).toFixed(1)} cornerA=${data[3]} ${info.width}x${info.height}`);
}

writeFileSync(join(TREE_DIR, 'tree-variants.json'), JSON.stringify({
  generated: new Date().toISOString(),
  pipeline: 'GenerateImage remesh + flood-key (refs inspiration only)',
  ship: SHIP,
  roles: {
    one: ['pine_small', 'pine_med', 'pine_tall', 'tree_single_broad', 'tree_single_short', 'tree_single_slender', 'tree_single_leafy', 'tree_single_fir'],
    few: ['tree_few_pair', 'tree_few_grove', 'tree_few_classic', 'tree_few_mix'],
    bunch: ['tree_bunch_spruce', 'tree_bunch_mix'],
  },
}, null, 2));
console.log('wrote tree-variants.json');
