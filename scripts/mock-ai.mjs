#!/usr/bin/env node
/**
 * CLOUD4SAYA — local dev stubs for optional external services.
 *
 * The backend talks to a few services that are optional in production but
 * block some flows locally:
 *   • http://127.0.0.1:3001/predict        → incident severity prediction
 *   • http://127.0.0.1:8000/analyze-audio  → incident audio classification
 *   • smtp://localhost:1025                 → outbound email (incident notifs)
 *
 * Running this stub lets the full "report incident" flow work offline and lets
 * `npm run seed:demo` create incidents.
 *
 * Usage:  node scripts/mock-ai.mjs      (or: npm run mock:ai)
 * Then run the backend with MAIL_HOST=localhost MAIL_PORT=1025 (the `local`
 * profile already defaults to that).
 */
import http from 'node:http';
import net from 'node:net';

// ─── HTTP AI stubs ───────────────────────────────────────────────────────────
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];
const pickSeverity = (text = '') => {
  const t = text.toLowerCase();
  if (/fire|incend|gaz|smoke|fumée|effond|court-circuit|électrocu/.test(t)) return 'HIGH';
  if (/leak|fuite|panne|bloqué|cass|broken|water|eau|ascenseur/.test(t)) return 'MEDIUM';
  return SEVERITIES[Math.floor(Math.random() * 2)];
};

const readBody = (req) => new Promise((resolve) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b));
});

function serveHttp(port, name, handler) {
  http.createServer(async (req, res) => {
    let payload = {};
    try { const b = await readBody(req); payload = b ? JSON.parse(b) : {}; } catch { /* non-json */ }
    const out = handler(payload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
    console.log(`[${name}:${port}] ${req.method} ${req.url} -> ${JSON.stringify(out)}`);
  }).listen(port, '127.0.0.1', () => console.log(`mock ${name} on http://127.0.0.1:${port}`));
}

serveHttp(3001, 'predict', (p) => ({
  severity: pickSeverity(`${p.description || ''} ${p.type || ''}`),
  confidence: 0.7 + Math.random() * 0.25, source: 'mock',
}));
serveHttp(8000, 'analyze-audio', () => ({ label: 'Glass breaking', confidence: 0.62, source: 'mock' }));

// ─── SMTP sink (accepts and discards mail) ───────────────────────────────────
net.createServer((sock) => {
  const send = (line) => sock.write(line + '\r\n');
  send('220 localhost CLOUD4SAYA dev mail sink');
  sock.setEncoding('utf8');
  let inData = false;
  sock.on('data', (chunk) => {
    for (const raw of chunk.split(/\r?\n/)) {
      if (raw === '' && !inData) continue;
      if (inData) { if (raw === '.') { inData = false; send('250 OK: queued'); } continue; }
      const cmd = raw.slice(0, 4).toUpperCase();
      if (cmd === 'EHLO' || cmd === 'HELO') send('250 localhost');
      else if (cmd === 'MAIL') send('250 OK');
      else if (cmd === 'RCPT') send('250 OK');
      else if (cmd === 'DATA') { send('354 End data with <CR><LF>.<CR><LF>'); inData = true; }
      else if (cmd === 'QUIT') { send('221 Bye'); sock.end(); }
      else if (cmd === 'RSET') send('250 OK');
      else if (cmd === 'NOOP') send('250 OK');
      else send('250 OK');
    }
  });
  sock.on('error', () => {});
}).listen(1025, '127.0.0.1', () => console.log('mock SMTP sink on smtp://127.0.0.1:1025'));

console.log('Press Ctrl+C to stop.');
