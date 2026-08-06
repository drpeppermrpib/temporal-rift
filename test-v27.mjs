// ============================================================================
// v2.7 verification harness — drives headless Edge via CDP (no npm deps;
// uses Node's built-in WebSocket). Serves nothing itself: expects the game
// at http://127.0.0.1:8322/index.html (npx http-server -p 8322 -c-1).
// Usage: node test-v27.mjs
//
// Covers Update 2 gameplay: zombie fusion (Bulwark), grave skeletons,
// fireball projectiles, boss armor plate, fence grid tiers + persistence.
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
  check('APP_VERSION is 2.7', await evaluate('APP_VERSION') === '2.7');
  check('version label on menu', await evaluate(`document.getElementById('appVer').textContent`) === 'v2.7');

  // ---- keyboard gameplay sanity run (natural wave 1) ----
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
  await evaluate(PUMP(240)); // half-run: let wave 1 tick with spawns, projectiles, fx
  check('sanity run: still playing, no crash', await evaluate('state') === 'playing');

  // ---- controlled arena: freeze wave spawning so nothing ends the wave ----
  // spawnQueue>0 keeps waveActive; a giant spawnTimer stops real spawns.
  await evaluate(`enemies = []; ebolts = []; bolts = []; grenades = [];
    wave = 4; spawnQueue = 1; spawnTimer = 1e9; waveActive = true;
    player.hp = maxHp(); true`);

  // ================= 1. zombie fusion =================
  const kills0 = await evaluate('kills');
  await evaluate(`makeEnemy('husk', CAMP.x + 300, CAMP.y, {spawnT: 0});
    makeEnemy('husk', CAMP.x + 330, CAMP.y, {spawnT: 0}); true`);
  await evaluate(PUMP(130)); // > FUSE_TIME 1.5s at 60fps
  check('fusion: Bulwark spawned from two adjacent husks',
    await evaluate(`enemies.filter(e => e.type === 'bulwark' && !e.dead).length`) === 1);
  check('fusion: both husks consumed', await evaluate(`enemies.filter(e => e.type === 'husk').length`) === 0);
  check('fusion: no kill credit for merged husks', await evaluate('kills') === kills0);
  const bw = await evaluate(`(() => { const b = enemies.find(e => e.type === 'bulwark');
    return { hp: b.maxHp, spd: b.spd, dmg: b.dmg, kb: b.kbPlayer }; })()`);
  check('fusion: Bulwark stats (2.5x husk hp, slower, heavier, knockback)',
    Math.abs(bw.hp - 90 * (1 + 3 * 0.16)) < 0.01 && bw.spd < 50 && bw.dmg === 16 && bw.kb === 260,
    JSON.stringify(bw));
  // cap: with FUSE_MAX_ALIVE bulwarks up, further pairs must NOT fuse
  await evaluate(`makeEnemy('bulwark', CAMP.x - 400, CAMP.y - 400, {spawnT: 0});
    makeEnemy('husk', CAMP.x + 300, CAMP.y + 60, {spawnT: 0});
    makeEnemy('husk', CAMP.x + 330, CAMP.y + 60, {spawnT: 0}); true`);
  await evaluate(PUMP(130));
  check('fusion: capped at 2 concurrent Bulwarks',
    await evaluate(`enemies.filter(e => e.type === 'bulwark').length`) === 2
    && await evaluate(`enemies.filter(e => e.type === 'husk').length`) === 2);
  check('fusion: below wave 4 nothing fuses', await evaluate(`(() => {
    enemies = []; const w0 = wave; wave = 3;
    makeEnemy('husk', CAMP.x + 300, CAMP.y, {spawnT: 0});
    makeEnemy('husk', CAMP.x + 330, CAMP.y, {spawnT: 0});
    for (let i = 0; i < 130; i++) update(1/60);
    const ok = enemies.filter(e => e.type === 'bulwark').length === 0;
    wave = w0; return ok; })()`) === true);

  // ================= 2. grave skeletons =================
  await evaluate(`enemies = []; graves = [{x: CAMP.x - 300, y: CAMP.y, t: 0.1, wave}]; graveCount = 1; true`);
  await evaluate(PUMP(12));
  check('skeleton: spawns from forced death marker',
    await evaluate(`enemies.filter(e => e.type === 'skeleton').length`) === 1);
  const emg = await evaluate(`(() => { const s = enemies.find(e => e.type === 'skeleton');
    const h0 = s.hp; dealDamage(s, 50, 'rifle');
    return { emerging: s.emergeT > 0, invuln: s.invulnT > 0, hpBefore: h0, hpAfter: s.hp }; })()`);
  check('skeleton: emerging + invulnerable (damage blocked)',
    emg.emerging && emg.invuln && emg.hpAfter === emg.hpBefore, JSON.stringify(emg));
  await evaluate(PUMP(45)); // 0.75s > emerge 0.5s
  const emg2 = await evaluate(`(() => { const s = enemies.find(e => e.type === 'skeleton');
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const h0 = s.hp; dealDamage(s, 5, 'rifle');
    return { emerged: !(s.emergeT > 0), drop: h0 - s.hp, spd: s.spd }; })()`);
  check('skeleton: emerged, now damageable, fast+fragile',
    emg2.emerged && Math.abs(emg2.drop - 5) < 0.01 && emg2.spd > 170, JSON.stringify(emg2));
  check('skeleton: graves cleared on wave end', await evaluate(`(() => {
    graves = [{x: 0, y: 0, t: 5, wave}]; const wa = waveActive; const sq = spawnQueue;
    endWave(); const ok = graves.length === 0;
    // restore mid-wave state for the remaining tests
    waveActive = true; spawnQueue = sq; graceT = 0; chest = null; state = 'playing';
    return ok; })()`) === true);

  // ================= 3. fireballs =================
  await evaluate(`enemies = []; ebolts = []; makeEnemy('shaman', CAMP.x + 200, CAMP.y + 120, {spawnT: 0, atkCd: 0.01}); true`);
  await evaluate(PUMP(10));
  check('fireball: ranged enemies emit flagged fireballs',
    await evaluate('ebolts.length') > 0 && await evaluate('ebolts.every(b => b.fire === true)') === true);
  check('fireball: synthesized whoosh function present', await evaluate(`typeof playWhoosh === 'function'`) === true);
  check('fireball: whoosh call is safe headless', await evaluate('playWhoosh(); true') === true);
  await evaluate(PUMP(20));
  check('fireball: flame trail particles spawn', await evaluate(`particles.some(p => p.color === '#ff9d2e' || p.color === '#ff5a1f')`) === true);
  check('fireball: ember burst on impact', await evaluate(`(() => {
    particles = []; emberBurst(player.x, player.y);
    return particles.filter(p => p.color === '#ff9d2e').length === 8
        && particles.filter(p => p.color === '#ffd54a').length === 4; })()`) === true);

  // ================= 4. boss armor =================
  await evaluate(`enemies = []; ebolts = []; tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 }; true`);
  const arm0 = await evaluate(`(() => { const b = makeEnemy('warlord', CAMP.x, CAMP.y - 300, {spawnT: 0});
    return { armor: b.armor, maxArmor: b.maxArmor, full: b.armor === b.maxArmor }; })()`);
  check('armor: warlord enters with full armor plate', arm0.armor > 0 && arm0.full, JSON.stringify(arm0));
  const hit1 = await evaluate(`(() => { const b = enemies.find(e => e.boss);
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const hp0 = b.hp, a0 = b.armor; dealDamage(b, 100, 'rifle');
    return { hpDrop: hp0 - b.hp, armorDrop: a0 - b.armor }; })()`);
  check('armor: while armored, hp damage halved (100 -> 50) and armor chips full 100',
    Math.abs(hit1.hpDrop - 50) < 0.01 && Math.abs(hit1.armorDrop - 100) < 0.01, JSON.stringify(hit1));
  const brk = await evaluate(`(() => { const b = enemies.find(e => e.boss);
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    b.armor = 10; const s0 = b.spd; dealDamage(b, 100, 'rifle');
    return { armor: b.armor, spdMul: b.spd / s0 }; })()`);
  check('armor: breaks at 0 and boss enrages (+18% speed)',
    brk.armor === 0 && Math.abs(brk.spdMul - 1.18) < 0.001, JSON.stringify(brk));
  const hit2 = await evaluate(`(() => { const b = enemies.find(e => e.boss);
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const hp0 = b.hp; dealDamage(b, 100, 'rifle');
    return { hpDrop: hp0 - b.hp }; })()`);
  check('armor: broken plate = full damage (100 -> 100)', Math.abs(hit2.hpDrop - 100) < 0.01, JSON.stringify(hit2));
  await evaluate('render(); true');
  await screenshot('test-v27-boss.png');

  // ================= 5. fence grid tiers =================
  check('fence: starts at tier 1', await evaluate('fenceTier') === 1);
  await evaluate('cores = 600; buyFence(); true');
  check('fence: tier 2 purchase costs 150', await evaluate('fenceTier') === 2 && await evaluate('cores') === 450);
  await evaluate('buyFence(); true');
  check('fence: tier 3 purchase costs 400', await evaluate('fenceTier') === 3 && await evaluate('cores') === 50);
  await evaluate('buyFence(); true');
  check('fence: tier capped at 3', await evaluate('fenceTier') === 3 && await evaluate('cores') === 50);
  // functional: enemy grinding on a fence gets slowed + zapped at tier 3
  const grind = await evaluate(`(() => {
    enemies = [];
    barricades.push({ x: CAMP.x + 300, y: CAMP.y + 120, r: 34, hp: 99999, maxHp: 99999 });
    const h = makeEnemy('husk', CAMP.x + 344, CAMP.y + 120, { spawnT: 0 }); // far side, walks into fence
    for (let i = 0; i < 40; i++) update(1/60);
    return { slowed: h.slowT > 0, zapped: h.hp < h.maxHp, alive: !h.dead }; })()`);
  check('fence: tier 3 contact slows + zaps enemies', grind.slowed && grind.zapped, JSON.stringify(grind));
  // persistence through the save snapshot
  await evaluate('saveGame(false); true');
  check('fence: tier written to save snapshot',
    JSON.parse(await evaluate(`localStorage.getItem('tr_save1')`)).fenceTier === 3);

  // ================= load 2: fence tier survives reload =================
  await navigate(GAME_URL);
  check('reload: CONTINUE offered', await evaluate(`!document.getElementById('continueBtn').classList.contains('hidden')`) === true);
  await evaluate(`document.getElementById('continueBtn').click(); true`);
  check('reload: save restores fence tier 3', await evaluate('fenceTier') === 3);
  check('reload: pre-2.7 saves default to tier 1', await evaluate(`(() => {
    const s = JSON.parse(localStorage.getItem('tr_save1'));
    delete s.fenceTier; localStorage.setItem('tr_save1', JSON.stringify(s));
    const ok = loadGame() && fenceTier === 1;
    return ok; })()`) === true);
  check('new run resets fence to tier 1', await evaluate('newGame(); fenceTier') === 1);
  await evaluate(PUMP(120));
  await evaluate('render(); true');
  await screenshot('test-v27-gameplay.png');

  check('no page exceptions / console errors', pageErrors.length === 0, '\n  ' + pageErrors.join('\n  '));

  console.log(`\n== ${passCount} passed, ${failCount} failed ==`);
  process.exitCode = failCount ? 1 : 0;
} catch (err) {
  console.error('HARNESS ERROR:', err);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
}
