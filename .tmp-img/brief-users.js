const fs = require('fs');
const t = fs.readFileSync(
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img/audit_extract_a840435d.txt',
  'utf8'
);
const parts = t.split(/^--- USER line /m).slice(1);
const briefs = [];
for (const part of parts) {
  const nl = part.indexOf('\n');
  const line = part.slice(0, nl).replace(/ ---$/, '').trim();
  let body = part.slice(nl + 1);
  const end = body.search(/\n--- USER line |\n===== KEYWORD/);
  if (end >= 0) body = body.slice(0, end);
  body = body.trim().replace(/\s+/g, ' ');
  if (
    body.startsWith('Perform any necessary') ||
    body.startsWith('Briefly inform') ||
    body.includes('<open_subagent_context>') && body.length < 80
  )
    continue;
  briefs.push('L' + line + ': ' + body.slice(0, 320));
}
fs.writeFileSync(
  'C:/Users/drpep/.cursor/agents/videogamemakes/temporal-rift/.tmp-img/audit_user_briefs.txt',
  briefs.join('\n\n')
);
console.log('briefs', briefs.length);
console.log(briefs.join('\n\n').slice(0, 8000));
