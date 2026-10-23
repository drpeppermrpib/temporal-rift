/**
 * Process Aether Colossus / Rift Titan sheets: mid-grey studio flood-key → crop → pad → 512×512.
 * Gunmetal plates + rift-ochre trim + cyan/violet aether preserved (corner flood only).
 * Syncs sheets to www (no _refs/_raw).
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets', 'colossus');
const RAW_DIR = join(SRC_DIR, '_raw');
const SIZE = 512;
const GREY_DIST = 48;

async function processOne(name) {
  const src = join(SRC_DIR, `${name}.png`);
  const raw = join(RAW_DIR, `${name}.png`);
  mkdirSync(RAW_DIR, { recursive: true });
  if (!existsSync(raw) && existsSync(src)) copyFileSync(src, raw);
  const input = existsSync(raw) ? raw : src;
  if (!existsSync(input)) throw new Error('missing: ' + input);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = data;
  const n = w * h;

  const seed = [px[0], px[1], px[2]];
  const isBg = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a < 16) return true;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const cyanish = b > r + 18 && g > r + 6;
    const violetish = r > g + 10 && b > g + 10 && b > 70;
    const ochreish = r > g + 8 && g > b + 12 && r > 90 && b < 130;
    const darkPlate = mx < 115;
    if (cyanish || violetish || ochreish || darkPlate) return false;
    const dist = Math.abs(r - seed[0]) + Math.abs(g - seed[1]) + Math.abs(b - seed[2]);
    return dist <= GREY_DIST * 3 && (mx - mn) <= 24 && mx >= 140 && mx < 220;
  };

  const alpha = new Uint8Array(n);
  alpha.fill(255);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (alpha[idx] === 0) return;
    if (!isBg(idx * 4)) return;
    alpha[idx] = 0;
    queue.push(idx);
  };
  push(0, 0); push(w - 1, 0); push(0, h - 1); push(w - 1, h - 1);
  push(2, 2); push(w - 3, 2); push(2, h - 3); push(w - 3, h - 3);
  push(Math.floor(w / 2), 0); push(Math.floor(w / 2), h - 1);
  push(0, Math.floor(h / 2)); push(w - 1, Math.floor(h / 2));
  for (let x = 0; x < w; x += 16) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += 16) { push(0, y); push(w - 1, y); }

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
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const srcOff = ((minY + y) * w + minX) * 4;
    out.copy(cropped, y * cw * 4, srcOff, srcOff + cw * 4);
  }

  const scale = Math.min(SIZE / cw, SIZE / ch);
  const nw = Math.max(1, Math.round(cw * scale));
  const nh = Math.max(1, Math.round(ch * scale));
  const left = Math.floor((SIZE - nw) / 2);
  const top = SIZE - nh - 4;

  const resized = await sharp(cropped, { raw: { width: cw, height: ch, channels: 4 } })
    .resize(nw, nh, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(join(SRC_DIR, `${name}.png`));

  const meta = await sharp(join(SRC_DIR, `${name}.png`)).metadata();
  console.log(`${name}: ${meta.width}x${meta.height} hasAlpha=${meta.hasAlpha} bytes=${statSync(join(SRC_DIR, `${name}.png`)).size}`);
}

const GEN = 'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/assets';
mkdirSync(SRC_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });

const frames = [
  ['idle', 'colossus-idle-raw.png'],
  ['walk', 'colossus-walk-raw.png'],
  ['attack', 'colossus-attack-raw.png'],
  ['death', 'colossus-death-raw.png'],
];

for (const [name, file] of frames) {
  const from = join(GEN, file);
  if (!existsSync(from)) throw new Error('missing gen: ' + from);
  copyFileSync(from, join(RAW_DIR, `${name}.png`));
  copyFileSync(join(RAW_DIR, `${name}.png`), join(SRC_DIR, `${name}.png`));
  await processOne(name);
}

const www = join(ROOT, 'www', 'assets', 'colossus');
mkdirSync(www, { recursive: true });
for (const [name] of frames) {
  copyFileSync(join(SRC_DIR, `${name}.png`), join(www, `${name}.png`));
}
console.log('synced to www/assets/colossus (no _refs/_raw)');

for (const [name] of frames) {
  const p = join(SRC_DIR, `${name}.png`);
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let z = 0, t = 0;
  for (let i = 3; i < data.length; i += 4) { t++; if (data[i] < 16) z++; }
  console.log(`${name} transparent%=${((z / t) * 100).toFixed(1)} cornerA=${data[3]} size=${info.width}x${info.height}`);
}
