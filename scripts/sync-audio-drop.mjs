#!/usr/bin/env node
/**
 * Map user drop-in SFX (any filename) → canonical cue names, then bake to
 * assets/audio/ (+ www mirror). Originals stay in drop/; canonical copies
 * land in drop/ too so runtime drop-first resolves them.
 *
 * Run when user says "bake audio" before a release build.
 * Does not delete shipped procedural files for cues with no drop file.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dropDir = join(root, 'assets', 'audio', 'drop');
const shipDir = join(root, 'assets', 'audio');
const wwwShipDir = join(root, 'www', 'assets', 'audio');
const wwwDropDir = join(root, 'www', 'assets', 'audio', 'drop');

const AUDIO_EXT = /\.(wav|ogg|mp3)$/i;

/** [source filename in drop/, canonical baked name] — first row per cue wins */
const CUE_MAP = [
  ['Zombie_orc_die_#1-1787886848149.mp3', 'death.mp3'],
  ['Beam_charging#3-1787888684428.mp3', 'beam-charge.mp3'],
  ['Energetic_beam_charge_#1-1787887236097.mp3', 'beam-blast.mp3'],
  ['building#2-1787888340717.mp3', 'place.mp3'],
  ['boss.mp3', 'boss-bark.mp3'],
  ['rifle_#3-1787888448003.mp3', 'rifle.mp3'],
  ['getting hurt#4-1787888591498.mp3', 'hurt.mp3'],
  ['ingame music#3-1787888943319.mp3', 'rift-music.mp3'],
  ['Guttural_zombie_orc__#3-1787886126171.mp3', 'enemy-bark.mp3'],
  ['Chopping_tree_#3-1787886546763.mp3', 'chop.mp3'],
  ['goldmining#3-1787886710860.mp3', 'mine.mp3'],
];

mkdirSync(shipDir, { recursive: true });
mkdirSync(wwwShipDir, { recursive: true });
mkdirSync(wwwDropDir, { recursive: true });

if (!existsSync(dropDir)) {
  console.log('no drop folder — nothing to sync');
  process.exit(0);
}

let copied = 0;
const baked = new Set();

for (const [srcName, canonName] of CUE_MAP) {
  const src = join(dropDir, srcName);
  if (!existsSync(src)) {
    console.log('skip (missing)', srcName);
    continue;
  }
  const targets = [
    join(dropDir, canonName),
    join(shipDir, canonName),
    join(wwwShipDir, canonName),
    join(wwwDropDir, canonName),
  ];
  for (const dest of targets) {
    copyFileSync(src, dest);
  }
  console.log('mapped', srcName, '→', canonName, '(drop + assets/audio + www)');
  baked.add(canonName);
  copied++;
}

// Mirror any other audio originals into www drop (dev hot-reload)
const extras = readdirSync(dropDir).filter(f => AUDIO_EXT.test(f) && !baked.has(f));
for (const name of extras) {
  copyFileSync(join(dropDir, name), join(wwwDropDir, name));
  console.log('mirrored original → www drop/', name);
}

console.log(`done — ${copied} cue(s) baked from drop/`);
