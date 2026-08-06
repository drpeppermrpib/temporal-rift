// ============================================================================
// v2.6 verification harness — drives headless Edge via CDP (no npm deps;
// uses Node's built-in WebSocket). Serves nothing itself: expects the game
// at http://127.0.0.1:8322/index.html (npx http-server -p 8322 -c-1).
// Usage: node test-v26.mjs
// ============================================================================
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9333;

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const edgePath = EDGE_PATHS.find(p => existsSync(p));
if (!edgePath) { console.error('FATAL: msedge.exe not found'); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'tr-edge-'));
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

// ---- tiny CDP client ----
let msgId = 0;
const pending = new Map();
const pageErrors = [];   // uncaught exceptions + console.error from the page
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
  if (r.exceptionDetails) throw new Error('page eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}

let passCount = 0, failCount = 0;
function check(name, ok, detail = '') {
  if (ok) { passCount++; console.log(`PASS  ${name}`); }
  else { failCount++; console.log(`FAIL  ${name} ${detail}`); }
}

async function navigate(url) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try { if (await evaluate('document.readyState') === 'complete' && await evaluate('typeof APP_VERSION') === 'string') return; } catch {}
  }
  throw new Error('page never finished loading');
}

const PUMP = n => `for (let i=0;i<${n};i++) update(1/60); true`; // manual sim pump (rAF may be throttled headless)

