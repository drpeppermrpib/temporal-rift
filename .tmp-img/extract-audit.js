const fs = require('fs');
const path = require('path');

const base =
  'C:/Users/drpep/.cursor/projects/c-Users-drpep-cursor-agents-videogamemakes/agent-transcripts';
const chats = [
  'a840435d-eb1f-4c40-8138-c782e5fe4af8',
  '1a69c006-dfda-4453-b468-8b8556dbfcad',
  '5f0415cb-8eb0-4488-a450-8da6d1bab7fc',
  '15a7205d-7a42-4b16-ae4e-cce67229f15c',
  '658af4a8-774e-4b4e-a108-2ed31f49d30c',
  'afb7e78d-dcd4-4c96-ac0b-3c5cf668cf7c',
  'f0dd909c-b928-4929-8253-12f99412e8eb',
];
const outDir =
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img';

function extractText(msg) {
  const c = msg?.message?.content;
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c
    .map((p) => {
      if (!p || typeof p !== 'object') return String(p);
      if (p.type === 'text') return p.text || '';
      if (p.type === 'tool_use') {
        const n = p.name || '';
        const inp = p.input || {};
        if (['Write', 'StrReplace'].includes(n))
          return `[tool:${n} path=${inp.path || ''}]`;
        return `[tool:${n} ${JSON.stringify(inp).slice(0, 160)}]`;
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
    .trim();
}

const keywords =
  /removed|missing|bug|crash|revive|HUD|beam|multiplayer|PeerJS|learning|hide panel|aether|barricade|companion|vibration|save|update banner|channel|beta|accidental|revert|gone|OnePlus|Evolution|phone|Android|WebView|Capacitor|write.?back|regression|don't bring|do not bring|bring back|don't add|remove|store|2\.\d/i;

for (const chat of chats) {
  const p = path.join(base, chat, chat + '.jsonl');
  if (!fs.existsSync(p)) {
    console.log('missing', chat);
    continue;
  }
  const lines = fs.readFileSync(p, 'utf8').split(/\n/);
  const users = [];
  const assists = [];
  const hits = [];
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      return;
    }
    const role = o.role;
    const text = strip(extractText(o));
    if (role === 'user') {
      if (
        !text ||
        text.includes('HARD THINKING audit') ||
        text.includes('ProgressReportingInstructions')
      )
        return;
      if (text.length > 40) users.push([idx + 1, text.slice(0, 6000)]);
      if (keywords.test(text))
        hits.push(['USER', idx + 1, text.slice(0, 1200)]);
    } else if (role === 'assistant') {
      if (text && !text.startsWith('[tool:')) {
        assists.push([idx + 1, text.slice(0, 3500)]);
        if (keywords.test(text))
          hits.push(['ASST', idx + 1, text.slice(0, 1200)]);
      }
    }
  });
  const out = path.join(outDir, 'audit_extract_' + chat.slice(0, 8) + '.txt');
  let w =
    '=== CHAT ' +
    chat +
    ' users=' +
    users.length +
    ' assists=' +
    assists.length +
    ' ===\n\n';
  for (const [i, t] of users) w += '--- USER line ' + i + ' ---\n' + t + '\n\n';
  w += '\n===== KEYWORD HITS =====\n\n';
  for (const [role, i, t] of hits)
    w += '--- ' + role + ' line ' + i + ' ---\n' + t + '\n\n';
  w += '\n===== ALL ASSISTANT TEXT SNIPPETS =====\n\n';
  for (const [i, t] of assists)
    w += '--- ASST line ' + i + ' ---\n' + t + '\n\n';
  fs.writeFileSync(out, w);
  console.log(
    chat.slice(0, 8),
    'users',
    users.length,
    'assists',
    assists.length,
    'hits',
    hits.length
  );
}
