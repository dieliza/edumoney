// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live85-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map();
const hook=ts.transpileModule(fs.readFileSync('src/ui/useSheetViewport.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText.split('\n').filter(line=>!line.startsWith('exports.')&&!line.startsWith('Object.defineProperty')).join('\n').replace('const react_1 = require("react");','const react_1 = C;').replace('"use strict";','');
for(const [url,[hash,mime]] of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d'||![797,1148,831].includes(Number(call.arguments[1]?.getText(sf))))continue;
 const id=Number(call.arguments[1].getText(sf)),original=call.arguments[0].getText(sf);let factory=original;
 const change=(old,next)=>{if(!factory.includes(old))throw Error('Missing patch '+id+' '+old);factory=factory.replace(old,next);};
 if(id===797){
  const marker=factory.indexOf('const react_1 = C;');if(marker<0)throw Error('Viewport hook missing');factory=factory.slice(0,marker)+hook+'}';
  change("maxHeight:'92%',alignSelf:'center'","maxHeight:'100%',height:'100%',minHeight:0,alignSelf:'center'");
  change('tabIndex:0,keyboardDismissMode:', 'testID:"sheet-scroll",tabIndex:0,keyboardDismissMode:');
  change("style:{flexShrink:1,width:'100%',borderRadius:24}","style:{flexShrink:1,flex:1,minHeight:0,width:'100%',borderRadius:24}");
  change('R.Card,{style:{gap:16}', 'R.Card,{style:{gap:10,padding:12}');
  change('minHeight:50,borderWidth:P?', 'minHeight:D?44:50,borderWidth:P?');
 }
 if(id===1148){
  change('const c=48','const c=44');
  factory=factory.replace(/top:96/g,'top:44').replace(/height:96\+/g,'height:44+');
  change('height:240','height:132');change("display:'grid',gap:7", "display:'grid',gap:4");
  change('(e*c,u.length)', '(e*c,u.length,c)');change('(e.scrollTop,u.length)', '(e.scrollTop,u.length,c)');change('(e.scrollTop,R.current.length)', '(e.scrollTop,R.current.length,c)');
  const start=factory.indexOf(',(0,i.jsx)(t.Body,{muted:!0,style:{fontSize:12,lineHeight:17},children:');if(start<0)throw Error('Wheel hint missing');const end=factory.indexOf('})',start)+2;factory=factory.slice(0,start)+factory.slice(end);
 }
 if(id===831){
  change('setError((0, errors_1.userMessage)(e));',"setError((0, errors_1.userMessage)(e)==='Usa un importe decimal con hasta dos decimales'?'Escribe el importe.':(0, errors_1.userMessage)(e));");
  change('setAmount(v); setDuplicate(false);',"setAmount(v); setError(''); setDuplicate(false);");
 }
 edits.push({start:call.arguments[0].getStart(sf),end:call.arguments[0].end,value:factory});patched.push(id);
 }
 if(!edits.length)continue;let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(!patched.length)throw Error('No sheet patched');
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||/^\/(?:sw|register-sw)(?:[-.]|$)/.test(url)||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-compact86.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const read=p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString();
const save=(p,data)=>{const h=crypto.createHash('sha256').update(data).digest('hex');content[h]=z.gzipSync(data,{level:9}).toString('base64');routes[p]=[h,routes[p][1]];};
const sw=read('/sw.js').replace(/const CACHE='[^']+'/,"const CACHE='edumoney-shell-compact-86-20261122'");
for(const p of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(p))save(p,sw);
save('/index.html',read('/index.html').replace('keyboard-85-20261122','compact-86-20261122'));
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
