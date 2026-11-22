// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync(0,'utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map(),cached=new Map();
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const built={projection:compile('src/ui/commercialHomeOverview.ts'),home:compile('src/ui/HomeBalancesAndCharts.tsx'),charts:compile('src/modules/money/ChartsScreen.tsx'),overview:compile('src/ui/TransactionOverview.tsx'),model:compile('src/ui/transactionOverviewModel.ts'),month:compile('src/ui/MonthControl.tsx'),budget:compile('src/modules/goals/MonthlyBudgetEditor.tsx')};
const ids={react:13,'react/jsx-runtime':7,'react-native':{View:110,Pressable:246,useWindowDimensions:270,ActivityIndicator:229,AppState:214},'expo-router':790,'expo-linear-gradient':836,'react-native-svg':937,'./components':796,'../../ui/components':796,'../design/ThemeProvider':792,'../../design/ThemeProvider':792,'../modules/money/domain':813,'../modules/money/transactionChartModel':936,'../modules/money/types':0,'../modules/business/ledgerDomain':900,'../modules/business/ledgerStore':899,'../core/money':814,'../modules/money/localStore':798,'../business/ledgerStore':899,'./localStore':798,'./domain':813,'./analysisModel':840,'../../ui/HistoryTrend':933,'../modules/money/fields':797,'../money/fields':797,'./fields':797,'../money/localStore':798,'../money/domain':813,'../../core/money':814,'../../core/errors':799,'../../ui/saveFeedback':802,'../../ui/HomeBalancesAndCharts':825};
const embeddedNames=new Set(['./transactionOverviewModel','../../ui/TransactionOverview','../../ui/MonthControl','../../ui/commercialHomeOverview']);
for(const code of Object.values(built))for(const [,name]of code.matchAll(/require\("([^"]+)"\)/g))if(!(name in ids)&&!embeddedNames.has(name))throw Error('Unmapped graphics import '+name);
function runtime(req){return `const ids=${JSON.stringify(ids)},local={};function require(name){if(local[name])return local[name];const id=ids[name];if(id===undefined)throw Error('Unknown graphics import '+name);return typeof id==='object'?Object.fromEntries(Object.entries(id).map(([name,id])=>[name,${req}(id).default])):${req}(id);}function embedded(code){const out={};(new Function('require','exports',code))(require,out);return out;}`;}
// Avoid eval in deployed code: embed each module as a lexical CommonJS factory.
function bundle(req,modules){let code=runtime(req).replace("function embedded(code){const out={};(new Function('require','exports',code))(require,out);return out;}", '');for(const [key,name]of modules){code+=`local[${JSON.stringify(name)}]={};(function(require,exports){${built[key]}})(require,local[${JSON.stringify(name)}]);`;}return code;}
const localModules=[['projection','../../ui/commercialHomeOverview'],['month','../../ui/MonthControl'],['model','./transactionOverviewModel'],['overview','../../ui/TransactionOverview']];
for(const [url,[hash,mime]] of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 if(cached.has(hash)){const item=cached.get(hash);if(item){routes[url]=[item.h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${item.h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);patched.push(...item.ids);}continue;}
 const count=patched.length;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();if(!/},\s*(?:825|931|826)\s*,\s*\[/.test(raw)){cached.set(hash,null);continue;}const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d'||![825,931,826].includes(Number(call.arguments[1]?.getText(sf))))continue;
 const id=Number(call.arguments[1].getText(sf)),node=call.arguments[0],base=node.getStart(sf),original=node.getText(sf),req=node.parameters[1].name.getText(sf);let factory=original;const changes=[];
 function all(root,pred){const result=[];function visit(n){if(pred(n))result.push(n);ts.forEachChild(n,visit);}visit(root);return result;}
 const replace=(n,value)=>changes.push({start:n.getStart(sf)-base,end:n.end-base,value});
 const insert=(at,value)=>changes.push({start:at-base,end:at-base,value});
 const prop=(o,name)=>o.properties.find(p=>p.name?.getText(sf)===name);
 const jsx=all(node,n=>ts.isCallExpression(n)&&n.arguments.length>1&&ts.isObjectLiteralExpression(n.arguments[1]));
 if(id===825){const body=all(node,n=>ts.isFunctionExpression(n)&&n.parameters.map(p=>p.name.getText(sf)).join(',')==='require,module,exports')[0].body;replace(body,'{'+built.home+'}');const map=all(node,n=>ts.isVariableDeclaration(n)&&n.name.getText(sf)==='ids')[0].initializer;const value=JSON.parse(map.getText(sf));value['expo-router']=790;replace(map,JSON.stringify(value));insert(node.body.getStart(sf)+1,'');
  const marker=all(node,n=>ts.isVariableDeclaration(n)&&n.name.getText(sf)==='HomePanel')[0].parent.parent;insert(marker.end,'exports.commercialHomeOverview=updated.commercialHomeOverview;');
 }
 if(id===931){factory=`function(g,r,i,a,m,exports,d){${bundle('r',localModules)}(function(require,exports){${built.charts}})(require,exports);}`;}
 if(id===826){const button=jsx.find(c=>prop(c.arguments[1],'testID')?.initializer?.text==='open-expense-breakdown');if(!button)throw Error('Top 3 arrow missing');replace(button,'null');}
 for(const c of changes.sort((a,b)=>b.start-a.start))factory=factory.slice(0,c.start)+c.value+factory.slice(c.end);
 const deps=JSON.parse(call.arguments[2].getText(sf));for(const dep of Object.values(ids).flatMap(v=>typeof v==='object'?Object.values(v):[v]).filter(Boolean))if(!deps.includes(dep))deps.push(dep);
 edits.push({start:statement.getStart(sf),end:statement.end,value:`__d(${factory},${id},${JSON.stringify(deps)});`});patched.push(id);
 }
 if(!edits.length){cached.set(hash,null);continue;}let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];cached.set(hash,{h,ids:patched.slice(count)});const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(new Set(patched).size!==3)throw Error('Expected three presentation module IDs');
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||/^\/(?:sw|register-sw)(?:[-.]|$)/.test(url)||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-controls91.js'));grew=true;}}}
const replacementCache=new Map();
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 if(replacementCache.has(hash)){routes[url]=[replacementCache.get(hash),mime];if(renamed.has(url))routes[renamed.get(url)]=routes[url];continue;}
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];replacementCache.set(hash,h);}else replacementCache.set(hash,hash);if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const read=p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString();
const save=(p,data)=>{const h=crypto.createHash('sha256').update(data).digest('hex');content[h]=z.gzipSync(data,{level:9}).toString('base64');routes[p]=[h,routes[p][1]];};
const sw=read('/sw.js').replace(/const CACHE='[^']+'/,"const CACHE='edumoney-shell-controls-91-20261122'");
for(const p of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(p))save(p,sw);
save('/index.html',read('/index.html').replace('graphics-90-20261122','controls-91-20261122'));
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
