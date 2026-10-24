import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => existsSync(p));
const profile = mkdtempSync(join(tmpdir(), 'tr-rw-'));
const edge = spawn(EDGE, [
  '--headless=new', '--remote-debugging-port=9336',
  `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(900);
const list = await (await fetch('http://127.0.0.1:9336/json/list')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, { resolve, reject });
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result.value;
};
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:8322/index.html' });
for (let i = 0; i < 40; i++) {
  await sleep(150);
  try { if (await evaluate('typeof APP_VERSION') === 'string') break; } catch {}
}
await evaluate(`document.getElementById('startBtn').click();
  player.x = CAMP.x - 40; player.y = CAMP.y + 60;
  camera.x = player.x - VW / 2; camera.y = player.y - VH / 2;
  openRiftNet(); true`);
await sleep(350);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('preview-2.9.0-riftwarden.png', Buffer.from(shot.data, 'base64'));
console.log('wrote preview-2.9.0-riftwarden.png');
edge.kill();
process.exit(0);
