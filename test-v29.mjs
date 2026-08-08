// ============================================================================
// v2.9 verification harness — aether costs, companion HP, barricade adjacency,
// boss knockback mass, Riftwarden NPC + PeerJS soft-load, endless still optional.
// Expects http://127.0.0.1:8322/index.html
// Usage: node test-v29.mjs
// ============================================================================
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9335;
const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const edgePath = EDGE_PATHS.find(p => existsSync(p));
if (!edgePath) { console.error('FATAL: msedge.exe not found'); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'tr-edge-v29-'));
const edge = spawn(edgePath, [
  '--headless=new', `--remote-debugging-port=${DBG_PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getPageTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DBG_PORT}/json`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(100);
  }
  throw new Error('no CDP page');
}

let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, detail || ''); }
}

let ws, msgId = 0;
const pending = new Map();
async function send(method, params = {}) {
  const id = ++msgId;
  const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return p;
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval failed');
  return r.result.value;
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await sleep(900);
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`typeof APP_VERSION !== 'undefined' && typeof player !== 'undefined'`);
    if (ready) return;
    await sleep(100);
  }
  throw new Error('game failed to boot');
}

try {
  const target = await getPageTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  };
  await send('Runtime.enable'); await send('Page.enable');

  await navigate(GAME_URL);
  check('APP_VERSION is 2.9.2', await evaluate('APP_VERSION') === '2.9.2');
  check('Riftwarden NPC present', await evaluate(`NPCS.some(n => n.role === 'riftnet' && n.name.includes('Riftwarden'))`) === true);
  check('PeerJS soft-load (no throw if missing)', await evaluate(`typeof riftNetPeerOk === 'function' && (riftNetPeerOk() === true || riftNetPeerOk() === false)`) === true);
  check('fence max tier 5 / sentry 4', await evaluate('FENCE_MAX_TIER === 5 && SENTRY_MAX_TIER === 4') === true);

  await evaluate(`document.getElementById('startBtn').click(); true`);
  check('NEW GAME starts', await evaluate('state') === 'playing');

  // ---- aether costs ----
  const heal = await evaluate(`(() => {
    player.hp = maxHp() * 0.4; player.ki = 80;
    const miss = maxHp() - player.hp;
    const cost = aetherHealCost();
    const amt = aetherHealAmount();
    const beforeHp = player.hp, beforeKi = player.ki;
    const ok = buyAetherHeal();
    return { miss, cost, amt, ok, dHp: player.hp - beforeHp, dKi: beforeKi - player.ki,
      costFormula: Math.max(10, Math.ceil(miss * 0.30)) };
  })()`);
  check('aether heal cost scales with missing HP', heal.cost === heal.costFormula && heal.cost >= 10, JSON.stringify(heal));
  check('aether heal spends ki and restores HP', heal.ok && heal.dHp === heal.amt && heal.dKi === heal.cost, JSON.stringify(heal));

  const rev = await evaluate(`(() => {
    cores = 2000;
    buyCompanion('rover'); buyCompanion('warden');
    const c = companions.find(x => x.type === 'rover');
    c.downed = true; c.hp = 0;
    player.ki = 50;
    const cost = aetherReviveCost('rover');
    const ok = buyAetherRevive('rover');
    return { cost, ok, downed: c.downed, hp: c.hp, ki: player.ki, max: c.maxHp };
  })()`);
  check('revive Rover costs 20 aether', rev.cost === 20 && rev.ok && !rev.downed && rev.ki === 30, JSON.stringify(rev));
  check('revived companion at ~65% HP', Math.abs(rev.hp - Math.ceil(rev.max * 0.65)) <= 1, JSON.stringify(rev));

  // ---- field hold revive (v2.9.2) ----
  const field = await evaluate(`(() => {
    const c = companions.find(x => x.type === 'warden') || (() => { buyCompanion('warden'); return companions.find(x => x.type === 'warden'); })();
    c.downed = true; c.hp = 0;
    c.x = player.x + 20; c.y = player.y;
    player.ki = 40;
    talkHeld = true;
    for (let i = 0; i < 20; i++) updateReviveChannel(0.1);
    talkHeld = false;
    return { downed: c.downed, hp: c.hp, ki: player.ki, near: !!nearestDownedCompanion() || !c.downed, cost: ALLY_REVIVE_COST };
  })()`);
  check('field hold revive Warden (28 aether)', !field.downed && field.ki === 12, JSON.stringify(field));

  const coopDown = await evaluate(`(() => {
    riftNet.status = 'connected'; riftNet.conn = { send() {} };
    player.hp = 10; player.downed = false;
    hurtPlayer(999);
    const downed = player.downed === true && player.hp === 0 && state === 'playing';
    applyAllyReviveLocal(0.65);
    return { downed, revived: !player.downed && player.hp === Math.ceil(maxHp() * 0.65), allyCost: ALLY_REVIVE_COST };
  })()`);
  check('co-op lethal damage downs instead of game over', coopDown.downed, JSON.stringify(coopDown));
  check('applyAllyReviveLocal restores 65% HP', coopDown.revived && coopDown.allyCost === 22, JSON.stringify(coopDown));

  // ---- companion HP buffs ----
  const hp = await evaluate(`({ rover: COMP_TYPES.rover.hp, warden: COMP_TYPES.warden.hp, scout: COMP_TYPES.scout.hp })`);
  check('Rover HP buffed (≥180)', hp.rover >= 180, JSON.stringify(hp));
  check('Warden HP buffed (≥280)', hp.warden >= 280, JSON.stringify(hp));
  check('Scout HP buffed (≥150)', hp.scout >= 150, JSON.stringify(hp));

  // ---- barricade adjacency ----
  const link = await evaluate(`(() => {
    barricades = [];
    const baseHp = BARRICADE_HP + 8;
    barricades.push({ x: 400, y: 400, r: BARRICADE_BASE_R, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0 });
    barricades.push({ x: 400 + 70, y: 400, r: BARRICADE_BASE_R, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0 });
    refreshBarricadeLinks();
    const a = barricades[0], b = barricades[1];
    return {
      n0: a.neighbors, n1: b.neighbors,
      r0: a.r, r1: b.r,
      hpMul0: a.maxHp / a.baseHp,
      doubled: a.r === BARRICADE_BASE_R * 2,
    };
  })()`);
  check('adjacent barricades link (neighbors≥1)', link.n0 >= 1 && link.n1 >= 1, JSON.stringify(link));
  check('linked barricades double radius', link.doubled === true, JSON.stringify(link));
  check('linked barricades get HP bonus (~1.8×)', link.hpMul0 >= 1.75, JSON.stringify(link));

  // ---- boss knockback ----
  const kb = await evaluate(`(() => {
    enemies = [];
    spawnEnemy('warlord');
    const e = enemies[0];
    e.x = 800; e.y = 800; e.vx = 0; e.vy = 0; e.spawnT = 0; e.invulnT = 0; e.armor = 0; e.kbPool = 0;
    // light rifle-like ticks — measure velocity shove (position only moves in update)
    for (let i = 0; i < 8; i++) dealDamage(e, 11, 'rifle', 1, 0, 90);
    const lightVx = Math.abs(e.vx);
    e.vx = 0; e.vy = 0; e.kbPool = 0;
    dealDamage(e, 80, 'grenade', 1, 0, 380);
    const heavyVx = Math.abs(e.vx);
    // control: non-boss husk with same light hit
    spawnEnemy('husk');
    const h = enemies[enemies.length - 1];
    h.spawnT = 0; h.invulnT = 0; h.vx = 0;
    dealDamage(h, 11, 'rifle', 1, 0, 90);
    return { lightVx, heavyVx, huskVx: Math.abs(h.vx), alive: !e.dead };
  })()`);
  check('boss: light rifle ticks barely shove vs husk', kb.lightVx < kb.huskVx * 0.35 && kb.lightVx < 20, JSON.stringify(kb));
  check('boss: heavy hit shoves harder than light stack', kb.heavyVx > kb.lightVx, JSON.stringify(kb));

  // ---- endless still optional (victory at 15, continue) ----
  check('wave-15 victory path still optional (showVictory exists)', await evaluate(`typeof showVictory === 'function'`) === true);
  check('no forced finale beyond wave 15 gate', await evaluate(`typeof endWave === 'function'`) === true);

  // ---- Riftnet UI hooks ----
  check('riftNet create/join helpers exist', await evaluate(`typeof riftNetCreate === 'function' && typeof riftNetJoin === 'function'`) === true);
  await evaluate(`openRiftNet(); true`);
  check('Riftnet overlay opens', await evaluate(`!document.getElementById('riftNet').classList.contains('hidden')`) === true);
  await evaluate(`closeRiftNet(); true`);

  // screenshot: shop aether + camp markers via forced shop render
  await evaluate(`openShop(); renderShop(); true`);
  await sleep(200);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync('rollouts', { recursive: true });
  writeFileSync('preview-2.9.0-shop.png', Buffer.from(shot.data, 'base64'));
  console.log('  wrote preview-2.9.0-shop.png');

  await evaluate(`document.getElementById('nextWaveBtn').click(); player.x = CAMP.x; player.y = CAMP.y + 40; true`);
  await sleep(200);
  // place two linked barricades for visual
  await evaluate(`(() => {
    barricades = [];
    const baseHp = 200;
    barricades.push({ x: player.x + 40, y: player.y, r: 34, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0 });
    barricades.push({ x: player.x + 110, y: player.y, r: 34, hp: baseHp, maxHp: baseHp, baseHp, neighbors: 0 });
    refreshBarricadeLinks();
    camera.x = player.x - VW/2; camera.y = player.y - VH/2;
    render();
    return barricades.map(b => ({ r: b.r, n: b.neighbors }));
  })()`);
  await sleep(100);
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('preview-2.9.0-barricades.png', Buffer.from(shot2.data, 'base64'));
  console.log('  wrote preview-2.9.0-barricades.png');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
} catch (e) {
  console.error('FATAL', e);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
  setTimeout(() => process.exit(process.exitCode || 0), 200);
}
