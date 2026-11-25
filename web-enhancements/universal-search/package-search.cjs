// Forward integration: keep hosted posting stores, prizes, native web controls and server code.
const {Buffer}=require('node:buffer'),fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(path.dirname(require.resolve('./package-search.cjs')),'../..'),site=process.argv[2];
const workerFile=path.join(site,'worker/index.js'),contentFile=path.join(site,'worker/content.js');
const source=fs.readFileSync(workerFile,'utf8'),contentSource=fs.readFileSync(contentFile,'utf8');
function range(src,name){const at=src.indexOf('const '+name+'=');assert(at>=0,name+' missing');const start=at+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<src.length;p++){const c=src[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return{start,end:p+1,value:JSON.parse(src.slice(start,p+1))};}throw Error(name);}
const rr=range(source,'ROUTES'),routes=rr.value,content=range(contentSource,'CONTENT').value,prior=JSON.parse(JSON.stringify(routes));
const read=u=>z.gunzipSync(Buffer.from(content[routes[u][0]],'base64')).toString();
function put(u,text,mime=routes[u]?.[1]){assert(mime);const hash=crypto.createHash('sha256').update(text).digest('hex');content[hash]=z.gzipSync(text,{level:9}).toString('base64');routes[u]=[hash,mime];}
const html=read('/index.html'),common=/src="(\/_expo\/static\/js\/web\/__common-[^"]+)"/.exec(html)[1];
const candidates=Object.keys(routes).filter(u=>u.startsWith('/_expo/')&&u.endsWith('.js'));
const active=new Set([...html.matchAll(/src="([^"?]+\.js)/g)].map(m=>m[1]).filter(u=>routes[u]));
const rawCache=new Map(),get=u=>{const hash=routes[u][0];if(!rawCache.has(hash))rawCache.set(hash,read(u));return rawCache.get(hash);};
for(const u of active){const raw=get(u);for(const target of candidates)if(raw.includes(target)||raw.includes(target.split('/').pop()))active.add(target);}
assert(active.has(common));
const native={View:110,Text:189,Pressable:246,ActivityIndicator:229,useWindowDimensions:270,Modal:239,ScrollView:134,TextInput:256,KeyboardAvoidingView:238,Keyboard:219,Platform:105,StyleSheet:29,AppState:214,Image:179};
const standard={'react/jsx-runtime':7,react:13,'react-native':native,'react-native-safe-area-context':272,'@expo/vector-icons/Ionicons':791,'expo-router':790};
const compile=file=>ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function factory(code,imports){const ids={...standard,...imports};for(const m of code.matchAll(/require\("([^"]+)"\)/g))assert(m[1] in ids,'Unmapped dependency '+m[1]);return `function(g,r,i,a,m,exports,d){const ids=${JSON.stringify(ids)};function require(name){if(!(name in ids))throw Error('Missing search dependency '+name);const id=ids[name];return typeof id==='object'?Object.fromEntries(Object.entries(id).map(([key,value])=>[key,r(value).default])):r(id);}${code}\n}`;}
const definitions=new Map();
function define(id,file,imports){definitions.set(id,factory(compile(file),imports));}
define(20010,'src/modules/search/model.ts',{});
define(20011,'src/modules/search/load.ts',{'../learning/content':20016,'./model':20010,'../money/types':830});
define(20012,'src/modules/search/UniversalSearch.tsx',{'../../design/ThemeProvider':792,'../../ui/useSheetViewport':20003,'../../ui/transactionFormStyle':20001,'../money/localStore':798,'../money/accountScope':20004,'../../storage/changeEvents':871,'./load':20011,'./model':20010});
define(20013,'src/ui/meaningCatalog.ts',{});
define(20014,'src/ui/MeaningHelp.tsx',{'../modules/money/accountScope':20004,'../design/ThemeProvider':792,'./transactionFormStyle':20001,'./meaningCatalog':20013});
define(20016,'src/modules/learning/content.ts',{});
definitions.set(20015,factory(`const React=require('react'),router=require('expo-router');exports.useSearchLanding=function(key,run,ready,onError){const params=router.useLocalSearchParams(),focused=router.useIsFocused(),handled=React.useRef(''),id=params[key];React.useEffect(()=>{if(!focused||!ready||typeof id!=='string'||!id||handled.current===id)return;let active=true;Promise.resolve().then(()=>{if(!active)return;handled.current=id;return run(id,params);}).catch(e=>{if(active&&onError)onError(e instanceof Error?e.message:'No pudimos abrir el resultado.');});return()=>{active=false;};},[id,ready,focused,run,onError,params]);};`,{}));
const targetIds=new Set([796,797,819,820,831,853,1108,1125,805,947,939,842,849,818,892]);
const found=new Set(),moduleBefore=new Map(),moduleAfter=new Map();
function all(node,predicate){const out=[];function visit(n){if(predicate(n))out.push(n);ts.forEachChild(n,visit);}visit(node);return out;}
function wrapperImports(node,sf){const declaration=all(node,n=>ts.isVariableDeclaration(n)&&n.name.getText(sf)==='ids'&&n.initializer&&ts.isObjectLiteralExpression(n.initializer))[0];assert(declaration,'Reviewed wrapper missing');return JSON.parse(declaration.initializer.getText(sf));}
function patch(raw,url){const sf=ts.createSourceFile(url,raw,99,true),edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));assert(!definitions.has(id),'Module ID in use '+id);if(!targetIds.has(id))continue;
 const node=call.arguments[0],base=node.getStart(sf),original=node.getText(sf),req=node.parameters[1].name.getText(sf),exp=node.parameters[5].name.getText(sf);let next=original;const changes=[];
 const insert=(at,text)=>changes.push({start:at-base,end:at-base,text});
 const bodyOf=name=>{const fn=all(node,n=>ts.isFunctionDeclaration(n)&&n.name?.getText(sf)===name)[0];assert(fn,'Missing screen '+id+':'+name);return fn;};
 const hook=(name,code)=>{const fn=bodyOf(name),declaration=fn.body.statements.find(n=>ts.isVariableStatement(n));assert(declaration);insert(declaration.end,`;${req}(20015).useSearchLanding${code};`);};
 if([797,831,853,892].includes(id)){const imports=wrapperImports(node,sf);if(id===797)imports['../../ui/MeaningHelp']=20014;if(id===853)imports['./MeaningHelp']=20014;next=factory(compile({797:'src/modules/money/fields.tsx',831:'src/modules/money/MovementForm.tsx',853:'src/ui/DateField.web.tsx',892:'src/modules/business/BusinessLedgerScreen.tsx'}[id]),imports);}
 if(id===1108)next=factory(compile('src/ui/HeaderActions.tsx'),{'../modules/search/UniversalSearch':20012,'./ThemePicker':1109,'./NotificationBell':1110,'./SideMenu':1122});
 if(id===819)next=factory(compile('src/modules/money/MoneyScreen.tsx'),{'./LedgerScreen':820});
 if(id===796)insert(node.body.end-1,`;const __priorScreen=${exp}.Screen;${exp}.Screen=function(props){const j=${req}(7);return j.jsx(__priorScreen,{...props,children:[j.jsx(${req}(20014).SectionMeaning,{title:props.title}),props.children]});};`);
 if(id===1125)insert(node.body.end-1,`;const __priorSelect=${exp}.SelectControl;${exp}.SelectControl=function(props){const j=${req}(7);return j.jsxs(${req}(110).default,{style:{gap:4},children:[j.jsx(${req}(20014).MeaningHelp,{label:props.label}),j.jsx(__priorSelect,props)]});};`);
 if(id===820){hook('T',`('movementId',id=>I.snapshot().then(raw=>{const movement=raw.movements.find(m=>m.id===id&&!m.deletedAt);if(movement&&['income','expense'].includes(movement.kind))Q({initial:movement,kind:movement.kind,history:movement.kind});else _('La transacción ya no está disponible para editar.');}),!!I,_)`);hook('T',`('history',id=>Q({kind:id==='income'?'income':'expense',history:id==='income'?'income':'expense'}),!!I,_)`);}
 if(id===805)hook('b',`('goalId',id=>D(id),!!b,P)`);
 if(id===947)hook('I',`('documentId',id=>{M(true);return Ae(id);},!!N,_)`);
 if(id===939)hook('y',`('scenarioId',id=>{const found=C.find(s=>s.id===id);if(!found)return;if(found.formulaVersion!==1)throw Error('La versión de cálculo necesita revisión.');h.simulate(found.input);w(f.draftFrom(found.input));k(found.input);E(found.name+' copia');I(t.newId());N('Copia cargada; el original se conserva.');},C.length>0,M)`);
 if(id===842){hook('$',`('debtId',(id,params)=>{if(params.billId)return;U('debts');ue(id);he('');},!!Y,ae)`);const condition=all(node,n=>ts.isIfStatement(n)&&n.expression.getText(sf)==='W.debtId&&N.current!==o')[0];assert(condition);changes.push({start:condition.expression.getStart(sf)-base,end:condition.expression.end-base,text:'W.debtId&&W.billId&&N.current!==o'});}
 if(id===849)hook('A',`('billId',id=>{Z(id);ae('');te([]);},!!w,$)`);
 if(id===818)hook('L',`('lessonId',id=>{if(j.findLesson(id)){A(id);N('');z('');}},true,M)`);
 for(const e of changes.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
 const deps=JSON.parse(call.arguments[2].getText(sf));for(const value of Object.values(standard).flatMap(v=>typeof v==='object'?Object.values(v):[v]).concat([20010,20011,20012,20013,20014,20015,20016]))if(!deps.includes(value))deps.push(value);
 edits.push({start:statement.getStart(sf),end:statement.end,text:`__d(${next},${id},${JSON.stringify(deps)});`});found.add(id);moduleBefore.set(id,original);moduleAfter.set(id,next);
 }
 let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.text+out.slice(e.end);return out;
}
const patched=new Map();
for(const u of active){if(!u.startsWith('/_expo/'))continue;const raw=get(u);const out=patch(raw,u);patched.set(u,out);}
assert.deepEqual([...found].sort((a,b)=>a-b),[...targetIds].sort((a,b)=>a-b),'All intended screens must be present in the active graph');
const extra=[...definitions].map(([id,f])=>`\n__d(${f},${id},[]);`).join('');patched.set(common,patched.get(common)+extra);
const build='universal-search-'+crypto.createHash('sha256').update([...patched.values()].join('\n')).digest('hex').slice(0,12);
const renamed=new Map([...patched.keys()].map(u=>[u,u.replace(/\.js$/,`-${build}.js`)]));
function relink(text){for(const [old,next]of renamed){text=text.split(old).join(next);text=text.split(old.split('/').pop()).join(next.split('/').pop());}return text;}
for(const [u,text]of patched)put(renamed.get(u),relink(text),routes[u][1]);
let nextHtml=relink(html).replace(/\/register-sw.js\?build=[^" ]+/,'/register-sw.js?build='+build);put('/index.html',nextHtml);
const oldSW=read('/sw.js');let sw=relink(oldSW).replace(/const CACHE='[^']+'/,`const CACHE='edumoney-shell-${build}'`);
const assets=JSON.parse(/const ASSETS=(\[[^;]+\]);/.exec(sw)[1]);for(const u of renamed.values())assets.push(u);for(const u of assets)assert(routes[u],'Missing precache resource '+u);sw=sw.replace(/const ASSETS=\[[^;]+\];/,'const ASSETS='+JSON.stringify([...new Set(assets)])+';');
for(const u of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(u))put(u,sw);
// No old JS URL is changed. Existing clients can finish their forms before accepting an update.
for(const [u,v]of Object.entries(prior))if(u!=='/index.html'&&!/^\/sw(?:-.*)?\.js$/.test(u))assert.deepEqual(routes[u],v,'Existing asset changed '+u);
const strip=s=>s.replace(/const CACHE='[^']+'/,"const CACHE='BUILD'").replace(/const ASSETS=\[[^;]+\];/,'const ASSETS=[];');assert.equal(strip(sw),strip(oldSW),'Push/safe activation handlers changed');
const nextWorker=source.slice(0,rr.start)+JSON.stringify(routes)+source.slice(rr.end);fs.writeFileSync(workerFile,nextWorker);
// Keep every source file below the repository's 32 MiB object limit.
const entries=Object.entries(content),shards=[];let shard={},bytes=0;
for(const [key,value]of entries){if(bytes+value.length>12_000_000&&bytes){shards.push(shard);shard={};bytes=0;}shard[key]=value;bytes+=key.length+value.length+8;}if(bytes)shards.push(shard);
shards.forEach((part,i)=>fs.writeFileSync(path.join(site,`worker/content-${i}.js`),'export default '+JSON.stringify(part)+';\n'));
fs.writeFileSync(contentFile,shards.map((_,i)=>`import part${i} from './content-${i}.js';`).join('\n')+'\nexport const CONTENT=Object.assign({},'+shards.map((_,i)=>'part'+i).join(',')+');\n');
const evidence=path.join(site,'search-review');fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'bundle.js'),relink(patched.get(common)));fs.writeFileSync(path.join(evidence,'modules.json'),JSON.stringify(Object.fromEntries(moduleAfter)));fs.writeFileSync(path.join(evidence,'prior-modules.json'),JSON.stringify(Object.fromEntries(moduleBefore)));fs.writeFileSync(path.join(evidence,'manifest.json'),JSON.stringify({build,common:renamed.get(common),active:[...active],renamed:[...renamed],targetIds:[...targetIds],newIds:[...definitions.keys()]},null,2));
console.log(JSON.stringify({build,patchedModules:[...found],newModules:[...definitions.keys()],activeAssets:active.size,shards:shards.length}));
