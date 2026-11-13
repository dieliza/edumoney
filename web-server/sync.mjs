const MAX = 16 * 1024 * 1024;
const reply = (message, status) => new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function handleSync(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return reply('Origen no permitido.', 403);
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization') ?? '');
  if (!match) return reply('Código de acceso requerido.', 401);
  if (!env.BUCKET) return reply('Sincronización no configurada.', 503);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1]))), b => b.toString(16).padStart(2, '0')).join('');
  const key = `encrypted-sync/${hash}`;
  if (request.method === 'GET') {
    const object = await env.BUCKET.get(key); if (!object) return reply('No hay copia sincronizada.', 404);
    if (object.customMetadata?.deleted === '1') return reply('Este enlace fue eliminado. Crea otro enlace para sincronizar.', 410);
    return new Response(object.body, { headers: { 'Content-Type': 'application/json', ETag: object.httpEtag, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
  if (!['PUT', 'DELETE'].includes(request.method)) return reply('Método no permitido.', 405);
  const ifMatch = request.headers.get('If-Match'), create = request.headers.get('If-None-Match') === '*';
  if ((!ifMatch && !create) || (ifMatch && !/^"[a-fA-F0-9-]+"$/.test(ifMatch))) return reply('Se requiere una versión para evitar sobrescrituras.', 428);
  const onlyIf = new Headers(ifMatch ? { 'If-Match': ifMatch } : { 'If-None-Match': '*' });
  if (request.method === 'DELETE') {
    if (!ifMatch) return reply('Se requiere la versión actual.', 428);
    const result = await env.BUCKET.put(key, '', { onlyIf, customMetadata: { deleted: '1' } });
    return result ? new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }) : reply('La copia cambió. Vuelve a revisarla.', 412);
  }
  if (Number(request.headers.get('Content-Length')) > MAX) return reply('Copia demasiado grande.', 413);
  const reader = request.body?.getReader(); if (!reader) return reply('Falta la copia cifrada.', 400);
  const chunks = []; let length = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > MAX) { await reader.cancel(); return reply('Copia demasiado grande.', 413); } chunks.push(value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let payload; try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply('Formato cifrado no válido.', 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).sort().join(',') !== ['format','version','cipher','kdf','iterations','salt','iv','ciphertext'].sort().join(',') || payload.format !== 'EduMoney-encrypted-backup' || payload.version !== 1 || payload.cipher !== 'AES-256-GCM' || payload.kdf !== 'PBKDF2-SHA256' || payload.iterations !== 600000 || !/^[a-f0-9]{32}$/.test(payload.salt) || !/^[a-f0-9]{24}$/.test(payload.iv) || typeof payload.ciphertext !== 'string' || !/^[a-f0-9]{32,}$/.test(payload.ciphertext) || payload.ciphertext.length % 2) return reply('Solo se aceptan copias cifradas de EduMoney.', 400);
  const result = await env.BUCKET.put(key, bytes, { onlyIf, httpMetadata: { contentType: 'application/json' } });
  return result ? replyWithTag(result.httpEtag) : reply('Otro dispositivo cambió la copia. Sincroniza y revisa los cambios.', 412);
}
function replyWithTag(etag) { return new Response(null, { status: 204, headers: { ETag: etag, 'Cache-Control': 'no-store' } }); }
