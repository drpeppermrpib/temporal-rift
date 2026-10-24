const fs = require('fs');
const path = require('path');

const mainPath =
  'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/agent-transcripts/a840435d-eb1f-4c40-8138-c782e5fe4af8/a840435d-eb1f-4c40-8138-c782e5fe4af8.jsonl';

function extractText(msg) {
  const c = msg?.message?.content;
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c
    .map((p) => {
      if (!p || typeof p !== 'object') return '';
      if (p.type === 'text') return p.text || '';
      if (p.type === 'tool_use') {
        const n = p.name || '';
        const inp = p.input || {};
        if (n === 'Task')
          return `[Task: ${(inp.description || '').slice(0, 80)} | prompt_head=${String(inp.prompt || '').slice(0, 400)}]`;
        if (['Write', 'StrReplace'].includes(n))
          return `[${n}:${inp.path || ''}]`;
        return `[${n}]`;
      }
      return '';
    })
    .join('\n');
}

function strip(t) {
  return t
    .replace(/<timestamp>[\s\S]*?<\/timestamp>\s*/g, '')
    .replace(/<\/?user_query>\s*/g, '')
    .replace(/<system_reminder>[\s\S]*?<\/system_reminder>\s*/g, '')
    .replace(/<image_files>[\s\S]*?<\/image_files>/g, '[Image]')
    .replace(/<open_subagent_context>[\s\S]*?<\/open_subagent_context>/g, '')
    .trim();
}

const lines = fs.readFileSync(mainPath, 'utf8').split(/\n/);
const keyLines = new Set([
  103, 171, 220, 236, 250, 358, 375, 542, 547, 580, 583, 609, 625, 639, 651,
  658, 666, 671, 674, 680, 684, 688,
]);

const out = [];
const patterns =
  /\b(remov|take out|gone|bring back|don'?t|accident|revert|missing|bug|crash|phone|android|oneplus|evolution|webview|capacitor|revive|hide|learning|beam|barricade|aether|companion|multiplayer|peer|vibration|hud|map|store|2\.\d|write.?back|regression|pending|suggest)/i;

lines.forEach((line, idx) => {
  if (!line.trim()) return;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return;
  }
  const n = idx + 1;
  const text = strip(extractText(o));
  if (!text) return;
  if (o.role === 'user' && (keyLines.has(n) || patterns.test(text))) {
    if (text.startsWith('Perform any necessary')) return;
    if (text.includes('HARD THINKING')) return;
    out.push(`\n#### USER L${n}\n${text.slice(0, 2500)}\n`);
  }
  if (o.role === 'assistant' && patterns.test(text)) {
    // keep substantive assistant conclusions
    const head = text.slice(0, 2000);
    if (
      /shipped|added|fixed|removed|restore|v2\.|version|gone|missing|suggest|pending|still|apk|release|beta/i.test(
        head
      )
    ) {
      out.push(`\n#### ASST L${n}\n${head}\n`);
    }
  }
});

const dest =
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img/audit_deep_hits.txt';
fs.writeFileSync(dest, out.join(''));
console.log('wrote', out.length, 'blocks', 'chars', out.join('').length);

// Also dump full key user messages
const fullKey = [];
lines.forEach((line, idx) => {
  if (!keyLines.has(idx + 1)) return;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return;
  }
  if (o.role !== 'user') return;
  fullKey.push(`\n==== FULL USER L${idx + 1} ====\n${strip(extractText(o))}\n`);
});
fs.writeFileSync(
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img/audit_key_users_full.txt',
  fullKey.join('')
);
console.log('full key users', fullKey.length);
