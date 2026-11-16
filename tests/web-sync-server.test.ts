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
  const env = { BUCKET: bucket() }; const put = await handleSync(req('PUT', { 'If-None-Match': '*' }, encrypted), env); expect(put.status).toBe(204); const get = await handleSync(req(), env); expect(await get.text()).toBe(encrypted); expect(get.headers.get('ETag')).toBe(put.headers.get('ETag')); expect(get.headers.get('Cache-Control')).toBe('no-store, no-transform');
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
it('separa las copias por secreto aunque la aplicación se abra sin identidad ChatGPT',async()=>{
 const env={BUCKET:bucket()};await handleSync(req('PUT',{'If-None-Match':'*'},encrypted),env);
 const other=await handleSync(req('GET',{Authorization:`Bearer ${'b'.repeat(64)}`}),env);expect(other.status).toBe(404);
 expect((await handleSync(req(),env)).status).toBe(200);expect(env.BUCKET.rows.size).toBe(1);
});
it('acepta respaldos con fotos de varios MB sin desbordar la pila y conserva la versión',async()=>{
 const env={BUCKET:bucket()};const large=JSON.stringify({...JSON.parse(encrypted),ciphertext:'ab'.repeat(4*1024*1024)});
 const put=await handleSync(req('PUT',{'If-None-Match':'*'},large),env);expect(put.status).toBe(204);const get=await handleSync(req(),env);expect(await get.text()).toBe(large);expect(get.headers.get('ETag')).toBe(put.headers.get('ETag'));
});
it('rechaza un carácter inválido al final de un respaldo grande sin borrar la copia existente',async()=>{
 const env={BUCKET:bucket()};const first=await handleSync(req('PUT',{'If-None-Match':'*'},encrypted),env);const malformed=JSON.stringify({...JSON.parse(encrypted),ciphertext:'ab'.repeat(4*1024*1024)+'zz'});const rejected=await handleSync(req('PUT',{'If-Match':first.headers.get('ETag')!},malformed),env);expect(rejected.status).toBe(400);expect(await (await handleSync(req(),env)).text()).toBe(encrypted);
});

it('acepta la revisión W/ de clientes existentes manteniendo la comparación atómica de la copia',async()=>{
 const env={BUCKET:bucket()};const first=await handleSync(req('PUT',{'If-None-Match':'*'},encrypted),env);const tag=first.headers.get('ETag')!;
 const get=await handleSync(req(),env);expect(get.headers.get('X-EduMoney-Sync-Version')).toBe(tag);
 const second=await handleSync(req('PUT',{'If-Match':'W/'+tag},encrypted),env);expect(second.status).toBe(204);expect(second.headers.get('X-EduMoney-Sync-Version')).toBe(second.headers.get('ETag'));
 expect((await handleSync(req('PUT',{'If-Match':'W/'+tag},encrypted),env)).status).toBe(412);
 expect((await handleSync(req('DELETE',{'If-Match':'W/'+tag}),env)).status).toBe(412);
 expect((await handleSync(req('DELETE',{'If-Match':'W/'+second.headers.get('ETag')}),env)).status).toBe(204);
});
it('no convierte comodines, listas ni revisiones mal formadas en autorización para reemplazar',async()=>{
 const env={BUCKET:bucket()};await handleSync(req('PUT',{'If-None-Match':'*'},encrypted),env);
 for(const tag of ['*','W/*','W/W/"1"','W/"1", "2"','W/1','"bad/value"'])expect((await handleSync(req('PUT',{'If-Match':tag},encrypted),env)).status).toBe(428);
 expect(await (await handleSync(req(),env)).text()).toBe(encrypted);
});
