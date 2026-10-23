/**
 * Process multi-dir walk sheets (walk-side / walk-back): mid-grey #B8B8B8 flood-key
 * → crop → pad → 512×512 transparent. Syncs to www (no _refs/_raw).
 *
 * Usage: node scripts/process-multidir-sprites.mjs
 * Expects gen files in Cursor projects assets/: {unit}-walk-side.png / {unit}-walk-back.png
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = 'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/assets';
const SIZE = 512;
const GREY_TARGET = [184, 184, 184]; // #B8B8B8
const GREY_DIST = 52;

const UNITS = [
  { id: 'zombie', rel: ['zombie'], files: ['walk-side', 'walk-back'] },
  { id: 'skeleton', rel: ['skeleton'], files: ['walk-side', 'walk-back'] },
  { id: 'bulwark', rel: ['bulwark'], files: ['walk-side', 'walk-back'] },
  { id: 'shaman', rel: ['shaman'], files: ['walk-side', 'walk-back'] },
  { id: 'ravager', rel: ['ravager'], files: ['walk-side', 'walk-back'] },
  { id: 'gharok', rel: ['gharok'], files: ['walk-side', 'walk-back'] },
  { id: 'rover', rel: ['allies', 'rover'], files: ['walk-side', 'walk-back'] },
  { id: 'warden', rel: ['allies', 'warden'], files: ['walk-side', 'walk-back'] },
  { id: 'scout', rel: ['allies', 'scout'], files: ['walk-side', 'walk-back'] },
  { id: 'sentinel', rel: ['allies', 'sentinel'], files: ['walk-side', 'walk-back'] },
  { id: 'laborer', rel: ['allies', 'laborer'], files: ['walk-side', 'walk-back'] },
  { id: 'colossus', rel: ['colossus'], files: ['walk-side', 'walk-back'] },
];

async function processOne(srcDir, name) {
  const src = join(srcDir, `${name}.png`);
  const rawDir = join(srcDir, '_raw');
  const raw = join(rawDir, `${name}.png`);
  mkdirSync(rawDir, { recursive: true });
  if (!existsSync(raw) && existsSync(src)) copyFileSync(src, raw);
  const input = existsSync(raw) ? raw : src;
  if (!existsSync(input)) throw new Error('missing: ' + input);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = data;
  const n = w * h;
  const seed = [px[0], px[1], px[2]];
  // Prefer corner seed if near grey studio; else #B8B8B8
  const seedDist =
    Math.abs(seed[0] - GREY_TARGET[0]) +
    Math.abs(seed[1] - GREY_TARGET[1]) +
    Math.abs(seed[2] - GREY_TARGET[2]);
  const ref = seedDist <= 90 ? seed : GREY_TARGET;

  const isBg = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a < 16) return true;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const dist = Math.abs(r - ref[0]) + Math.abs(g - ref[1]) + Math.abs(b - ref[2]);
    // mid-grey studio: low chroma, near seed / #B8B8B8
    return dist <= GREY_DIST * 3 && (mx - mn) <= 32 && mx > 120 && mx < 230;
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
  for (let x = 0; x < w; x += 12) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += 12) { push(0, y); push(w - 1, y); }

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
      if (a === 255) {
        let touch = false;
        if (x > 0 && alpha[idx - 1] === 0) touch = true;
        if (x < w - 1 && alpha[idx + 1] === 0) touch = true;
        if (y > 0 && alpha[idx - w] === 0) touch = true;
        if (y < h - 1 && alpha[idx + w] === 0) touch = true;
        if (touch) {
          const mx = Math.max(px[i], px[i + 1], px[i + 2]);
          const mn = Math.min(px[i], px[i + 1], px[i + 2]);
          const dist = Math.abs(px[i] - ref[0]) + Math.abs(px[i + 1] - ref[1]) + Math.abs(px[i + 2] - ref[2]);
          if (dist <= GREY_DIST * 4 && (mx - mn) <= 36 && mx > 130) {
            a = Math.round(255 * Math.max(0, Math.min(1, (dist - GREY_DIST) / (GREY_DIST * 2))));
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
  if (maxX < minX) throw new Error('empty after key: ' + name + ' @ ' + srcDir);

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
    .toFile(join(srcDir, `${name}.png`));

  const meta = await sharp(join(srcDir, `${name}.png`)).metadata();
  console.log(`${srcDir.split(/[/\\]/).slice(-2).join('/')}/${name}: ${meta.width}x${meta.height} bytes=${statSync(join(srcDir, `${name}.png`)).size}`);
}

const only = process.argv[2];
for (const u of UNITS) {
  if (only && u.id !== only) continue;
  const srcDir = join(ROOT, 'assets', ...u.rel);
  const wwwDir = join(ROOT, 'www', 'assets', ...u.rel);
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(wwwDir, { recursive: true });
  for (const name of u.files) {
    const genName = `${u.id}-${name}.png`;
    const from = join(GEN, genName);
    if (!existsSync(from)) throw new Error('missing gen: ' + from);
    const rawDir = join(srcDir, '_raw');
    mkdirSync(rawDir, { recursive: true });
    copyFileSync(from, join(rawDir, `${name}.png`));
    copyFileSync(join(rawDir, `${name}.png`), join(srcDir, `${name}.png`));
    await processOne(srcDir, name);
    copyFileSync(join(srcDir, `${name}.png`), join(wwwDir, `${name}.png`));
  }
  console.log(`synced www/assets/${u.rel.join('/')}`);
}

console.log('multi-dir walk sheets processed + www synced');
