// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live78-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const defs=[
 [794,'src/modules/business/BusinessScreen.tsx',{'react-native':110,react:13,'expo-router':790,'../../ui/components':796,'../money/fields':797,'../money/localStore':798,'../../core/errors':799,'./store':800,'./HolderForm':795,'./domain':801,'react/jsx-runtime':7}],
 [795,'src/modules/business/HolderForm.tsx',{'../../ui/saveFeedback':802,react:13,'../../core/id':803,'../../core/errors':799,'../../ui/components':796,'../money/fields':797,'./domain':801,'react/jsx-runtime':7}],
 [913,'src/modules/business/payroll/Route.tsx',{react:13,'../../../ui/components':796,'./Screen':914,'react/jsx-runtime':7}],
 [914,'src/modules/business/payroll/Screen.tsx',{react:13,'expo-router':790,'../../../ui/components':796,'../../money/fields':797,'../../../core/errors':799,'../../../core/id':803,'../../money/localStore':798,'../../money/domain':813,'../obligations/RecordForm':922,'./store':915,'./domain':916,'./catalog':917,'./types':918,'./forms':919,'./report':920,'./export':921,'react/jsx-runtime':7}],
];
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map();
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));const spec=defs.find(v=>v[0]===id);if(!spec)continue;const [,file,map]=spec;
 const built=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const requires=[];const builtAst=ts.createSourceFile(file,built,ts.ScriptTarget.Latest,true);function collect(n){if(ts.isCallExpression(n)&&n.expression.getText(builtAst)==='require'&&ts.isStringLiteral(n.arguments[0]))requires.push(n.arguments[0].text);ts.forEachChild(n,collect);}collect(builtAst);for(const dep of requires)if(map[dep]===undefined)throw Error('Unmapped '+file+':'+dep);
 const mapped=Object.fromEntries(requires.map(dep=>[dep,map[dep]]));
 const factory=`__d(function(g,r,i,a,module,exports,d){const ids=${JSON.stringify(mapped)};function require(name){if(!(name in ids))throw Error('Unknown dependency');const value=r(ids[name]);return name==='react-native'?{View:value.default}:value;}\n${built}\n},${id},${JSON.stringify([...new Set(Object.values(mapped))])});`;
 edits.push({start:statement.getStart(sf),end:statement.end,value:factory});patched.push(id);
 }
 if(!edits.length)continue;let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(new Set(patched).size!==4||patched.length!==4)throw Error('Expected four unique module replacements: '+patched);
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-business20261122.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 if(url==='/sw.js')out=out.replace(/edumoney-shell-[a-zA-Z0-9-]+/g,'edumoney-shell-business-20261122');
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
