// Gharok + world beauty-shot capture (reuses test-v28 CDP harness pattern).
// Expects http://127.0.0.1:8322/index.html. Usage: node capture-gharok-preview.mjs
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9341;
const OUT_WALK = join(__dirname, 'rollouts', 'gharok-2.8.6-walk-preview.png');
const OUT_WORLD = join(__dirname, 'rollouts', 'world-2.8.6-trees-rocks-preview.png');
const OUT_ROOT = join(__dirname, 'gharok-2.8.6-preview.png');

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
  if (ver !== '2.8.6') console.warn('WARNING: expected APP_VERSION 2.8.6, got', ver);
  console.log('GHAROK_STOMP_JUICE:', await evaluate('GHAROK_STOMP_JUICE'));
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`!!(typeof gharokSpr!=='undefined' && gharokSpr.idle && gharokSpr.idle.complete && gharokSpr.idle.naturalWidth)`);
    if (ready) break;
    await sleep(100);
  }

  await evaluate(`document.getElementById('startBtn').click(); state`);

  // ---- Shot 1: boss walking (stride pose + gait juice) ----
  const walkInfo = await evaluate(`(() => {
    wave = 5; spawnQueue = 1; spawnTimer = 1e9; waveActive = true; graceT = 0;
    enemies = []; ebolts = []; sbolts = []; barricades = []; floaters = [];
    particles = []; rings = [];
    bannerT = 0;
    const wb0 = document.getElementById('wavebanner');
    if (wb0) wb0.style.opacity = 0;
    player.x = WORLD.w / 2; player.y = WORLD.h / 2;
    player.vx = player.vy = 0; player.hp = maxHp(); player.hurtT = 0;
    camera.shake = 0;
    const b = makeEnemy('warlord', player.x - 40, player.y - 10, { spawnT: 0, atkCd: 1e9 });
    b.armor = b.maxArmor;
    b.armorCrack = 4;
    b.clawCd = 1e9;
    b.clawWind = 0;
    b.flash = 0;
    b.facing = 1;
    b.vx = 55; b.vy = 8;
    b.walk = Math.PI * 1.25; // mid-stride half-cycle → walk.png
    player.x = b.x + 240;
    player.y = b.y + 40;
    update(0.016);
    camera.x = b.x - VW * 0.45;
    camera.y = b.y - VH * 0.55;
    bannerT = 0; floaters = [];
    const wb = document.getElementById('wavebanner');
    if (wb) wb.style.opacity = 0;
    render();
    return {
      type: b.type, walk: b.walk, stompOn: !!GHAROK_STOMP_JUICE,
      spriteOk: !!(gharokSpr.idle && gharokSpr.idle.naturalWidth),
      frame: (Math.floor(b.walk / Math.PI) & 1) ? 'walk' : 'idle',
    };
  })()`);
  console.log('walk state:', JSON.stringify(walkInfo));
  await screenshot(OUT_WALK);
  await screenshot(OUT_ROOT);

  // ---- Shot 2: grass world with new pines + rocks ----
  const worldInfo = await evaluate(`(() => {
    enemies = []; floaters = []; particles = [];
    // find a grass patch with trees nearby
    let tx = CAMP.x + 420, ty = CAMP.y - 80;
    const trees = obstacles.filter(o => o.type === 'tree');
    const rocks = obstacles.filter(o => o.type === 'rock');
    if (trees.length) {
      const t = trees[Math.floor(trees.length / 3)];
      tx = t.x; ty = t.y;
    }
    player.x = tx + 90; player.y = ty + 70;
    camera.shake = 0;
    camera.x = tx - VW * 0.42;
    camera.y = ty - VH * 0.55;
    bannerT = 0;
    const wb = document.getElementById('wavebanner');
    if (wb) wb.style.opacity = 0;
    render();
    return {
      trees: trees.length, rocks: rocks.length,
      sampleTreeSize: trees[0] && trees[0].size,
      sampleRockVariant: rocks[0] && rocks[0].variant,
    };
  })()`);
  console.log('world state:', JSON.stringify(worldInfo));
  await screenshot(OUT_WORLD);

  console.log('done');
  process.exitCode = 0;
} catch (err) {
  console.error('CAPTURE ERROR:', err);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
}
