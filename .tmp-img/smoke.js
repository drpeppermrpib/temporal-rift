'use strict';
const fs = require('fs');
const src = fs.readFileSync('game.js', 'utf8');
const voices = ['whoosh','zap','crackle','stomp','melee','hurt','levelup','waveclear','click','fire','cleaver'];
for (const n of voices) {
  if (!src.includes(n + '(ctx, dest, now)')) throw new Error('missing voice ' + n);
}
if (!src.includes('sfx.play')) throw new Error('no sfx.play');
if (!src.includes('openSoundMenu') || !src.includes('soundMenu')) throw new Error('no sound menu');
if (!src.includes('pineSpriteFor') || !src.includes('rockSpriteFor')) throw new Error('no world sprites');
if (!src.includes("const APP_VERSION = '2.8.7'")) throw new Error('bad version');
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
if (!gradle.includes('versionCode 35') || !gradle.includes('versionName "2.8.7"')) throw new Error('gradle version');
for (const f of [
  'assets/world/trees/pine_tall.png','assets/world/trees/pine_med.png','assets/world/trees/pine_small.png',
  'assets/world/rocks/rock_boulder.png','assets/world/rocks/rock_cluster.png',
  'assets/world/rocks/rock_slab.png','assets/world/rocks/rock_mossy.png',
]) {
  if (!fs.existsSync(f)) throw new Error('missing ' + f);
}
console.log('smoke ok');
