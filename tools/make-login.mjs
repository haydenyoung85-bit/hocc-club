#!/usr/bin/env node
// Creates (or adds to) admin/login.json: the website key, locked with an editor's email + password.
// Usage: node tools/make-login.mjs --email you@example.com --password-file pw.txt --token-file token.txt --out admin/login.json [--append]
// The token should be a GitHub fine-grained token for ONLY this repository with "Contents: Read and write".
// Never prints the token or the password.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => {
  if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return a;
}, []));
for (const k of ['email', 'password-file', 'token-file', 'out']) if (!args[k] || args[k] === true) { console.error('Missing --' + k); process.exit(1); }
const email = String(args.email).trim().toLowerCase();
const password = readFileSync(args['password-file'], 'utf8').replace(/\r?\n$/, '');
const token = readFileSync(args['token-file'], 'utf8').trim();
if (password.length < 12) { console.error('Password must be at least 12 characters'); process.exit(1); }
const { subtle } = globalThis.crypto;
const b64 = (u) => Buffer.from(u).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token)));
let out = { users: [] };
if (args.append && existsSync(args.out)) out = JSON.parse(readFileSync(args.out, 'utf8'));
out.users = (out.users || []).filter((u) => String(u.email).toLowerCase() !== email);
out.users.push({ email, salt: b64(salt), iv: b64(iv), data: b64(data) });
writeFileSync(args.out, JSON.stringify(out, null, 1) + '\n');
console.log('Wrote ' + args.out + ' with ' + out.users.length + ' editor(s): ' + out.users.map((u) => u.email).join(', '));
