import { expect, it } from 'vitest';
import { handleSync } from '../web-server/sync.mjs';
const access = 'a'.repeat(64);
const encrypted = JSON.stringify({ format: 'EduMoney-encrypted-backup', version: 1, cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: 600000, salt: 'a'.repeat(32), iv: 'b'.repeat(24), ciphertext: 'c'.repeat(64) });
function bucket() {
  const rows = new Map<string, { bytes: Uint8Array; tag: string; meta?: Record<string, string> }>(); let version = 0;
  return { rows, async get(key: string) { const row = rows.get(key); return row ? { body: new Blob([new Uint8Array(row.bytes)]).stream(), httpEtag: row.tag, customMetadata: row.meta } : null; }, async put(key: string, data: Uint8Array | string, options: { onlyIf: Headers; customMetadata?: Record<string, string> }) { const row = rows.get(key); const match = options.onlyIf.get('If-Match'); if (match && row?.tag !== match || options.onlyIf.get('If-None-Match') === '*' && row) return null; const tag = `"${(++version).toString(16)}"`; rows.set(key, { bytes: typeof data === 'string' ? new TextEncoder().encode(data) : data, tag, meta: options.customMetadata }); return { httpEtag: tag }; } };
}
function req(method = 'GET', extra: Record<string, string> = {}, body?: string) { return new Request('https://edumoney.test/api/sync', { method, headers: { Authorization: `Bearer ${access}`, ...extra }, body }); }
it('rechaza solicitudes sin secreto y de otro origen', async () => {
  const env = { BUCKET: bucket() }; expect((await handleSync(new Request('https://edumoney.test/api/sync'), env)).status).toBe(401); expect((await handleSync(req('GET', { Origin: 'https://otro.test' }), env)).status).toBe(403);
});
it('guarda únicamente una copia cifrada y la recupera con versión', async () => {
  const env = { BUCKET: bucket() }; const put = await handleSync(req('PUT', { 'If-None-Match': '*' }, encrypted), env); expect(put.status).toBe(204); const get = await handleSync(req(), env); expect(await get.text()).toBe(encrypted); expect(get.headers.get('ETag')).toBe(put.headers.get('ETag')); expect(get.headers.get('Cache-Control')).toBe('no-store');
});
it('evita sobrescrituras concurrentes y rechaza contenido sin cifrar', async () => {
  const env = { BUCKET: bucket() }; expect((await handleSync(req('PUT', { 'If-None-Match': '*' }, JSON.stringify({ salary: 1000 })), env)).status).toBe(400); expect((await handleSync(req('PUT', { 'If-None-Match': '*' }, JSON.stringify({ ...JSON.parse(encrypted), salary: 1000 })), env)).status).toBe(400); expect((await handleSync(req('PUT', { 'If-None-Match': '*' }, 'null'), env)).status).toBe(400); expect(env.BUCKET.rows.size).toBe(0);
  const first = await handleSync(req('PUT', { 'If-None-Match': '*' }, encrypted), env); const tag = first.headers.get('ETag')!;
  expect((await handleSync(req('PUT', { 'If-Match': tag }, encrypted), env)).status).toBe(204); expect((await handleSync(req('PUT', { 'If-Match': tag }, encrypted), env)).status).toBe(412);
});
it('elimina la copia de forma condicional y deja el enlace retirado', async () => {
  const env = { BUCKET: bucket() }; const first = await handleSync(req('PUT', { 'If-None-Match': '*' }, encrypted), env);
  expect((await handleSync(req('DELETE', { 'If-Match': first.headers.get('ETag')! }), env)).status).toBe(204); expect((await handleSync(req(), env)).status).toBe(410);
});
