// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live79-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const defs=[
 [831,'src/modules/money/MovementForm.tsx',{'../documents/paymentRecognition':957,'./entryContext':958,'../../ui/saveFeedback':802,'./TransactionHistory':1145,'expo-router':790,'../../ui/DateField':853,'./CategoryPicker':1147,'../../core/errors':799,react:13,'react-native':{'ActivityIndicator':229,'Pressable':246,'View':110},'../../core/id':803,'../../core/money':814,'../../ui/components':796,'./domain':813,'./fields':797,'./store':815,'./types':830,'react/jsx-runtime':7}],
 [1147,'src/modules/money/CategoryPicker.tsx',{'../../ui/saveFeedback':802,'../../ui/WheelPicker':1148,react:13,'./domain':813,'./entryContext':958,'./categoryLabels':837,'../../core/id':803,'../../core/errors':799,'../../ui/components':796,'./fields':797,'./localStore':798,'react/jsx-runtime':7}],
 [892,'src/modules/business/BusinessLedgerScreen.tsx',{react:13,'react-native':{Image:179},'expo-router':790,'../../core/errors':799,'../../ui/components':796,'../money/fields':797,'../money/localStore':798,'../money/domain':813,'../documents/localStore':835,'../tax/types':898,'./ledgerStore':899,'./ledgerDomain':900,'./BusinessEntryForm':893,'./BusinessReceiptForm':894,'./BusinessReserveForm':895,'./BusinessExportForm':896,'react/jsx-runtime':7}],
 [815,'src/modules/money/store.ts',{'../tax/guideStore':1116,'../../storage/changeEvents':871,'../../core/errors':799,'./repository':816,'../../core/money':814,'./domain':813}],
];
const surgical=new Set([813,820,931,1145,936,840,833]);
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map();
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));const spec=defs.find(v=>v[0]===id);if(!spec&&!surgical.has(id))continue;
 const oldFactory=call.arguments[0].getText(sf),oldDeps=call.arguments[2].getText(sf);
 if(!spec){let factory=oldFactory;const exportName=call.arguments[0].parameters[5].getText(sf);
 if(id===813){factory=factory.replace(/!([a-zA-Z_$][\w$]*)\.deletedAt&&\1\.date\.startsWith/g,"!$1.deletedAt&&$1.useKind!=='business'&&$1.date.startsWith");factory=factory.slice(0,-1)+`;${exportName}.commercialCategory=kind=>({id:'edumoney-commercial-'+kind,name:'Comercial',kind,archived:false});}`;}
 if(id===820||id===931)factory=factory.replace(/\.snapshot\(\)/g,'.snapshot(true)');
 if(id===1145)factory=factory.replace(/documents:null,data:await ([a-zA-Z_$][\w$]*)\.snapshot\(\)/g,'documents:null,data:await $1.snapshot(true)');
 if(id===936||id===840)factory=factory.replace(/!([a-zA-Z_$][\w$]*)\.deletedAt&&/g,"!$1.deletedAt&&$1.useKind!=='business'&&");
 if(id===833)factory=factory.slice(0,-1)+`;const original=${exportName}.classifyVoiceEntry;${exportName}.classifyVoiceEntry=function(...args){const p=original(...args);return /\\bcomercial\\b/i.test(args[0])||p.category?.id.startsWith('edumoney-commercial-')||p.category?.name.trim().toLocaleLowerCase('es')==='comercial'?{...p,ready:false,reasons:[...p.reasons,'Para Comercial, abre Gastos / Ingresos, elige la categoría Comercial y confirma tu DBA o LLC.']}:p;};}`;
 if(factory===oldFactory)throw Error('No change for '+id);
 edits.push({start:statement.getStart(sf),end:statement.end,value:`__d(${factory},${id},${oldDeps});`});patched.push(id);continue;
 }
 const [,file,map]=spec;
 let built=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const requires=[...built.matchAll(/require\("([^"]+)"\)/g)].map(m=>m[1]);for(const dep of requires)if(map[dep]===undefined)throw Error('Unmapped '+file+':'+dep);
 const mapped=Object.fromEntries(requires.map(dep=>[dep,map[dep]]));
 const requireBody=`const ids=${JSON.stringify(mapped)};function require(name){if(!(name in ids))throw Error('Unknown dependency '+name);const id=ids[name];if(typeof id==='object')return Object.fromEntries(Object.entries(id).map(([name,id])=>[name,r(id).default]));return r(id);}`;
 let factory;
 if(id===815){built=built.replaceAll('new DuplicateMovementError()', 'new LegacyDuplicateError()');factory=`__d(function(g,r,i,a,module,exports,d){(${oldFactory})(g,r,i,a,module,exports,d);${requireBody}const LegacyDuplicateError=exports.DuplicateMovementError;const updated={};(function(require,module,exports){${built}})(require,{exports:updated},updated);exports.MoneyStore.prototype.snapshot=updated.MoneyStore.prototype.snapshot;exports.MoneyStore.prototype.saveCommercial=updated.MoneyStore.prototype.saveCommercial;},${id},${oldDeps});`;}
 else factory=`__d(function(g,r,i,a,module,exports,d){${requireBody}\n${built}\n},${id},${JSON.stringify([...new Set(Object.values(mapped).flatMap(v=>typeof v==='object'?Object.values(v):[v]))])});`;
 edits.push({start:statement.getStart(sf),end:statement.end,value:factory});patched.push(id);
 }
 if(!edits.length)continue;let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(new Set(patched).size!==11)throw Error('Expected eleven module IDs: '+patched);
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-commercial20261122.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 if(url==='/sw.js')out=out.replace(/edumoney-shell-[a-zA-Z0-9-]+/g,'edumoney-shell-commercial-20261122');
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
