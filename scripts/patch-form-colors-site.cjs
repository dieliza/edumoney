// v93 -> v94: only named button colors in the transaction form; preserve posting services.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync(0,'utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<source.length;p++){const c=source[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return{start,end:p+1,value:JSON.parse(source.slice(start,p+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value,baselineURLs=Object.keys(routes),renamed=new Map(),cache=new Map();
const compiled=ts.transpileModule(fs.readFileSync('src/modules/money/MovementForm.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
let count=0;
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!mime.includes('javascript'))continue;
 if(!cache.has(hash)){
  const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
  if(/},\s*831\s*,\s*\[/.test(raw)){
   const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true),edits=[];
   for(const st of sf.statements){const call=st.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d'||call.arguments[1]?.getText(sf)!=='831')continue;
    let body;function visit(n){if(ts.isFunctionExpression(n)&&n.parameters.map(p=>p.name.getText(sf)).join(',')==='require,exports'&&n.body.getText(sf).includes('exports.MovementForm = MovementForm'))body=n.body;ts.forEachChild(n,visit);}visit(call.arguments[0]);if(!body)throw Error('Published MovementForm source missing');
    edits.push({start:body.getStart(sf),end:body.end,value:'{'+compiled+'}'});count++;
   }
   for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
  }
  if(out===raw)cache.set(hash,null);else{const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');cache.set(hash,h);}
 }
 const h=cache.get(hash);if(!h)continue;routes[url]=[h,mime];const next=/-[a-f0-9]{32}\.js$/.test(url)?url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`):url.replace(/\.js$/,'-colors94.js');routes[next]=routes[url];renamed.set(url,next);
}
if(!count)throw Error('No transaction form patched');
let grew=true;const textCache=new Map();const readHash=h=>{if(!textCache.has(h))textCache.set(h,z.gunzipSync(Buffer.from(content[h],'base64')).toString());return textCache.get(h);};
while(grew){grew=false;const names=[...renamed.keys()].map(u=>u.split('/').pop());for(const url of baselineURLs){if(!url.endsWith('.js')||/^\/(?:sw|register-sw)(?:[-.]|$)/.test(url)||renamed.has(url))continue;const raw=readHash(routes[url][0]);if(names.some(n=>raw.includes(n))){renamed.set(url,url.replace(/\.js$/,'-colors94.js'));grew=true;}}}
const replacements=new Map();for(const [old,next]of renamed){replacements.set(old,next);replacements.set(old.split('/').pop(),next.split('/').pop());}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp([...replacements.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'g'),replacementCache=new Map();
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 if(!replacementCache.has(hash)){const raw=readHash(hash),out=raw.replace(pattern,s=>replacements.get(s));let h=hash;if(out!==raw){h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');}replacementCache.set(hash,h);}
 routes[url]=[replacementCache.get(hash),mime];if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const read=p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString();const save=(p,data)=>{const h=crypto.createHash('sha256').update(data).digest('hex');content[h]=z.gzipSync(data,{level:9}).toString('base64');routes[p]=[h,routes[p][1]];};
const sw=read('/sw.js').replace(/const CACHE='[^']+'/,"const CACHE='edumoney-shell-form-colors-94-20261122'");for(const p of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(p))save(p,sw);
save('/index.html',read('/index.html').replace('form-account-93-20261122','form-colors-94-20261122'));
const used=new Set(Object.values(routes).map(([hash])=>hash)),surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const h of Object.keys(content))if(!used.has(h)&&!surrounding.includes(h))delete content[h];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.writeFileSync(site+'/dist/server/index.js',out);fs.writeFileSync('/tmp/edumoney-form-colors-patch.json',JSON.stringify({module:831,count,renamed:[...renamed]}));console.log(JSON.stringify({module:831,count,renamed:renamed.size,output:out.length}));
