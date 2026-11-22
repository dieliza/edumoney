// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live81-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const componentMap={react:13,'react-native':{View:110,useWindowDimensions:270},'expo-linear-gradient':836,'./components':796,'./MonthlyCharts':829,'../design/ThemeProvider':792,'../modules/money/domain':813,'../core/money':814,'../modules/business/ledgerDomain':900,'../modules/business/ledgerStore':899,'../modules/money/localStore':798,'react/jsx-runtime':7};
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map();
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));if(id!==820&&id!==825)continue;
 const node=call.arguments[0],base=node.getStart(sf),oldFactory=node.getText(sf),oldDeps=JSON.parse(call.arguments[2].getText(sf));let factory;
 function find(predicate){let found;function visit(n){if(predicate(n)){if(found)throw Error('Ambiguous target '+id);found=n;}ts.forEachChild(n,visit);}visit(node);if(!found)throw Error('Missing target '+id);return found;}
 if(id===820){const target=find(n=>ts.isCallExpression(n)&&n.arguments[0]?.getText(sf).endsWith('.MoneyOverview'));const props=target.arguments[1];if(!ts.isObjectLiteralExpression(props))throw Error('Expected props');const data=oldFactory.match(/categories:([a-zA-Z_$][\w$]*)\.categories,saved:/)?.[1];if(!data)throw Error('Personal data not found');const at=props.getStart(sf)+1-base;factory=oldFactory.slice(0,at)+`movements:${data}.movements,categories:${data}.categories,`+oldFactory.slice(at);}
 else{const overview=find(n=>ts.isBinaryExpression(n)&&n.left.getText(sf).endsWith('.MoneyOverview')&&ts.isFunctionExpression(n.right));const propName=overview.right.parameters[0].name.getText(sf);const hero=find(n=>ts.isCallExpression(n)&&n.arguments[0]?.getText(sf).endsWith('.LinearGradient')&&n.arguments[1]?.getText(sf).includes('#0BAE61'));const callee=hero.expression.getText(sf).replace('.jsxs','.jsx');const replacement=`${callee}(HomePanel,{summary:${propName}.summary,month:${propName}.month,movements:${propName}.movements,categories:${propName}.categories})`;const patchedFactory=oldFactory.slice(0,hero.getStart(sf)-base)+replacement+oldFactory.slice(hero.end-base);
 const built=ts.transpileModule(fs.readFileSync('src/ui/HomeBalancesAndCharts.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;for(const [,dep]of built.matchAll(/require\("([^"]+)"\)/g))if(!(dep in componentMap))throw Error('Unmapped dependency '+dep);
 factory=`function(g,r,i,a,m,exports,d){const ids=${JSON.stringify(componentMap)};function require(name){const id=ids[name];if(id===undefined)throw Error('Unknown dependency '+name);return typeof id==='object'?Object.fromEntries(Object.entries(id).map(([name,id])=>[name,r(id).default])):r(id);}const updated={};(function(require,module,exports){${built}})(require,{exports:updated},updated);const HomePanel=updated.HomeBalancesAndCharts;(${patchedFactory})(g,r,i,a,m,exports,d);}`;
 }
 const dependencies=id===825?[...new Set([...oldDeps,...Object.values(componentMap).flatMap(value=>typeof value==='object'?Object.values(value):[value])])]:oldDeps;
 edits.push({start:statement.getStart(sf),end:statement.end,value:`__d(${factory},${id},${JSON.stringify(dependencies)});`});patched.push(id);
 }
 if(!edits.length)continue;let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(new Set(patched).size!==2)throw Error('Expected only Home module IDs 820/825: '+patched);
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-homesplit20261122.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 if(url==='/sw.js')out=out.replace(/edumoney-shell-[a-zA-Z0-9-]+/g,'edumoney-shell-homesplit-20261122');
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
