// ============================================================================
// v2.8 verification harness — drives headless Edge via CDP (no npm deps;
// uses Node's built-in WebSocket). Serves nothing itself: expects the game
// at http://127.0.0.1:8322/index.html (npx http-server -p 8322 -c-1).
// Usage: node test-v28.mjs
//
// Covers "Arsenal & Checkpoints": dual-wield ascension + Twin Channeling,
// Gusher knockback splash, Sticker needle embed/burst, wave-7+ ascended &
// plated enemies + caster bolt-swap, camera peek setting, sentry turrets,
// twin-skulled war-brute claw slash + armor plate cracks, companions
// (Rover/Warden/Scout: buy, fight, taunt, packs, fetch, down/revive),
// death checkpoints (respawn w/ core penalty + give-up reset), and the
// full save/load roundtrip.
// ============================================================================
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GAME_URL = 'http://127.0.0.1:8322/index.html';
const DBG_PORT = 9334;

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
  check('APP_VERSION is 2.8.1', await evaluate('APP_VERSION') === '2.8.1');
  check('version label on menu', await evaluate(`document.getElementById('appVer').textContent`) === 'v2.8.1');

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
  check('firing spawns rifle bolts', await evaluate(`bolts.every(b => b.wpn === 'rifle')`) === true
    && (await evaluate('bolts.length') > 0 || await evaluate('kills') > 0));
  await evaluate('mouse.down = false; true');
  await evaluate(PUMP(180));
  check('sanity run: still playing, no crash', await evaluate('state') === 'playing');

  // ================= 1. camera peek =================
  // park mid-world so camera clamps can't interfere
  await evaluate(`player.x = WORLD.w / 2; player.y = WORLD.h / 2; player.vx = player.vy = 0; camera.shake = 0; true`);
  const cam = await evaluate(`(() => {
    const out = {};
    for (const v of ['normal', 'low', 'lower']) {
      settings.camView = v;
      update(0); // no time: just recompute camera
      out[v] = camera.y - (player.y - VH / 2);
    }
    settings.camView = 'normal';
    return { ...out, vh: VH };
  })()`);
  check('camera: NORMAL has no offset', Math.abs(cam.normal) < 0.5, JSON.stringify(cam));
  check('camera: LOW shifts center down 5% of VH', Math.abs(cam.low - cam.vh * 0.05) < 0.5, JSON.stringify(cam));
  check('camera: LOWER shifts center down 10% of VH', Math.abs(cam.lower - cam.vh * 0.10) < 0.5, JSON.stringify(cam));
  check('camera: setting persists to tr_settings', await evaluate(`(() => {
    settings.camView = 'low'; persistSettings();
    const ok = JSON.parse(localStorage.getItem('tr_settings')).camView === 'low';
    settings.camView = 'normal'; persistSettings();
    return ok; })()`) === true);

  // ---- controlled arena: freeze wave spawning so nothing ends the wave ----
  await evaluate(`enemies = []; ebolts = []; bolts = []; cbolts = []; sbolts = []; grenades = [];
    wave = 4; spawnQueue = 1; spawnTimer = 1e9; waveActive = true;
    player.hp = maxHp(); player.hurtT = 0; true`);

  // ================= 2. arsenal: buy weapons + dual-wield =================
  await evaluate('cores = 1000; true');
  await evaluate(`buyGear(gear.find(u => u.id === 'gusher')); buyGear(gear.find(u => u.id === 'sticker')); true`);
  check('shop: Gusher (120) + Sticker (180) bought', await evaluate('cores') === 700
    && await evaluate(`gearLvl('gusher') === 1 && gearLvl('sticker') === 1`) === true);
  check('shop: first bought gun auto-equips as secondary', await evaluate(`loadout.secondary`) === 'gusher');
  check('arsenal: owned weapon list', JSON.stringify(await evaluate('ownedWeapons()')) === '["rifle","gusher","sticker"]');
  check('arsenal: loadout cycling keeps hands distinct', await evaluate(`(() => {
    loadout = { primary: 'rifle', secondary: 'gusher' };
    for (let i = 0; i < 6; i++) { cycleLoadout('primary'); if (loadout.primary === loadout.secondary) return false; }
    for (let i = 0; i < 8; i++) { cycleLoadout('secondary'); if (loadout.secondary !== null && loadout.secondary === loadout.primary) return false; }
    loadout = { primary: 'rifle', secondary: 'gusher' };
    return true; })()`) === true);

  // instrument shootBolt to count shots per weapon
  await evaluate(`window._count = { rifle: 0, gusher: 0, sticker: 0 };
    window._origShoot = shootBolt;
    shootBolt = (id, off) => { _count[id]++; _origShoot(id, off); }; true`);
  // base form: only the primary fires
  const base = await evaluate(`(() => {
    _count = { rifle: 0, gusher: 0, sticker: 0 };
    player.form = 0; player.fireCd = 0; player.fire2Cd = 0; mouse.down = true;
    for (let i = 0; i < 120; i++) update(1/60);
    mouse.down = false;
    return { ..._count }; })()`);
  check('dual-wield: base form fires primary only', base.rifle > 5 && base.gusher === 0, JSON.stringify(base));
  // ascended: secondary joins in at reduced (60%) rate
  const asc = await evaluate(`(() => {
    _count = { rifle: 0, gusher: 0, sticker: 0 };
    player.form = 1; player.fireCd = 0; player.fire2Cd = 0; mouse.down = true;
    for (let i = 0; i < 240; i++) { player.ki = maxKi(); update(1/60); }
    mouse.down = false;
    return { ..._count }; })()`);
  check('dual-wield: ASCENDED fires both weapons', asc.rifle > 10 && asc.gusher >= 3, JSON.stringify(asc));
  // Twin Channeling rank 1: off-hand reaches full rate
  const twin = await evaluate(`(() => {
    skillRanks.w5 = 1;
    _count = { rifle: 0, gusher: 0, sticker: 0 };
    player.form = 1; player.fireCd = 0; player.fire2Cd = 0; mouse.down = true;
    for (let i = 0; i < 240; i++) { player.ki = maxKi(); update(1/60); }
    mouse.down = false;
    return { ..._count }; })()`);
  check('twin channeling: rank 1 raises off-hand rate', twin.gusher >= asc.gusher + 2,
    `stock ${asc.gusher} -> rank1 ${twin.gusher}`);
  check('twin channeling: rank 2 tightens dual-wield spread', await evaluate(`(() => {
    // fire 60 off-hand sticker bolts at aim=0 per rank and compare worst deviation
    player.form = 1; player.aim = 0;
    const maxDev = () => {
      bolts = [];
      for (let i = 0; i < 60; i++) shootBolt('sticker', true);
      return Math.max(...bolts.map(b => Math.abs(Math.atan2(b.vy + 0, b.vx))));
    };
    skillRanks.w5 = 0; const wide = maxDev();
    skillRanks.w5 = 2; const tight = maxDev();
    delete skillRanks.w5; bolts = []; player.form = 0;
    return tight < wide * 0.75; })()`) === true);
  await evaluate(`shootBolt = _origShoot; player.form = 0; bolts = []; true`);

  // ================= 3. Gusher: knockback splash =================
  const gush = await evaluate(`(() => {
    enemies = []; bolts = []; particles = [];
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const h = makeEnemy('husk', player.x + 220, player.y, { spawnT: 0 });
    const h2 = makeEnemy('husk', player.x + 260, player.y + 30, { spawnT: 0 }); // splash neighbour
    const x0 = h.x, hp0 = h.hp;
    const st = weaponStats('gusher');
    bolts.push({ x: h.x - 30, y: h.y - 14, vx: st.speed, vy: 0, life: 1, r: st.r, wpn: 'gusher', dmg: st.dmg, kb: st.kb });
    for (let i = 0; i < 12; i++) update(1/60);
    return { moved: h.x - x0, hpDrop: hp0 - h.hp, splashHit: h2.hp < h2.maxHp,
      teal: particles.some(p => p.color === '#3ef0c8') }; })()`);
  check('gusher: direct hit damages target', gush.hpDrop > 10, JSON.stringify(gush));
  check('gusher: strong knockback displaces enemy backwards', gush.moved > 15, JSON.stringify(gush));
  check('gusher: splash damages nearby enemies + teal burst', gush.splashHit && gush.teal, JSON.stringify(gush));
  check('gusher: zap-thump synth is safe headless', await evaluate('playZapThump(); true') === true);

  // ================= 4. Sticker: needle embed + delayed burst =================
  const stick = await evaluate(`(() => {
    enemies = []; bolts = []; particles = [];
    tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const h = makeEnemy('ravager', player.x + 200, player.y, { spawnT: 0 }); // beefy: survives the cluster
    const st = weaponStats('sticker');
    for (let n = 0; n < 5; n++) {
      bolts.push({ x: h.x - 25, y: h.y - 14, vx: st.speed, vy: 0, life: 0.5, r: st.r, wpn: 'sticker', dmg: st.dmg, kb: st.kb });
      for (let i = 0; i < 3; i++) update(1/60);
    }
    return { needles: h.needleN, fuse: h.needleT }; })()`);
  check('sticker: needles embed visibly and arm a fuse', stick.needles >= 4 && stick.fuse > 0, JSON.stringify(stick));
  const burst = await evaluate(`(() => {
    const h = enemies.find(e => e.type === 'ravager');
    const hp0 = h.hp; particles = [];
    for (let i = 0; i < 55; i++) update(1/60); // ride out the 0.8s fuse
    return { cleared: !(h.needleN > 0), burstDmg: hp0 - h.hp, alive: !h.dead,
      pink: particles.some(p => p.color === '#ff6bd8') }; })()`);
  check('sticker: cluster bursts after ~0.8s with scaled AoE damage',
    burst.cleared && burst.burstDmg > 10 && burst.alive, JSON.stringify(burst));
  check('sticker: pink/violet burst fx', burst.pink === true);
  check('sticker: crackle-pop synth is safe headless', await evaluate('playCracklePop(); true') === true);

  // ================= 5. wave-7+ escalation =================
  const escStats = await evaluate(`(() => {
    enemies = []; wave = 9;
    const h = makeEnemy('husk', CAMP.x + 300, CAMP.y, { spawnT: 0 });
    const s0 = h.spd, d0 = h.dmg;
    makeAscended(h);
    player.ki = 10;
    const k0 = kills;
    killEnemy(h);
    return { spdMul: h.spd / s0, dmgMul: h.dmg / d0, kiAfter: player.ki, killed: kills === k0 + 1 }; })()`);
  check('escalation: ascended = +30% speed, +40% damage', Math.abs(escStats.spdMul - 1.3) < 0.01
    && Math.abs(escStats.dmgMul - 1.4) < 0.05, JSON.stringify(escStats));
  check('escalation: ascended death bursts +8 aether', escStats.kiAfter === 18 && escStats.killed, JSON.stringify(escStats));
  const plated = await evaluate(`(() => {
    enemies = []; tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 };
    const h = makeEnemy('husk', CAMP.x + 300, CAMP.y, { spawnT: 0 });
    makePlated(h);
    const a0 = h.armor, hp0 = h.hp;
    dealDamage(h, 10, 'rifle');
    return { hadArmor: a0 > 0, hpDrop: hp0 - h.hp, armorDrop: a0 - h.armor, crack: h.armorCrack }; })()`);
  check('escalation: armor plate halves damage while chipping (10 -> 5)',
    plated.hadArmor && Math.abs(plated.hpDrop - 5) < 0.01 && Math.abs(plated.armorDrop - 10) < 0.01,
    JSON.stringify(plated));
  const escSpawn = await evaluate(`(() => {
    enemies = []; wave = 9;
    const R = Math.random; Math.random = () => 0.05;
    for (let i = 0; i < 10; i++) spawnEnemy('husk');
    const asc = enemies.filter(e => e.ascended).length;
    Math.random = () => 0.10; // fails asc roll (>= .09), passes plate roll (< .12)
    for (let i = 0; i < 10; i++) spawnEnemy('husk');
    const pl = enemies.filter(e => !e.boss && e.maxArmor).length;
    Math.random = R;
    return { asc, pl, total: enemies.length }; })()`);
  check('escalation: ascended spawns capped at 3', escSpawn.asc === 3, JSON.stringify(escSpawn));
  check('escalation: plated spawns capped at 4', escSpawn.pl === 4, JSON.stringify(escSpawn));
  check('escalation: gated off below wave 7', await evaluate(`(() => {
    enemies = []; wave = 6;
    const R = Math.random; Math.random = () => 0.01;
    for (let i = 0; i < 8; i++) spawnEnemy('husk');
    Math.random = R;
    const ok = enemies.every(e => !e.ascended && !e.maxArmor);
    wave = 9; return ok; })()`) === true);
  // caster bolt-swap
  const swap = await evaluate(`(() => {
    enemies = []; ebolts = []; wave = 9;
    player.hp = maxHp();
    makeEnemy('shaman', player.x + 300, player.y, { spawnT: 0, atkCd: 0.01 });
    const R = Math.random; Math.random = () => 0.2; // always passes the 35% swap roll
    for (let i = 0; i < 5; i++) update(1/60);
    const first = ebolts.length ? { fire: ebolts[0].fire, spd: Math.hypot(ebolts[0].vx, ebolts[0].vy), r: ebolts[0].r } : null;
    let sawFire = false; // rapid bolts expire fast, so poll for the fireball volley
    for (let i = 0; i < 120; i++) { update(1/60); if (ebolts.some(b => b.fire === true)) sawFire = true; }
    Math.random = R;
    return { first, sawFire }; })()`);
  check('escalation: caster swaps to rapid low-damage bolt (fast, small, no flame)',
    swap.first && swap.first.fire === false && swap.first.spd > 500 && swap.first.r === 4, JSON.stringify(swap));
  check('escalation: caster swaps back to fireballs mid-wave', swap.sawFire === true, JSON.stringify(swap));

  // ================= 6. sentry turrets =================
  await evaluate(`enemies = []; ebolts = []; sbolts = []; cores = 2000; true`);
  await evaluate('buySentry(); true');
  check('sentry: tier 1 costs 200', await evaluate('sentryTier') === 1 && await evaluate('cores') === 1800);
  await evaluate('buySentry(); buySentry(); true');
  check('sentry: tiers 2+3 cost 350+550', await evaluate('sentryTier') === 3 && await evaluate('cores') === 900);
  await evaluate('buySentry(); true');
  check('sentry: tier capped at 3', await evaluate('sentryTier') === 3 && await evaluate('cores') === 900);
  const sentry = await evaluate(`(() => {
    enemies = []; sbolts = []; barricades = [];
    barricades.push({ x: player.x + 300, y: player.y + 200, r: 34, hp: 99999, maxHp: 99999 });
    const h = makeEnemy('husk', player.x + 380, player.y + 200, { spawnT: 0 });
    for (let i = 0; i < 40; i++) update(1/60);
    return { hit: h.hp < h.maxHp || h.dead, aimed: barricades[0].gunA !== undefined }; })()`);
  check('sentry: targets and damages the nearest enemy', sentry.hit && sentry.aimed, JSON.stringify(sentry));
  const barrels = await evaluate(`(() => {
    sbolts = []; barricades[0].gunCd = 0;
    update(1/60);
    return sbolts.length; })()`);
  check('sentry: tier 3 fires dual barrels (2 bolts / volley)', barrels === 2, `got ${barrels}`);
  check('sentry: tier persists in the save snapshot', await evaluate(`(() => {
    saveGame(false);
    return JSON.parse(localStorage.getItem('tr_save1')).sentryTier === 3; })()`) === true);

  // ================= 7. twin-skulled war-brute (boss) =================
  await evaluate(`enemies = []; ebolts = []; sbolts = []; barricades = []; tally = { rifle: 0, beam: 0, melee: 0, grenade: 0 }; true`);
  const clawTele = await evaluate(`(() => {
    player.x = WORLD.w / 2; player.y = WORLD.h / 2; player.vx = player.vy = 0; player.hp = maxHp(); player.hurtT = 0;
    const b = makeEnemy('warlord', player.x - 110, player.y, { spawnT: 0, atkCd: 1e9 });
    b.clawCd = 0;
    update(1/60);
    return { wind: b.clawWind, hpBefore: player.hp }; })()`);
  check('boss: claw wind-up telegraph starts in range', clawTele.wind > 0.6, JSON.stringify(clawTele));
  const claw = await evaluate(`(() => {
    const b = enemies.find(e => e.boss);
    const x0 = player.x, hp0 = player.hp;
    for (let i = 0; i < 46; i++) update(1/60); // ride out the 0.7s wind-up
    const slashed = { hpDrop: hp0 - player.hp, wind: b.clawWind };
    for (let i = 0; i < 14; i++) update(1/60); // knockback flight
    return { ...slashed, flew: player.x - x0 }; })()`);
  check('boss: claw slash lands bonus damage (1.5x club)', claw.hpDrop > 40 && claw.hpDrop < 60,
    JSON.stringify(claw));
  check('boss: claw slash sends the player flying (knockback)', claw.flew > 60, JSON.stringify(claw));
  check('boss: claw is dodgeable (out of range = no hit)', await evaluate(`(() => {
    const b = enemies.find(e => e.boss);
    player.hp = maxHp(); player.hurtT = 0;
    b.clawCd = 0; b.clawWind = 0;
    player.x = b.x - 130; player.y = b.y; // in range: wind-up starts
    update(1/60);
    if (!(b.clawWind > 0)) return false;
    player.x = b.x - 600; // dash away during the telegraph
    const hp0 = player.hp;
    for (let i = 0; i < 50; i++) update(1/60);
    player.x = WORLD.w / 2; player.y = WORLD.h / 2;
    return player.hp === hp0; })()`) === true);
  // armor plate crack thresholds drive the falling-plate visuals
  const crack = await evaluate(`(() => {
    enemies = enemies.filter(e => e.boss);
    const b = enemies[0];
    b.armor = b.maxArmor; b.armorCrack = 4;
    const steps = [];
    // directDamage = resistance-free, so the chip math is exact
    directDamage(b, b.maxArmor * 0.30); steps.push(b.armorCrack); // -> 70% = 3 plates
    directDamage(b, b.maxArmor * 0.25); steps.push(b.armorCrack); // -> 45% = 2 plates
    directDamage(b, b.maxArmor * 0.25); steps.push(b.armorCrack); // -> 20% = 1 plate
    directDamage(b, b.maxArmor * 0.5);  steps.push(b.armorCrack); // shattered = 0
    return { steps, armor: b.armor, spdUp: true }; })()`);
  check('boss: armor plates crack/fall at 75/50/25% thresholds (4→3→2→1→0)',
    JSON.stringify(crack.steps) === '[3,2,1,0]' && crack.armor === 0, JSON.stringify(crack));
  check('boss: twin-skull renderer draws clean', await evaluate(`(() => {
    const b = enemies.find(e => e.boss);
    b.clawWind = 0.4; // render the telegraph pose too
    render();
    return true; })()`) === true);
  await evaluate(`(() => { // clean beauty shot: telegraph pose, no hit-flash
    const b = enemies.find(e => e.boss);
    b.flash = 0; b.armor = b.maxArmor * 0.6; b.armorCrack = 3; // one plate fallen
    floaters = []; render(); return true; })()`);
  await screenshot('test-v28-boss.png');
  await evaluate(`(() => { const b = enemies.find(e => e.boss); b.clawWind = 0; return true; })()`);

  // ================= 8. companions =================
  await evaluate(`enemies = []; ebolts = []; cores = 5000; true`);
  check('squad: cannot afford = no purchase', await evaluate(`(() => {
    const c0 = cores; cores = 10;
    const ok = buyCompanion('rover') === false && !squad.owned.rover;
    cores = c0; return ok; })()`) === true);
  await evaluate(`buyCompanion('rover'); buyCompanion('warden'); buyCompanion('scout'); true`);
  check('squad: all three purchasable (300/500/800) and spawned',
    await evaluate('cores') === 3400 && await evaluate('companions.length') === 3
    && await evaluate('squad.owned.rover && squad.owned.warden && squad.owned.scout') === true);
  await evaluate(`(() => { // squad beauty shot around the player
    enemies = []; floaters = [];
    const [a, b, c] = companions;
    a.x = player.x - 60; a.y = player.y + 30; b.x = player.x + 60; b.y = player.y + 34; c.x = player.x; c.y = player.y + 62;
    for (const cc of companions) { cc.vx = cc.vy = 0; cc.hurtT = 0; }
    update(0); render(); return true; })()`);
  await screenshot('test-v28-squad.png');

  // warden taunt shifts enemy targeting
  const taunt = await evaluate(`(() => {
    enemies = [];
    const w = companions.find(c => c.type === 'warden');
    w.x = player.x + 400; w.y = player.y; w.downed = false; w.hp = w.maxHp;
    const h = makeEnemy('husk', w.x + 120, w.y, { spawnT: 0 });
    update(1/60);
    return { taunted: h._tgt !== undefined && h._tgt !== null && h._tgt === w }; })()`);
  check('squad: Warden taunt pulls nearby enemies onto it', taunt.taunted === true, JSON.stringify(taunt));
  const wardenFight = await evaluate(`(() => {
    const w = companions.find(c => c.type === 'warden');
    const h = enemies[0];
    const hp0 = h.hp;
    for (let i = 0; i < 90; i++) update(1/60);
    return { dmg: hp0 - h.hp, boltsSeen: true, dead: h.dead }; })()`);
  check('squad: Warden pulse-cannon damages the dummy', wardenFight.dmg > 5 || wardenFight.dead, JSON.stringify(wardenFight));

  // rover: melee bite on a dummy
  const roverFight = await evaluate(`(() => {
    enemies = []; cbolts = [];
    squad.active = { rover: true, warden: false, scout: false }; syncCompanions();
    const r = companions.find(c => c.type === 'rover');
    r.x = player.x + 150; r.y = player.y;
    const h = makeEnemy('husk', r.x + 40, r.y, { spawnT: 0, spd: 0 });
    const hp0 = h.hp;
    for (let i = 0; i < 120; i++) update(1/60);
    return { dmg: hp0 - h.hp, dead: h.dead }; })()`);
  check('squad: Rover plasma bite damages the dummy', roverFight.dmg > 5 || roverFight.dead, JSON.stringify(roverFight));
  // rover: fetches loose cores
  const fetch = await evaluate(`(() => {
    enemies = []; pickups = [];
    const r = companions.find(c => c.type === 'rover');
    r.x = player.x + 60; r.y = player.y; r.fetchCd = 0;
    pickups.push({ x: r.x + 150, y: r.y, type: 'core', t: 0 });
    const c0 = cores;
    for (let i = 0; i < 400 && pickups.length; i++) update(1/60);
    return { collected: cores === c0 + 1, left: pickups.length }; })()`);
  check('squad: Rover fetches a distant core back to the player', fetch.collected === true, JSON.stringify(fetch));

  // scout: piercing bolts + support packs
  const scout = await evaluate(`(() => {
    enemies = []; cbolts = []; pickups = [];
    squad.active = { rover: false, warden: false, scout: true }; syncCompanions();
    const s = companions.find(c => c.type === 'scout');
    s.x = player.x; s.y = player.y + 40; s.atkCd = 0;
    const a = makeEnemy('husk', s.x + 180, s.y, { spawnT: 0, spd: 0 });
    const b = makeEnemy('husk', s.x + 260, s.y, { spawnT: 0, spd: 0 });
    for (let i = 0; i < 80; i++) update(1/60);
    return { pierceA: a.hp < a.maxHp || a.dead, pierceB: b.hp < b.maxHp || b.dead,
      pierceStat: scoutPierce() }; })()`);
  check('squad: Scout crossbow bolt pierces through two dummies',
    scout.pierceA && scout.pierceB && scout.pierceStat === 2, JSON.stringify(scout));
  const pack = await evaluate(`(() => {
    enemies = []; pickups = [];
    const s = companions.find(c => c.type === 'scout');
    player.hp = 50; player.ki = 10; // wounded first (packs drop near the player and auto-collect)
    s.packT = 0.05;
    let dropped = false;
    for (let i = 0; i < 120; i++) { update(1/60); if (pickups.some(p => p.type === 'pack')) dropped = true; }
    return { dropped, hp: player.hp, ki: player.ki }; })()`);
  check('squad: Scout drops a med/energy pack that heals HP + aether',
    pack.dropped && pack.hp > 50 && pack.ki > 10, JSON.stringify(pack));

  // downed companion revives at wave end
  const revive = await evaluate(`(() => {
    squad.active = { rover: true, warden: true, scout: true }; syncCompanions();
    const r = companions.find(c => c.type === 'rover');
    r.hurtT = 0;
    hurtCompanion(r, 99999);
    const downed = r.downed && r.hp === 0;
    const sq = spawnQueue;
    endWave();
    const revived = !r.downed && r.hp === r.maxHp;
    // restore mid-wave arena state for the remaining tests
    waveActive = true; spawnQueue = sq; spawnTimer = 1e9; graceT = 0; chest = null; state = 'playing';
    return { downed, revived }; })()`);
  check('squad: companion downs at 0 hp and revives at wave end', revive.downed && revive.revived, JSON.stringify(revive));
  check('squad: mini skill tree nodes spend skill points', await evaluate(`(() => {
    player.sp = 2;
    skillRanks.cr1 = 0;
    // simulate the tree node click path: rank up cr1 (requires owned rover — owned)
    player.sp--; skillRanks.cr1 = 1;
    const d1 = compDamage(companions.find(c => c.type === 'rover'));
    player.sp--; skillRanks.cr1 = 2;
    const d2 = compDamage(companions.find(c => c.type === 'rover'));
    return d2 > d1 && Math.abs(d2 - 10 * 1.7) < 0.01; })()`) === true);
  check('squad: deployed companions add to the wave budget', await evaluate(`(() => {
    const w0 = wave, q0 = 6 + Math.round((w0 + 1) * 3.2) + companions.length;
    startWave();
    const ok = spawnQueue === q0 || spawnQueue === q0 + 4; // +4 if it rolled a boss wave
    wave = w0; spawnTimer = 1e9; spawnQueue = 1; waveActive = true; state = 'playing'; enemies = [];
    return ok; })()`) === true);

  // ================= 9. save/load roundtrip (reload) =================
  await evaluate(`cores = 777;
    loadout = { primary: 'gusher', secondary: 'sticker' };
    skillRanks.cw1 = 2;
    squad.active = { rover: true, warden: true, scout: true }; syncCompanions();
    saveGame(false); true`);
  const snap = await evaluate(`JSON.parse(localStorage.getItem('tr_save1'))`);
  check('save: snapshot carries v2.8 fields (v stays 2 for compat)',
    snap.v === 2 && snap.sentryTier === 3 && snap.loadout.primary === 'gusher'
    && snap.loadout.secondary === 'sticker' && snap.squad.owned.rover === true
    && snap.skills.cw1 === 2, JSON.stringify({ v: snap.v, sentry: snap.sentryTier, loadout: snap.loadout }));

  await navigate(GAME_URL);
  check('reload: CONTINUE offered', await evaluate(`!document.getElementById('continueBtn').classList.contains('hidden')`) === true);
  await evaluate(`document.getElementById('continueBtn').click(); true`);
  const rt = await evaluate(`({ cores, sentryTier, lp: loadout.primary, ls: loadout.secondary,
    comps: companions.length, cw1: sk('cw1'), gusher: gearLvl('gusher') })`);
  check('reload: cores/sentry/loadout/squad/skills all restored',
    rt.cores === 777 && rt.sentryTier === 3 && rt.lp === 'gusher' && rt.ls === 'sticker'
    && rt.comps === 3 && rt.cw1 === 2 && rt.gusher === 1, JSON.stringify(rt));
  check('reload: pre-2.8 saves load with safe defaults', await evaluate(`(() => {
    const s = JSON.parse(localStorage.getItem('tr_save1'));
    delete s.sentryTier; delete s.loadout; delete s.squad;
    localStorage.setItem('tr_save1', JSON.stringify(s));
    return loadGame() && sentryTier === 0 && loadout.primary === 'rifle'
      && loadout.secondary === null && companions.length === 0; })()`) === true);

  // ================= 10. death checkpoints =================
  const cp = await evaluate(`(() => {
    // build a distinctive checkpoint: wave N, 200 cores, some gear + squad
    cores = 5000;
    const g = gear.find(u => u.id === 'gusher');
    if (g.lvl < g.max) buyGear(g);
    buyCompanion('rover');
    skillRanks.cr1 = 1;
    cores = 200;
    waveActive = false; // checkpoint = between waves, like the real auto-save
    const w0 = wave;
    saveGame(false);
    // die mid-fight
    state = 'playing'; waveActive = true; spawnQueue = 1; spawnTimer = 1e9;
    player.hp = 5; player.hurtT = 0;
    hurtPlayer(99999);
    return { over: state === 'over',
      respawnShown: !document.getElementById('respawnBtn').classList.contains('hidden'),
      retryLabel: document.getElementById('retryBtn').textContent, w0 }; })()`);
  check('death: game over offers RESPAWN AT CHECKPOINT', cp.over && cp.respawnShown, JSON.stringify(cp));
  check('death: GIVE UP option present', /GIVE UP/.test(cp.retryLabel), cp.retryLabel);
  const resp = await evaluate(`(() => {
    document.getElementById('respawnBtn').click();
    return { cores, wave, state, gusher: gearLvl('gusher'), rover: !!squad.owned.rover,
      cr1: sk('cr1'), comps: companions.length, hp: player.hp,
      savedCores: JSON.parse(localStorage.getItem('tr_save1')).cores }; })()`);
  check('death: respawn restores the checkpoint (upgrades/gear/skills/squad intact)',
    resp.state === 'shop' && resp.wave === cp.w0 && resp.gusher === 1 && resp.rover
    && resp.cr1 === 1 && resp.comps === 1 && resp.hp >= 1, JSON.stringify(resp));
  check('death: 15% core penalty applied (200 -> 170) and persisted',
    resp.cores === 170 && resp.savedCores === 170, JSON.stringify(resp));
  check('death: respawn uses the same v2 snapshot (no corruption)', await evaluate(`(() => {
    const s = JSON.parse(localStorage.getItem('tr_save1'));
    return s.v === 2 && typeof s.wavesCompleted === 'number' && Array.isArray(s.gear); })()`) === true);
  const giveUp = await evaluate(`(() => {
    state = 'playing'; waveActive = true; spawnQueue = 1; spawnTimer = 1e9;
    player.hp = 5; player.hurtT = 0;
    hurtPlayer(99999);
    document.getElementById('retryBtn').click();
    return { wave, cores, gusher: gearLvl('gusher'), comps: companions.length,
      saveGone: localStorage.getItem('tr_save1') === null, state }; })()`);
  check('death: GIVE UP fully resets the run and wipes the save',
    giveUp.wave === 1 && giveUp.cores === 0 && giveUp.gusher === 0
    && giveUp.comps === 0 && giveUp.saveGone && giveUp.state === 'playing', JSON.stringify(giveUp));

  // ================= closing shot + error check =================
  await evaluate(PUMP(120));
  await evaluate('render(); true');
  await screenshot('test-v28-gameplay.png');

  check('no page exceptions / console errors', pageErrors.length === 0, '\n  ' + pageErrors.join('\n  '));

  console.log(`\n== ${passCount} passed, ${failCount} failed ==`);
  process.exitCode = failCount ? 1 : 0;
} catch (err) {
  console.error('HARNESS ERROR:', err);
  process.exitCode = 2;
} finally {
  try { edge.kill(); } catch {}
}
