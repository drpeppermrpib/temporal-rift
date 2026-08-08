import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'assets', 'gharok');
const RAW_DIR = join(SRC_DIR, '_raw');
const SIZE = 512;

async function processOne(name) {
  const src = join(SRC_DIR, `${name}.png`);
  const raw = join(RAW_DIR, `${name}.png`);
  mkdirSync(RAW_DIR, { recursive: true });
  if (!existsSync(raw)) copyFileSync(src, raw);

  const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = data;

  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  };
  const samples = [sample(2, 2), sample(w - 3, 2), sample(2, h - 3), sample(w - 3, h - 3),
    sample(10, 10), sample(w - 11, 10)];
  const br = Math.round(samples.reduce((a, s) => a + s[0], 0) / samples.length);
  const bg = Math.round(samples.reduce((a, s) => a + s[1], 0) / samples.length);
  const bb = Math.round(samples.reduce((a, s) => a + s[2], 0) / samples.length);

  const out = Buffer.alloc(w * h * 4);
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const dr = r - br, dg = g - bg, db = b - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const isLightNeutral = mx >= 230 && (mx - mn) <= 18;
      const isSoftBg = mx >= 210 && (mx - mn) <= 12 && dist < 40;
      let a;
      if (dist < 22 || isLightNeutral || isSoftBg) a = 0;
      else if (dist < 45) a = Math.round(255 * (dist - 22) / 23);
      else a = 255;
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
      if (a > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) throw new Error('empty after key: ' + name);

  const pad = 8;
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

mkdirSync(join(ROOT, 'www', 'assets', 'gharok'), { recursive: true });
for (const name of ['idle', 'windup', 'walk']) {
  await processOne(name);
  copyFileSync(join(SRC_DIR, `${name}.png`), join(ROOT, 'www', 'assets', 'gharok', `${name}.png`));
}
console.log('synced to www/assets/gharok');
