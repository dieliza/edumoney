const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
function worker(file){const source=fs.readFileSync(file,'utf8');function obj(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<source.length;p++){const c=source[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(source.slice(start,p+1));}throw Error(name);}const routes=obj('ROUTES'),content=obj('CONTENT');return{source,routes,read:p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString()};}
const before=worker('/tmp/edumoney-live84-worker.js'),after=worker('/workspace/sites/edumoney-web/worker/index.js');
assert.equal(before.source.slice(0,before.source.indexOf('const ROUTES=')),after.source.slice(0,after.source.indexOf('const ROUTES=')));
let checked=0;
for(const p of Object.keys(before.routes)){
 if(!p.includes('__common-'))continue;
 const old=new Map(),now=new Map();for(const [map,w]of [[old,before],[now,after]])vm.runInNewContext(w.read(p),{__d:(f,id,deps)=>map.set(id,{f,deps})},{timeout:1000});
 for(const [id,rec]of old){if(id!==797){assert.equal(now.get(id)?.f.toString(),rec.f.toString(),'Unrelated module '+id);continue;}
 const module={exports:{}};const react={useState:()=>[undefined,()=>{}],useEffect:()=>{}};const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const f=now.get(id);const dep=n=>{const actual=f.deps[n];if(actual===13)return react;if(actual===7)return jsx;if(actual===792)return{useTheme:()=>({colors:{}})};if(actual===789)return{fixed:{}};return new Proxy({__esModule:true,default:'component'},{get:(o,k)=>k in o?o[k]:'component'});};
 f.f({},dep,dep,dep,module,module.exports, f.deps.map((_,i)=>i));
 const rendered=module.exports.Sheet({title:'Nueva transacción',close(){}});assert.equal(rendered.props.children.props.enabled,false);assert.equal(typeof module.exports.Field,'function');checked++;
 }
}
assert(checked>0);const html=after.read('/index.html');assert(html.includes('/register-sw.js?build=keyboard-85-20261122'));assert(after.read('/register-sw.js').includes("register('/sw.js'"));const sw=after.read('/sw.js');assert(sw.includes("CACHE='edumoney-shell-keyboard-85-20261122'"));for(const p of JSON.parse(/const ASSETS=(\[[^;]+\]);/.exec(sw)[1]))assert(after.routes[p],p);for(const p of Object.keys(after.routes))if(/^\/sw(?:-.*)?\.js$/.test(p))assert.equal(after.read(p),sw);assert(sw.includes('push'));assert(sw.includes('notificationclick'));
console.log(`Verified ${checked} sheet aliases render; all unrelated factories/server preserved; canonical updates and precache valid.`);
