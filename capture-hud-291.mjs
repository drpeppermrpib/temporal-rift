// Capture HUD cluster screenshot for v2.9.1. Expects server on :8322.
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9349;
const OUT = join(__dirname, 'rollouts', 'hud-2.9.1-preview.png');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const edgePath = EDGE_PATHS.find(p => existsSync(p));
if (!edgePath) { console.error('FATAL: msedge.exe not found'); process.exit(2); }

mkdirSync(join(__dirname, 'rollouts'), { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'tr-hud-'));
const edge = spawn(edgePath, [
  '--headless=new', `--remote-debugging-port=${DBG_PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let msgId = 0;
const pending = new Map();
let ws;

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

try {
  await sleep(800);
  const page = await getPageTarget();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve; ws.onerror = reject;
  });
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };
  await send('Page.enable');
  await navigate(GAME_URL);
  const ver = await evaluate('APP_VERSION');
  if (ver !== '2.9.1') throw new Error('expected 2.9.1 got ' + ver);

  await evaluate("document.getElementById('startBtn').click()");
  await sleep(900);
  const info = await evaluate(`(() => {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.add('hidden');
    settings.mapSize = 'medium';
    applyMapSize();
    wave = 1; waveActive = true; spawnQueue = 0; graceT = 0;
    player.hp = maxHp(); player.ki = maxKi() * 0.62;
    enemies = [];
    try { enemies.push(makeEnemy('husk', player.x + 240, player.y - 90, { spawnT: 0 })); } catch (e) {}
    try { enemies.push(makeEnemy('ravager', player.x - 200, player.y + 140, { spawnT: 0 })); } catch (e) {}
    updateHud();
    return {
      state,
      hudHidden: document.getElementById('hud').classList.contains('hidden'),
      cluster: !!document.getElementById('hudCluster'),
      mapW: document.getElementById('minimap').width,
    };
  })()`);
  console.log('info', info);
  await sleep(250);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('wrote', OUT);
  if (info.hudHidden || !info.cluster) throw new Error('HUD not visible');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  try { edge.kill(); } catch {}
  process.exit(process.exitCode || 0);
}
