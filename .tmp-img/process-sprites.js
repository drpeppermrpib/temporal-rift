'use strict';
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const RAW = 'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/assets';
const OUT = 'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/assets/world';

const jobs = [
  { src: 'pine_tall_raw.png', dst: 'trees/pine_tall.png', maxH: 220 },
  { src: 'pine_med_raw.png', dst: 'trees/pine_med.png', maxH: 180 },
  { src: 'pine_small_raw.png', dst: 'trees/pine_small.png', maxH: 140 },
  { src: 'rock_boulder_raw.png', dst: 'rocks/rock_boulder.png', maxH: 140 },
  { src: 'rock_cluster_raw.png', dst: 'rocks/rock_cluster.png', maxH: 140 },
  { src: 'rock_slab_raw.png', dst: 'rocks/rock_slab.png', maxH: 110 },
  { src: 'rock_mossy_raw.png', dst: 'rocks/rock_mossy.png', maxH: 140 },
];

function idx(x, y, w) { return (y * w + x) << 2; }

function resize(src, nw, nh) {
  const out = new PNG({ width: nw, height: nh });
  const tw = src.width, th = src.height, data = src.data;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(tw - 1, (x + 0.5) * tw / nw - 0.5);
      const sy = Math.min(th - 1, (y + 0.5) * th / nh - 0.5);
      const x0 = sx | 0, y0 = sy | 0;
      const x1 = Math.min(tw - 1, x0 + 1), y1 = Math.min(th - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      const s = (xx, yy) => {
        const i = idx(xx, yy, tw);
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
      };
      const c00 = s(x0, y0), c10 = s(x1, y0), c01 = s(x0, y1), c11 = s(x1, y1);
      const mix4 = (a, b, c, d) => {
        const top = a + (b - a) * fx, bot = c + (d - c) * fx;
        return top + (bot - top) * fy;
      };
      const di = idx(x, y, nw);
      out.data[di] = mix4(c00[0], c10[0], c01[0], c11[0]) | 0;
      out.data[di + 1] = mix4(c00[1], c10[1], c01[1], c11[1]) | 0;
      out.data[di + 2] = mix4(c00[2], c10[2], c01[2], c11[2]) | 0;
      out.data[di + 3] = mix4(c00[3], c10[3], c01[3], c11[3]) | 0;
    }
  }
  return out;
}

function processOne(job) {
  const t0 = Date.now();
  const png = PNG.sync.read(fs.readFileSync(path.join(RAW, job.src)));
  // Downscale first for speed, then chroma
  const preScale = Math.min(1, (job.maxH * 2) / png.height);
  const pw = Math.max(1, Math.round(png.width * preScale));
  const ph = Math.max(1, Math.round(png.height * preScale));
  let img = preScale < 0.999 ? resize(png, pw, ph) : png;
  const { width: w, height: h, data } = img;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.min(r, g, b);
    const uni = Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && Math.abs(r - b) < 16;
    if (m >= 248 && uni) data[i + 3] = 0;
    else if (m >= 228 && uni) data[i + 3] = Math.min(data[i + 3], ((248 - m) / 20 * 255) | 0);
  }

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(x, y, w) + 3] > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('no opaque pixels: ' + job.src);

  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const cropped = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const si = idx(minX + x, minY + y, w);
      const di = idx(x, y, tw);
      cropped.data[di] = data[si];
      cropped.data[di + 1] = data[si + 1];
      cropped.data[di + 2] = data[si + 2];
      cropped.data[di + 3] = data[si + 3];
    }
  }

  const scale = Math.min(1, job.maxH / th);
  const nw = Math.max(1, Math.round(tw * scale));
  const nh = Math.max(1, Math.round(th * scale));
  const out = (nw === tw && nh === th) ? cropped : resize(cropped, nw, nh);

  const dstPath = path.join(OUT, job.dst);
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, PNG.sync.write(out));
  console.log('OK', job.dst, `${nw}x${nh}`, `${Date.now() - t0}ms`);
}

for (const job of jobs) processOne(job);
console.log('done');
