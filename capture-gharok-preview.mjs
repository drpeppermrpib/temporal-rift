// Quick Gharok beauty-shot capture (reuses test-v28 CDP harness pattern).
// Expects http://127.0.0.1:8322/index.html. Usage: node capture-gharok-preview.mjs
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9341;
const OUT = join(__dirname, 'rollouts', 'gharok-2.8.1-preview.png'); // overwrite requested preview slot
const OUT_CLEAN = join(__dirname, 'rollouts', 'gharok-clean-preview.png');
const OUT_ROOT = join(__dirname, 'gharok-2.8.2-preview.png');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const edgePath = EDGE_PATHS.find(p => existsSync(p));
if (!edgePath) { console.error('FATAL: msedge.exe not found'); process.exit(2); }

mkdirSync(join(__dirname, 'rollouts'), { recursive: true });

const profile = mkdtempSync(join(tmpdir(), 'tr-gharok-'));
const edge = spawn(edgePath, [
  '--headless=new', `--remote-debugging-port=${DBG_PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getPageTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DBG_PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(200);
  }
  throw new Error('DevTools endpoint never came up');
}

let msgId = 0;
const pending = new Map();
let ws;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error('page eval threw: ' + JSON.stringify(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}

async function navigate(url) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try {
      if (await evaluate('document.readyState') === 'complete'
        && await evaluate('typeof APP_VERSION') === 'string') return;
    } catch {}
  }
  throw new Error('page never finished loading');
}

async function screenshot(file) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log('shot: ' + file);
}

try {
  const target = await getPageTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');

  await navigate(GAME_URL);
  const ver = await evaluate('APP_VERSION');
  console.log('APP_VERSION:', ver);
  if (ver !== '2.8.2') console.warn('WARNING: expected APP_VERSION 2.8.2, got', ver);

  await evaluate(`document.getElementById('startBtn').click(); state`);
  // freeze waves, clear arena, spawn Gharok armor-intact + claw wind-up, no banner clutter
  const info = await evaluate(`(() => {
    wave = 5; spawnQueue = 1; spawnTimer = 1e9; waveActive = true; graceT = 0;
    enemies = []; ebolts = []; sbolts = []; barricades = []; floaters = [];
    particles = []; rings = [];
    if (typeof bannerT !== 'undefined') bannerT = 0;
    if (typeof banner !== 'undefined' && banner && typeof banner === 'object') {
      banner.t = 0; banner.text = ''; banner.sub = '';
    }
    const wb0 = document.getElementById('wavebanner');
    if (wb0) wb0.style.opacity = 0;
    player.x = WORLD.w / 2; player.y = WORLD.h / 2;
    player.vx = player.vy = 0; player.hp = maxHp(); player.hurtT = 0;
    camera.shake = 0;
    const b = makeEnemy('warlord', player.x - 40, player.y - 10, { spawnT: 0, atkCd: 1e9 });
    b.armor = b.maxArmor;
    b.armorCrack = 4; // all plates intact
    b.clawCd = 1e9;
    b.clawWind = CLAW_WINDUP * 0.7; // red claw telegraph pose
    b.flash = 0;
    b.facing = 1;
    b.walk = 1.1;
    player.x = b.x + 220;
    player.y = b.y + 30;
    update(0);
    camera.x = b.x - VW * 0.45;
    camera.y = b.y - VH * 0.55;
    if (typeof bannerT !== 'undefined') bannerT = 0;
    const wb = document.getElementById('wavebanner');
    if (wb) wb.style.opacity = 0;
    floaters = [];
    render();
    return {
      type: b.type, boss: !!b.boss, armor: b.armor, armorCrack: b.armorCrack,
      clawWind: b.clawWind, x: b.x, y: b.y,
    };
  })()`);
  console.log('boss state:', JSON.stringify(info));
  await evaluate(`(() => {
    bannerT = 0;
    const wb = document.getElementById('wavebanner');
    if (wb) wb.style.opacity = 0;
    floaters = [];
    render();
    return true;
  })()`);

  await screenshot(OUT);
  await screenshot(OUT_CLEAN);
  await screenshot(OUT_ROOT);
  console.log('done');
  process.exitCode = 0;
} catch (err) {
  console.error('CAPTURE ERROR:', err);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
}