function drag(id, dx, dy) {
  return evaluate(`(() => {
    const el = document.getElementById('${id}');
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    el.dispatchEvent(new PointerEvent('pointerdown', {clientX:cx, clientY:cy, bubbles:true, pointerId:9}));
    for (let s=1; s<=4; s++)
      window.dispatchEvent(new PointerEvent('pointermove', {clientX:cx+${dx}*s/4, clientY:cy+${dy}*s/4, pointerId:9}));
    window.dispatchEvent(new PointerEvent('pointerup', {clientX:cx+${dx}, clientY:cy+${dy}, pointerId:9}));
    const r2 = el.getBoundingClientRect();
    return { from:[r.left,r.top], to:[r2.left,r2.top] };
  })()`);
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
    } else if (m.method === 'Runtime.exceptionThrown') {
      pageErrors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      pageErrors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    }
  };
  await send('Runtime.enable'); await send('Page.enable');

  // ================= load 1: fresh profile =================
  await navigate(GAME_URL);
  check('APP_VERSION is 2.6', await evaluate('APP_VERSION') === '2.6');
  check('version label on menu', await evaluate(`document.getElementById('appVer').textContent`) === 'v2.6');

  // safe-area defaults (no inset in headless): --safeTop = 16px, topbar +8 = 24px
  const topbarTop = await evaluate(`getComputedStyle(document.getElementById('topbar')).top`);
  check('topbar default top 24px (was 10px in 2.5)', topbarTop === '24px', `got ${topbarTop}`);
  const barsTop = await evaluate(`getComputedStyle(document.querySelector('.bars')).top`);
  check('health bars default top 16px', barsTop === '16px', `got ${barsTop}`);

  // ---- start a run, desktop-keyboard sanity ----
  await evaluate(`document.getElementById('startBtn').click(); state`);
  check('NEW GAME starts', await evaluate('state') === 'playing');
  await evaluate(PUMP(30));
  const px0 = await evaluate('player.x');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyD'})); true`);
  await evaluate(PUMP(30));
  const px1 = await evaluate('player.x');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyD'})); true`);
  check('keyboard movement (D moves right)', px1 > px0 + 10, `x ${px0} -> ${px1}`);
  await evaluate('mouse.down = true; true');
  await evaluate(PUMP(15));
  check('firing spawns bolts', await evaluate('bolts.length') > 0 || await evaluate('kills') > 0);
  await evaluate('mouse.down = false; true');

  // ---- settings menu: new rows cycle + persist ----
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyP'})); true`);
  check('pause menu opens (P)', await evaluate('settingsOpen') === true);

  await evaluate(`document.getElementById('rowHudOff').click(); true`);
  check('HUD offset row cycles to 16', await evaluate('settings.hudOffset') === 16);
  check('--hudTop var applied', await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--hudTop').trim()`) === '16px');
  const topbarTop2 = await evaluate(`getComputedStyle(document.getElementById('topbar')).top`);
  check('topbar shifts with HUD offset (24+16=40px)', topbarTop2 === '40px', `got ${topbarTop2}`);
  check('label shows +16 PX', (await evaluate(`document.getElementById('hudOffVal').textContent`)) === '+16 PX');
  check('hudOffset persisted', JSON.parse(await evaluate(`localStorage.getItem('tr_settings')`)).hudOffset === 16);
  const stPad = await evaluate(`parseFloat(getComputedStyle(document.getElementById('skilltree')).paddingTop)`);
  check('skill tree top padding tracks offset (36px)', stPad === 36, `got ${stPad}`);

  await evaluate(`document.getElementById('rowBtnStyle').click(); true`);
  check('button style cycles to neon', await evaluate(`settings.btnStyle === 'neon' && document.body.classList.contains('btn-neon')`));
  await evaluate(`document.getElementById('rowBtnStyle').click(); true`);
  check('button style cycles to minimal', await evaluate(`settings.btnStyle === 'minimal' && document.body.classList.contains('btn-minimal') && !document.body.classList.contains('btn-neon')`));
  check('btnStyle persisted', JSON.parse(await evaluate(`localStorage.getItem('tr_settings')`)).btnStyle === 'minimal');

  // ---- vibration: toggle + gating ----
  check('vibro defaults OFF on desktop (no touch)', await evaluate('settings.vibro') === false);
  await evaluate(`
    window.__buzzCount = 0;
    Object.defineProperty(navigator, 'vibrate', { value: p => { window.__buzzCount++; return true; }, configurable: true });
    true`);
  await evaluate('buzz(30); true');
  check('buzz gated off when setting disabled', await evaluate('window.__buzzCount') === 0);
  await evaluate(`document.getElementById('togVibro').click(); true`);
  check('vibration toggle turns on (+confirm blip)', await evaluate('settings.vibro') === true
    && await evaluate('window.__buzzCount') === 1);
  check('vibro persisted', JSON.parse(await evaluate(`localStorage.getItem('tr_settings')`)).vibro === true);
  await evaluate(`hurtPlayer(5); explodeGrenade({x:player.x,y:player.y}); true`);
  check('damage + explosion buzz when enabled', await evaluate('window.__buzzCount') === 3);
  await evaluate(`
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true }); // browser without the API
    buzz(30); buzz([40,60,40]);
    true`);
  check('buzz safe without navigator.vibrate', true); // would have thrown above
  await evaluate(`document.getElementById('togVibro').click(); true`); // back off for the rest of the run

  // ---- layout editor: per-button drag ----
  await evaluate(`document.getElementById('layoutBtn').click(); true`);
  check('layout edit mode on', await evaluate(`layoutEditing === true && document.body.classList.contains('layout-editing')`));
  check('buttons visible for editing', await evaluate(`document.getElementById('btnFire').getBoundingClientRect().width`) > 0);

  const fire = await drag('btnFire', -180, -120);
  check('FIRE drags independently', Math.abs(fire.to[0] - (fire.from[0] - 180)) < 3 && Math.abs(fire.to[1] - (fire.from[1] - 120)) < 3, JSON.stringify(fire));
  check('FIRE stored per-button', await evaluate(`!!(settings.layout && settings.layout.btns && settings.layout.btns.btnFire)`));
  const dash = await drag('btnDash', -300, 40);
  check('DASH drags independently', Math.abs(dash.to[0] - (dash.from[0] - 300)) < 3, JSON.stringify(dash));
  const beamMoved = await evaluate(`!!settings.layout.btns.btnBeam`);
  check('untouched BEAM keeps default (no entry)', beamMoved === false);
  const joy = await drag('joyZone', 60, -40);
  check('joystick zone still drags', Math.abs(joy.to[0] - (joy.from[0] + 60)) < 3, JSON.stringify(joy));
  check('layout stamped v2', await evaluate('settings.layout.v') === 2);
  await screenshot('test-v26-editmode.png');
  await evaluate(`document.getElementById('layoutDone').click(); true`);
  check('DONE exits + persists layout', await evaluate('layoutEditing') === false
    && !!JSON.parse(await evaluate(`localStorage.getItem('tr_settings')`)).layout.btns.btnFire);

  // ---- ui scale change must keep custom buttons on-screen ----
  await evaluate(`document.getElementById('rowUiSize').click(); true`); // normal -> small? UI_SCALES order: small,normal,large: normal->large
  const scaleNow = await evaluate('settings.uiScale');
  const inView = await evaluate(`(() => {
    document.body.classList.add('layout-editing'); // force visible to measure
    const ids = ['btnBuild','btnForm','btnGren','btnDash','btnNova','btnBeam','btnFire'];
    const bad = ids.filter(id => { const r = document.getElementById(id).getBoundingClientRect();
      return r.left < -1 || r.top < -1 || r.right > innerWidth+1 || r.bottom > innerHeight+1; });
    document.body.classList.remove('layout-editing');
    return bad;
  })()`);
  check(`buttons on-screen after scale change (${scaleNow})`, inView.length === 0, JSON.stringify(inView));

  // ================= load 2: everything survives reload =================
  await navigate(GAME_URL);
  const s2 = JSON.parse(await evaluate(`localStorage.getItem('tr_settings')`));
  check('reload: hudOffset persisted', s2.hudOffset === 16);
  check('reload: btnStyle persisted+applied', s2.btnStyle === 'minimal' && await evaluate(`document.body.classList.contains('btn-minimal')`));
  check('reload: --hudTop reapplied', await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--hudTop').trim()`) === '16px');
  check('reload: per-button layout persisted', !!s2.layout.btns.btnFire && !!s2.layout.btns.btnDash && !s2.layout.btns.btnBeam);
  check('reload: custom pos applied inline', (await evaluate(`document.getElementById('btnFire').style.right`)) !== '');

  // legacy v1 clump migration: fake an old save, reload, expect no errors + clump applied
  await evaluate(`localStorage.setItem('tr_settings', JSON.stringify({shake:true,dmgText:true,uiScale:'normal',layout:{tbtns:{right:120,bottom:60},joy:null}})); true`);
  await navigate(GAME_URL);
  check('v1 clump save: loads clean, clump offset applied', await evaluate(`document.getElementById('tbtns').style.right`) === '120px');

  // v1 migration in the editor (controls become visible there) + RESET restores defaults
  await evaluate(`document.getElementById('startBtn').click(); true`);
  await evaluate(PUMP(5));
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyP'})); true`);
  await evaluate(`document.getElementById('layoutBtn').click(); true`);
  check('v1 clump save: buttons pinned individually once visible',
    (await evaluate(`document.getElementById('btnFire').style.position`)) === 'fixed');
  const v1fire = await evaluate(`(() => { const r = document.getElementById('btnFire').getBoundingClientRect();
    return r.left >= -1 && r.top >= -1 && r.right <= innerWidth+1 && r.bottom <= innerHeight+1 && r.width > 0; })()`);
  check('v1 clump save: pinned buttons on-screen', v1fire === true);
  await evaluate(`document.getElementById('layoutReset').click(); true`);
  check('RESET clears layout', await evaluate('settings.layout') === null
    && (await evaluate(`document.getElementById('tbtns').style.right`)) === '');
  await evaluate(`document.getElementById('layoutDone').click(); true`);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyP'})); true`);
  await evaluate(PUMP(60));
  await screenshot('test-v26-gameplay.png');

  check('no page exceptions / console errors', pageErrors.length === 0, '\n  ' + pageErrors.join('\n  '));

  console.log(`\n== ${passCount} passed, ${failCount} failed ==`);
  process.exitCode = failCount ? 1 : 0;
} catch (err) {
  console.error('HARNESS ERROR:', err);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
}
