// Remove the standalone ledger history UI while preserving Home, edit histories and all data modules.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync(0,'utf8');
const nextBuild=process.argv[2]??'remove-history-97-20261122',previousBuild=process.argv[3]??'payroll-retry-96-20261122',assetTag=process.argv[4]??'history97',metadataPath=process.argv[5]??'/tmp/edumoney-remove-history-patch.json';
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<source.length;p++){const c=source[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return{start,end:p+1,value:JSON.parse(source.slice(start,p+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value,baselineURLs=Object.keys(routes),renamed=new Map(),cache=new Map();
let count=0;
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!mime.includes('javascript'))continue;
 if(!cache.has(hash)){
  const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
  if(/},\s*(?:820|1122)\s*,\s*\[/.test(raw)){
   const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true),edits=[];
   const all=(root,pred)=>{const found=[];function walk(n){if(pred(n))found.push(n);ts.forEachChild(n,walk);}walk(root);return found;};
   const prop=(obj,name)=>obj.properties.find(p=>p.name?.text===name);
   const replace=(node,value)=>edits.push({start:node.getStart(sf),end:node.end,value});
   for(const st of sf.statements){const call=st.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));if(![820,1122].includes(id))continue;const factory=call.arguments[0];
    if(id===820){
     const state=all(factory,n=>ts.isCallExpression(n)&&n.expression.getText(sf).includes('.useState')&&n.arguments[0]?.getText(sf).includes('history')&&n.arguments[0]?.getText(sf).includes('categories'))[0];if(!state||!ts.isConditionalExpression(state.arguments[0]))throw Error('Ledger section initializer missing');const initial=state.arguments[0].whenTrue.getText(sf);replace(state.arguments[0],`(${initial})==='categories'?'categories':'summary'`);
     const page=all(factory,n=>ts.isConditionalExpression(n)&&n.condition.getText(sf).includes('history')&&n.whenTrue.getText(sf).includes('Filtrar historial')&&n.whenTrue.getText(sf).includes('.MovementRows'))[0];if(!page)throw Error('Standalone history page missing');replace(page,'null');
     const option=all(factory,n=>ts.isArrayLiteralExpression(n)&&n.elements.length===2&&n.elements[0].text==='history'&&n.elements[1].text==='Historial')[0];if(!option||!ts.isArrayLiteralExpression(option.parent))throw Error('History section option missing');replace(option.parent,'['+option.parent.elements.filter(e=>e!==option).map(e=>e.getText(sf)).join(',')+']');
     const detail=all(factory,n=>ts.isCallExpression(n)&&n.arguments[1]&&ts.isObjectLiteralExpression(n.arguments[1])&&prop(n.arguments[1],'title')?.initializer?.text==='Detalle de la transacción')[0];if(!detail)throw Error('Legacy history details missing');let conditional=detail.parent;while(conditional&&!ts.isConditionalExpression(conditional))conditional=conditional.parent;if(!conditional)throw Error('History detail condition missing');replace(conditional,'null');
    }else{const item=all(factory,n=>ts.isObjectLiteralExpression(n)&&prop(n,'label')?.initializer?.text==='Historial')[0];if(!item||!ts.isArrayLiteralExpression(item.parent))throw Error('History menu item missing');replace(item.parent,'['+item.parent.elements.filter(e=>e!==item).map(e=>e.getText(sf)).join(',')+']');}
    count++;
   }
   for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
  }
  if(out===raw)cache.set(hash,null);else{const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');cache.set(hash,h);}
 }
 const h=cache.get(hash);if(!h)continue;routes[url]=[h,mime];const next=/-[a-f0-9]{32}\.js$/.test(url)?url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`):url.replace(/\.js$/,`-${assetTag}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(count<2)throw Error('Missing ledger/menu patches');
let grew=true;const textCache=new Map();const readHash=h=>{if(!textCache.has(h))textCache.set(h,z.gunzipSync(Buffer.from(content[h],'base64')).toString());return textCache.get(h);};
while(grew){grew=false;const names=[...renamed.keys()].map(u=>u.split('/').pop());for(const url of baselineURLs){if(!url.endsWith('.js')||/^\/(?:sw|register-sw)(?:[-.]|$)/.test(url)||renamed.has(url))continue;const raw=readHash(routes[url][0]);if(names.some(n=>raw.includes(n))){renamed.set(url,url.replace(/\.js$/,`-${assetTag}.js`));grew=true;}}}
const replacements=new Map();for(const [old,next]of renamed){replacements.set(old,next);replacements.set(old.split('/').pop(),next.split('/').pop());}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp([...replacements.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'g'),replacementCache=new Map();
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 if(!replacementCache.has(hash)){const raw=readHash(hash),out=raw.replace(pattern,s=>replacements.get(s));let h=hash;if(out!==raw){h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');}replacementCache.set(hash,h);}
 routes[url]=[replacementCache.get(hash),mime];if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const read=p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString();const save=(p,data)=>{const h=crypto.createHash('sha256').update(data).digest('hex');content[h]=z.gzipSync(data,{level:9}).toString('base64');routes[p]=[h,routes[p][1]];};
const sw=read('/sw.js').replace(/const CACHE='[^']+'/,`const CACHE='edumoney-shell-${nextBuild}'`);for(const p of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(p))save(p,sw);
save('/index.html',read('/index.html').replace(previousBuild,nextBuild));
const used=new Set(Object.values(routes).map(([hash])=>hash)),surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const h of Object.keys(content))if(!used.has(h)&&!surrounding.includes(h))delete content[h];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.writeFileSync(site+'/dist/server/index.js',out);fs.writeFileSync(metadataPath,JSON.stringify({modules:[820,1122],count,renamed:[...renamed]}));console.log(JSON.stringify({modules:[820,1122],count,renamed:renamed.size,output:out.length}));
