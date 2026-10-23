#!/usr/bin/env node
/**
 * Generate original Temporal Rift SFX WAVs (procedural — no copyrighted samples).
 * Output: assets/audio/*.wav (+ www/assets/audio on sync)
 * User overrides: assets/audio/drop/ (see docs/audio-drop-in-guide.md)
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'assets', 'audio');
const SR = 22050;

function writeWav(name, samples) {
  mkdirSync(outDir, { recursive: true });
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((v * 32767) | 0, 44 + i * 2);
  }
  const path = join(outDir, name);
  writeFileSync(path, buf);
  console.log('wrote', path, `(${(n / SR).toFixed(2)}s)`);
}

function env(t, a, d, s, r, len) {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < len - r) return s;
  return s * Math.max(0, 1 - (t - (len - r)) / r);
}

function noise() { return Math.random() * 2 - 1; }

function mix(buf, fn) {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = fn(i / SR, i);
  return out;
}

function addTone(out, freqFn, gainFn, type = 'sine') {
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = freqFn(t);
    phase += (2 * Math.PI * f) / SR;
    let s;
    if (type === 'saw') s = 2 * (phase / (2 * Math.PI) % 1) - 1;
    else if (type === 'tri') s = 2 * Math.abs(2 * (phase / (2 * Math.PI) % 1) - 1) - 1;
    else if (type === 'square') s = Math.sin(phase) >= 0 ? 1 : -1;
    else s = Math.sin(phase);
    out[i] += s * gainFn(t);
  }
}

function addNoise(out, gainFn, hp = 0) {
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let n = noise() * gainFn(t);
    if (hp > 0) { n = n - prev * hp; prev = n; }
    out[i] += n;
  }
}

// --- death: wet rift collapse + bone rattle tail ---
{
  const len = 0.42;
  const n = (len * SR) | 0;
  const out = new Float32Array(n);
  addTone(out, t => 180 * Math.exp(-t * 6), t => 0.22 * env(t, 0.01, 0.08, 0.4, 0.18, len), 'saw');
  addTone(out, t => 55 * Math.exp(-t * 4), t => 0.28 * env(t, 0.02, 0.06, 0.2, 0.2, len));
  addNoise(out, t => 0.35 * env(t, 0.005, 0.04, 0.15, 0.25, len) * (t < 0.12 ? 1 : 0.35));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (t > 0.08 && ((t * 1000 | 0) % 47 === 0)) out[i] += 0.12 * (Math.random() - 0.5);
  }
  writeWav('death.wav', out);
}

// --- beam-charge: rising aether coil ---
{
  const len = 0.28;
  const n = (len * SR) | 0;
  const out = new Float32Array(n);
  addTone(out, t => 140 + t * 680, t => 0.18 * env(t, 0.02, 0.05, 0.7, 0.08, len), 'sine');
  addTone(out, t => 280 + t * 920, t => 0.08 * env(t, 0.03, 0.06, 0.5, 0.06, len), 'tri');
  addNoise(out, t => 0.12 * env(t, 0.04, 0.08, 0.4, 0.06, len), 0.3);
  writeWav('beam-charge.wav', out);
}

// --- beam-bast: nova release thump + crack ---
{
  const len = 0.48;
  const n = (len * SR) | 0;
  const out = new Float32Array(n);
  addTone(out, t => 320 * Math.exp(-t * 5), t => 0.32 * env(t, 0.005, 0.06, 0.25, 0.22, len), 'saw');
  addTone(out, t => 72 * Math.exp(-t * 3.5), t => 0.38 * env(t, 0.002, 0.05, 0.15, 0.28, len));
  addNoise(out, t => 0.28 * env(t, 0.003, 0.04, 0.08, 0.3, len));
  addTone(out, t => 880 * Math.exp(-t * 12), t => 0.1 * env(t, 0.001, 0.02, 0.05, 0.15, len), 'square');
  writeWav('beam-blast.wav', out);
}

// --- place: timber thud + stone ping ---
{
  const len = 0.22;
  const n = (len * SR) | 0;
  const out = new Float32Array(n);
  addTone(out, t => 95 * Math.exp(-t * 14), t => 0.34 * env(t, 0.003, 0.04, 0.1, 0.12, len));
  addTone(out, t => 420 * Math.exp(-t * 18), t => 0.14 * env(t, 0.008, 0.03, 0.05, 0.1, len), 'tri');
  addNoise(out, t => 0.16 * env(t, 0.002, 0.025, 0.06, 0.1, len), 0.5);
  writeWav('place.wav', out);
}

// --- boss-bark: deep cyclops warlord roar (Gharok hook) ---
{
  const len = 0.55;
  const n = (len * SR) | 0;
  const out = new Float32Array(n);
  addTone(out, t => 68 * Math.exp(-t * 1.8), t => 0.36 * env(t, 0.04, 0.12, 0.55, 0.2, len), 'saw');
  addTone(out, t => 34 + 8 * Math.sin(t * 18), t => 0.22 * env(t, 0.05, 0.1, 0.45, 0.22, len));
  addNoise(out, t => 0.18 * env(t, 0.03, 0.08, 0.35, 0.2, len), 0.2);
  writeWav('boss-bark.wav', out);
}

console.log('done — original TR procedural SFX');
