const {Buffer}=require('node:buffer');const fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('/workspace/sites/edumoney-web/worker/index.js','utf8'),sf=ts.createSourceFile('worker.js',source,ts.ScriptTarget.Latest,true),dict={};for(const st of sf.statements)for(const d of st.declarationList?.declarations??[])if(['ROUTES','CONTENT'].includes(d.name.getText(sf)))dict[d.name.getText(sf)]=JSON.parse(d.initializer.getText(sf));
const registry=new Map(),seen=new Set();for(const [url,[hash,mime]]of Object.entries(dict.ROUTES)){assert(dict.CONTENT[hash],'Missing asset '+url);if(!mime.includes('javascript')||seen.has(hash))continue;seen.add(hash);try{vm.runInNewContext(z.gunzipSync(Buffer.from(dict.CONTENT[hash],'base64')).toString(),{__d:(f,id,deps)=>registry.set(id,{f,deps}),window:{},self:{},global:{}},{timeout:500});}catch{/* Entrypoints require a browser after registering their factories. */}}
function preservedModules(){
 const prior=fs.readFileSync('/tmp/edumoney-live88-worker.js','utf8');
 function obj(name){const start=prior.indexOf('const '+name+'=')+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<prior.length;p++){const c=prior[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(prior.slice(start,p+1));}throw Error(name);}
 const routes=obj('ROUTES'),content=obj('CONTENT'),before=new Map(),seen=new Set();
 for(const [,[hash,mime]]of Object.entries(routes)){if(!mime.includes('javascript')||seen.has(hash))continue;seen.add(hash);try{vm.runInNewContext(z.gunzipSync(Buffer.from(content[hash],'base64')).toString(),{__d:(f,id)=>before.set(id,f.toString())},{timeout:500});}catch{}}
 const renamed=JSON.parse(fs.readFileSync('/tmp/edumoney-capture-account-patch.json','utf8')).renamed;
 for(const [id,text]of before){if([821,834,945,952,959,962].includes(id))continue;let normalized=text;for(const [old,next]of renamed)normalized=normalized.split(old).join(next).split(old.split('/').pop()).join(next.split('/').pop());assert.equal(registry.get(id)?.f.toString(),normalized,'Unrelated module '+id);}
 assert.equal(source.slice(0,source.indexOf('const ROUTES=')),prior.slice(0,prior.indexOf('const ROUTES=')));
 console.log('Server and all unrelated module factories preserved.');
}
preservedModules();
const read=p=>z.gunzipSync(Buffer.from(dict.CONTENT[dict.ROUTES[p][0]],'base64')).toString();
for(const [p,[hash,mime]]of Object.entries(dict.ROUTES)){if(mime.includes('javascript'))new vm.Script(z.gunzipSync(Buffer.from(dict.CONTENT[hash],'base64')).toString(),{filename:p});}
for(const id of [821,945,952,962]){const code=registry.get(id).f.toString();assert(code.includes('__account.selector'));assert(code.includes('__account.confirmed()'));}
const sw=read('/sw.js');assert(sw.includes('edumoney-shell-capture-89-20261122'));for(const p of JSON.parse(/const ASSETS=(\[[^;]+\]);/.exec(sw)[1]))assert(dict.ROUTES[p]);for(const p of Object.keys(dict.ROUTES))if(/^\/sw(?:-.*)?\.js$/.test(p))assert.equal(read(p),sw);assert(read('/register-sw.js').includes("register('/sw.js'"));assert(read('/index.html').includes('capture-89-20261122'));
console.log('All JavaScript assets parse; four capture forms confirm scope; canonical registration, aliases and precache valid.');
