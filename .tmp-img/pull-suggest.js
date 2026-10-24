const fs = require('fs');
const path =
  'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/agent-transcripts/a840435d-eb1f-4c40-8138-c782e5fe4af8/a840435d-eb1f-4c40-8138-c782e5fe4af8.jsonl';

function extractText(msg) {
  const c = msg?.message?.content;
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c
    .map((p) => (p && p.type === 'text' ? p.text || '' : ''))
    .join('\n');
}

const lines = fs.readFileSync(path, 'utf8').split(/\n/);
const want = [
  /suggest/i,
  /hide.*(learn|adapt|panel)/i,
  /one.?tap|one tap/i,
  /ghost|preview.*wall|link.*preview/i,
  /combat sync/i,
  /store.*(2\.6|still)|Play.*(2\.6|behind)|closed track/i,
  /gone now|revive.*gone|squad revive/i,
  /accident|wrote back|write.?back|re-?added|brought back/i,
  /CHANNEL|github channel|update banner/i,
  /build.?able city|movable.*button|button style/i,
  /fusion|skeleton|bulwark/i,
  /2\.9\.[0-9]|2\.8\.[0-9]|APP_VERSION/i,
];

const out = [];
lines.forEach((line, idx) => {
  if (!line.trim()) return;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return;
  }
  if (o.role !== 'assistant') return;
  const t = extractText(o);
  if (!t || t.length < 80) return;
  if (!want.some((r) => r.test(t))) return;
  // focus later chat (feature dense) — lines 540+
  if (idx + 1 < 540 && !/gone now|suggest|hide|store|channel|2\.9/i.test(t))
    return;
  out.push('==== ASST L' + (idx + 1) + ' ====\n' + t.slice(0, 3500) + '\n');
});
fs.writeFileSync(
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img/audit_suggestions.txt',
  out.join('\n')
);
console.log('blocks', out.length, 'chars', out.join('').length);
