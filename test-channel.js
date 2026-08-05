// Channel-gate test: loads the real game.js in a VM with a stub DOM and a
// mocked GitHub releases API that always reports a newer version (v99.9).
//   - default / TR_CHANNEL='github': update check must fire and the banner
//     must be revealed (classList.remove('hidden')).
//   - TR_CHANNEL='play': the GitHub API must never be queried and the banner
//     must stay hidden (Google Play policy: no out-of-store updates).
// Run: node test-channel.js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const gameSrc = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');

function makeCtx() { // permissive 2D-context stand-in: any method is a no-op
  return new Proxy({}, {
    get(t, p) { if (p in t) return t[p]; return (...a) => makeCtx(); },
    set(t, p, v) { t[p] = v; return true; },
  });
}

function makeEl(id) {
  const classes = new Set(id === 'updateBanner' ? ['hidden'] : []);
  const base = {
    id,
    style: new Proxy({}, { get: () => '', set: () => true }),
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      toggle: c => (classes.has(c) ? classes.delete(c) : classes.add(c)),
      contains: c => classes.has(c),
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    getContext: () => makeCtx(),
    textContent: '', innerHTML: '', value: '',
    children: [], dataset: {},
    appendChild(c) { return c; }, removeChild() {}, remove() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  return new Proxy(base, {
    get(t, p) { if (p in t) return t[p]; return () => undefined; },
    set(t, p, v) { t[p] = v; return true; },
  });
}

async function runScenario(channel) {
  const els = new Map();
  const el = id => { if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); };
  let apiCalled = false;

  const sandbox = {
    console, Math, JSON, Date, Promise, setTimeout, clearTimeout, setInterval, clearInterval,
    parseInt, parseFloat, isNaN, String, Number, Array, Object, RegExp, Error,
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    navigator: { maxTouchPoints: 0, userAgent: 'test' },
    location: { href: 'http://localhost/' },
    performance: { now: () => 0 },
    addEventListener: () => {}, removeEventListener: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    open: () => null,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: {
      getElementById: el,
      createElement: tag => makeEl('<' + tag + '>'),
      body: makeEl('<body>'),
      addEventListener: () => {}, removeEventListener: () => {},
      querySelectorAll: () => [], querySelector: () => null,
    },
    fetch: url => {
      if (String(url).includes('api.github.com')) apiCalled = true;
      return Promise.resolve({
        ok: true,
        json: async () => ({ tag_name: 'v99.9', html_url: 'https://example.com/rel' }),
      });
    },
  };
  if (channel) sandbox.TR_CHANNEL = channel;
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  try {
    vm.runInNewContext(gameSrc, sandbox, { filename: 'game.js' });
  } catch (e) {
    // Later game-init code may trip on the stub DOM; the version/update block
    // sits near the top of game.js, so the gate has already executed.
    console.log(`  (note: game.js init stopped later at: ${e.message})`);
  }
  await new Promise(r => setTimeout(r, 20)); // flush the fetch promise chain

  const banner = el('updateBanner');
  return { apiCalled, bannerShown: !banner.classList.contains('hidden') };
}

(async () => {
  let failed = false;
  const expect = (name, cond) => {
    console.log(`  ${cond ? 'PASS' : 'FAIL'}: ${name}`);
    if (!cond) failed = true;
  };

  console.log('Scenario 1: default (github channel), latest release v99.9');
  const gh = await runScenario(null);
  expect('GitHub API queried', gh.apiCalled);
  expect('update banner shown', gh.bannerShown);

  console.log("Scenario 2: TR_CHANNEL='play', latest release v99.9");
  const play = await runScenario('play');
  expect('GitHub API NOT queried', !play.apiCalled);
  expect('update banner stays hidden', !play.bannerShown);

  console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
  process.exit(failed ? 1 : 0);
})();
