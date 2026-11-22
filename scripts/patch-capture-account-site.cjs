// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live88-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map(),cached=new Map();
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const accountCode=compile('src/modules/documents/CaptureAccount.tsx'),linkCode=compile('src/modules/documents/linkCaptureCommercial.ts'),voiceCode=compile('src/modules/documents/saveVoiceEntry.ts');
const maps={react:13,'react/jsx-runtime':7,'../../core/errors':799,'../money/fields':797,'../money/localStore':798,'../notifications/events':1113,'./voiceEntry':833};
function helper(code,req,name){return `function ${name}(){const out={};(function(require,exports){${code}})(key=>{const ids=${JSON.stringify(maps)};if(!ids[key])throw Error('Unknown capture dependency '+key);return ${req}(ids[key]);},out);return out;}`;}
for(const [url,[hash,mime]] of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 if(cached.has(hash)){const item=cached.get(hash);if(item){routes[url]=[item.h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${item.h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);patched.push(...item.ids);}continue;}
 const count=patched.length;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d'||![821,834,945,952,959,962].includes(Number(call.arguments[1]?.getText(sf))))continue;
 const id=Number(call.arguments[1].getText(sf)),node=call.arguments[0],base=node.getStart(sf),original=node.getText(sf),req=node.parameters[1].name.getText(sf);let factory=original;const changes=[];
 function all(root,pred){const result=[];function visit(n){if(pred(n))result.push(n);ts.forEachChild(n,visit);}visit(root);return result;}
 const replace=(n,value)=>changes.push({start:n.getStart(sf)-base,end:n.end-base,value});
 const insert=(at,value)=>changes.push({start:at-base,end:at-base,value});
 const prop=(o,name)=>o.properties.find(p=>p.name?.getText(sf)===name);
 function jsxCalls(){return all(node,n=>ts.isCallExpression(n)&&n.arguments.length>1&&ts.isObjectLiteralExpression(n.arguments[1]));}
 if(id===834){factory=`function(g,r,i,a,m,exports,d){(function(require,exports){${voiceCode}})(key=>{const ids=${JSON.stringify(maps)};if(!ids[key])throw Error('Unknown capture dependency '+key);return r(ids[key]);},exports);}`;}
 else if(id===959){
  const save=all(node,n=>ts.isMethodDeclaration(n)&&n.name.getText(sf)==='save')[0];const input=save.parameters[0].name.getText(sf);
  insert(save.body.getStart(sf)+1,`if(${input}.businessHolderId&&${input}.context!=='business')throw new (${req}(799).UserInputError)('Revisa la cuenta seleccionada.');`);
  const create=all(save,n=>ts.isAwaitExpression(n)&&n.expression.getText(sf).includes('.MovementRepository(')&&n.expression.getText(sf).includes('.create('))[0];
  const call=create.expression,db=call.expression.expression.arguments[0].getText(sf),movement=call.arguments[0].getText(sf);
  replace(create,`(${create.getText(sf)},${input}.businessHolderId?await __captureLink().linkCaptureCommercial(${db},${movement},${input}.businessHolderId):undefined)`);
  const retry=all(save,n=>ts.isReturnStatement(n)&&/^[a-zA-Z_$][\w$]*\.id$/.test(n.expression?.getText(sf)??''))[0];if(!retry)throw Error('Retry return missing');
  const old=retry.expression.expression.getText(sf);
  replace(retry,`if(${input}.context&&['paid_expense','paid_income'].includes(${input}.kind)){const original=await ${db}.getFirstAsync('SELECT use_kind AS useKind FROM movements WHERE id=?',${old}.movementId);if((original?.useKind==='business')!==(${input}.context==='business'))throw new (${req}(799).UserInputError)('El registro ya pertenece a otra cuenta.');}if(${input}.businessHolderId){const linked=await ${db}.getFirstAsync('SELECT holder_id AS holderId FROM business_entries WHERE movement_id=?',${old}.movementId);if(linked?.holderId!==${input}.businessHolderId)throw new (${req}(799).UserInputError)('El registro ya pertenece a otra cuenta.');}${retry.getText(sf)}`);
 }
 else {
  let component;if(id===962)component=all(node,n=>ts.isFunctionDeclaration(n)&&n.name?.getText(sf)==='T')[0];else {const name=id===821?'HomeVoiceEntry':id===945?'VoiceDraftList':'ReviewForm';component=all(node,n=>ts.isBinaryExpression(n)&&n.left.getText(sf).endsWith('.'+name)&&ts.isFunctionExpression(n.right))[0]?.right;}
  if(!component)throw Error('Component missing '+id);
  insert(component.body.getStart(sf)+1,`const __account=__captureAccount().useCaptureAccount(${id===962?"e?'business':''":''});${id===962?"e=__account.account==='business';":''}`);
  if(id===821||id===945){const save=all(component,n=>ts.isCallExpression(n)&&n.expression.getText(sf).includes('.saveVoiceEntry'))[0];insert(save.end-1,',__account.confirmed()');
   const button=jsxCalls().find(c=>{if(!c.arguments[0].getText(sf).endsWith('.ActionButton'))return false;const title=prop(c.arguments[1],'title')?.initializer?.getText(sf);return id===821?prop(c.arguments[1],'testID')?.initializer?.text==='home-voice-save':title?.includes('Guardando')&&title.includes('Guardar');});if(!button)throw Error('Save button missing '+id);
   const jsx=button.expression.getText(sf).replace('.jsx','.jsxs'),runtime=jsx.match(/[A-Za-z_$][\w$]*\.jsxs/)[0].split('.')[0];replace(button,`${jsx}(${runtime}.Fragment,{children:[__account.selector,${button.getText(sf)}]})`);
  }
  if(id===952){const save=all(component,n=>ts.isCallExpression(n)&&n.expression.getText(sf)==='L.save')[0];insert(save.arguments[0].getStart(sf)+1,'...(!R?__account.confirmed():{}),');
   const sheet=jsxCalls().find(c=>c.arguments[0].getText(sf).endsWith('.Sheet'));const children=prop(sheet.arguments[1],'children').initializer;insert(children.getStart(sf)+1,'R?null:__account.selector,');
   const phrase=all(component,n=>ts.isStringLiteral(n)&&n.text==='Solo se conservarán los datos confirmados; la foto es temporal.')[0];if(phrase)replace(phrase,"__account.account==='business'?'El comprobante se conserva cifrado en tu dispositivo.':"+phrase.getText(sf));
  }
  if(id===962){const save=all(component,n=>ts.isCallExpression(n)&&n.expression.getText(sf).endsWith('.save')&&n.arguments[0]?.getText(sf).includes('incomeStatement:'))[0];const context=prop(save.arguments[0],'context');replace(context,'...__account.confirmed()');const edit=all(component,n=>ts.isCallExpression(n)&&n.expression.getText(sf).endsWith('.editStatement'))[0].arguments[0].getText(sf);
   const screen=jsxCalls().find(c=>c.arguments[0].getText(sf).endsWith('.Screen'));const children=prop(screen.arguments[1],'children').initializer;insert(children.getStart(sf)+1,`!${edit}?__account.selector:null,`);
  }
 }
 if(changes.length){for(const c of changes.sort((a,b)=>b.start-a.start))factory=factory.slice(0,c.start)+c.value+factory.slice(c.end);}
 if(id!==834){const code=id===959?helper(linkCode,req,'__captureLink'):helper(accountCode,req,'__captureAccount');factory=factory.slice(0,-1)+';'+code+'}';}
 const deps=JSON.parse(call.arguments[2].getText(sf));for(const dep of Object.values(maps))if(!deps.includes(dep))deps.push(dep);
 changes.length=0;
 edits.push({start:statement.getStart(sf),end:statement.end,value:`__d(${factory},${id},${JSON.stringify(deps)});`});patched.push(id);
 }
 if(!edits.length){cached.set(hash,null);continue;}let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
 const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];cached.set(hash,{h,ids:patched.slice(count)});const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(!patched.length)throw Error('No sheet patched');
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||/^\/(?:sw|register-sw)(?:[-.]|$)/.test(url)||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-capture89.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const read=p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString();
const save=(p,data)=>{const h=crypto.createHash('sha256').update(data).digest('hex');content[h]=z.gzipSync(data,{level:9}).toString('base64');routes[p]=[h,routes[p][1]];};
const sw=read('/sw.js').replace(/const CACHE='[^']+'/,"const CACHE='edumoney-shell-capture-89-20261122'");
for(const p of Object.keys(routes))if(/^\/sw(?:-.*)?\.js$/.test(p))save(p,sw);
save('/index.html',read('/index.html').replace('switch-88-20261122','capture-89-20261122'));
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
