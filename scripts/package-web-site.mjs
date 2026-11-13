import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
const site = '/workspace/sites/edumoney-web';
function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]); }
const types = { '.html': 'text/html;charset=utf-8', '.js': 'application/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const routes = {}, content = {};
for (const path of files('dist-web')) { const data = readFileSync(path), hash = createHash('sha256').update(data).digest('hex'); content[hash] ??= gzipSync(data).toString('base64'); routes['/' + path.slice('dist-web/'.length)] = [hash, types[extname(path)] ?? 'application/octet-stream']; }
const handler = readFileSync('web-server/sync.mjs', 'utf8');
const worker = `${handler}\nconst ROUTES=${JSON.stringify(routes)};const CONTENT=${JSON.stringify(content)};export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/sync')return handleSync(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});let asset=ROUTES[url.pathname==='/'?'/index.html':url.pathname];if(!asset&&request.headers.get('Accept')?.includes('text/html'))asset=ROUTES['/index.html'];if(!asset)return new Response('No encontrado',{status:404});const [hash,type]=asset;const bytes=Uint8Array.from(atob(CONTENT[hash]),c=>c.charCodeAt(0));const body=request.method==='HEAD'?null:new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(body,{headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':type.startsWith('text/html')||url.pathname==='/sw.js'?'no-cache':'public,max-age=3600','Permissions-Policy':'microphone=(),camera=(self)'}});}};`;
mkdirSync(join(site, 'worker'), { recursive: true }); writeFileSync(join(site, 'worker/index.js'), worker);
mkdirSync(join(site, 'dist/server'), { recursive: true }); writeFileSync(join(site, 'dist/server/index.js'), worker);
mkdirSync(join(site, 'dist/.openai'), { recursive: true }); cpSync(join(site, '.openai/hosting.json'), join(site, 'dist/.openai/hosting.json'));
console.log(`Worker empaquetado: ${worker.length} caracteres, ${Object.keys(routes).length} archivos, sin datos personales.`);
