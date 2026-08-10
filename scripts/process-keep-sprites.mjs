/**
 * Process Rift Keep building sheets: light-bg flood-key → crop → pad → 512×512.
 * Feet biased to bottom for ground anchor. Syncs to www (no _refs/_raw).
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets', 'buildings', 'keep');
const RAW_DIR = join(SRC_DIR, '_raw');
const SIZE = 512;
const LIGHT_MIN = 215; // near-white / soft studio grey
const CHROMA_MAX = 18; // low chroma = bg (stone has more variance)

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
  const isBg = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a < 16) return true;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return mx >= LIGHT_MIN && (mx - mn) <= CHROMA_MAX;
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
  // extra edge seeds for soft vignette
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
      // soft edge: light pixels touching keyed bg fade
      if (a === 255) {
        let touch = false;
        if (x > 0 && alpha[idx - 1] === 0) touch = true;
        if (x < w - 1 && alpha[idx + 1] === 0) touch = true;
        if (y > 0 && alpha[idx - w] === 0) touch = true;
        if (y < h - 1 && alpha[idx + w] === 0) touch = true;
        if (touch) {
          const mx = Math.max(px[i], px[i + 1], px[i + 2]);
          const mn = Math.min(px[i], px[i + 1], px[i + 2]);
          if (mx >= 190 && (mx - mn) <= 28) {
            a = Math.round(255 * Math.max(0, (245 - mx) / 55));
          }
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

for (const name of ['idle', 'damaged']) {
  await processOne(name);
}

const www = join(ROOT, 'www', 'assets', 'buildings', 'keep');
mkdirSync(www, { recursive: true });
for (const name of ['idle', 'damaged']) {
  copyFileSync(join(SRC_DIR, `${name}.png`), join(www, `${name}.png`));
}
console.log('synced to www/assets/buildings/keep (no _refs/_raw)');

// transparency report
for (const name of ['idle', 'damaged']) {
  const p = join(SRC_DIR, `${name}.png`);
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let z = 0, t = 0;
  for (let i = 3; i < data.length; i += 4) { t++; if (data[i] < 16) z++; }
  const c0 = data[3];
  console.log(`${name} transparent%=${((z / t) * 100).toFixed(1)} cornerA=${c0}`);
}
