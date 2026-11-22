// Targeted module replacement against the retrieved live worker; preserve all other source/assets.
const {Buffer}=require('node:buffer');
const fs=require('node:fs'),ts=require('typescript'),z=require('node:zlib'),crypto=require('node:crypto');
const source=fs.readFileSync('/tmp/edumoney-live82-worker.js','utf8');
function objectRange(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,string=false,escape=false;for(let i=start;i<source.length;i++){const c=source[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;}else if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error(name);}
const rr=objectRange('ROUTES'),cr=objectRange('CONTENT'),routes=rr.value,content=cr.value;
const baselineURLs=Object.keys(routes);
let patched=[];const renamed=new Map();
for(const [url,[hash,mime]]of Object.entries({...routes})){
 if(!url.endsWith('.js'))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();const sf=ts.createSourceFile(url,raw,ts.ScriptTarget.Latest,true);const edits=[];
 for(const statement of sf.statements){const call=statement.expression;if(!call||!ts.isCallExpression(call)||call.expression.getText(sf)!=='__d')continue;const id=Number(call.arguments[1]?.getText(sf));if(![796,829,1150,935,794,825].includes(id))continue;
 const node=call.arguments[0],base=node.getStart(sf),old=node.getText(sf),deps=JSON.parse(call.arguments[2].getText(sf)),changes=[];
 function all(root,predicate){const result=[];function visit(n){if(predicate(n))result.push(n);ts.forEachChild(n,visit);}visit(root);return result;}
 const prop=(object,name)=>object.properties.find(p=>p.name?.getText(sf)===name);
 const replace=(n,value)=>changes.push({start:n.getStart(sf)-base,end:n.end-base,value});
 const insert=(at,value)=>changes.push({start:at-base,end:at-base,value});
 function exported(name){const assign=all(node,n=>ts.isBinaryExpression(n)&&n.left.getText(sf).endsWith('.'+name))[0];if(!assign)throw Error('Export missing '+name);if(ts.isFunctionExpression(assign.right))return assign.right;const target=assign.right.getText(sf);const result=all(node,n=>ts.isFunctionDeclaration(n)&&n.name?.getText(sf)===target);if(result.length!==1)throw Error('Function missing '+name);return result[0];}
 function params(fn,text){insert(fn.parameters[0].name.getStart(sf)+1,text);}
 function jsxCalls(fn){return all(fn,n=>ts.isCallExpression(n)&&n.arguments.length>=2&&ts.isObjectLiteralExpression(n.arguments[1]));}
 function props(call,text){insert(call.arguments[1].getStart(sf)+1,text);}
 if(id===796){
  const body=exported('Body');params(body,'canvas:__canvas=false,');const muted=body.parameters[0].name.elements.find(e=>e.propertyName?.getText(sf)==='muted'||e.name.getText(sf)==='muted').name.getText(sf);const color=all(body,n=>ts.isPropertyAssignment(n)&&n.name.getText(sf)==='color')[0];replace(color.initializer,`__canvas?(${muted}?'#D7F2EE':'#F4FFFC'):(${color.initializer.getText(sf)})`);
  const badge=exported('IconBadge');params(badge,'iconColor:__iconColor,');const badgeColor=all(badge,n=>ts.isPropertyAssignment(n)&&n.name.getText(sf)==='color')[0];replace(badgeColor.initializer,`__iconColor??(${badgeColor.initializer.getText(sf)})`);
  const dashboard=exported('DashboardAction');params(dashboard,'canvas:__canvas=false,iconColor:__iconColor,');for(const c of jsxCalls(dashboard)){const component=c.arguments[0].getText(sf);if(component===body.name.getText(sf))props(c,'canvas:__canvas,');if(component===badge.name.getText(sf))props(c,'iconColor:__iconColor,');}
 }
 if([829,1150,935].includes(id)){
  const fn=exported(id===829?'MonthlyCharts':id===1150?'ChartBars':'TransactionChart');params(fn,'canvas:__canvas=false,');
  for(const c of jsxCalls(fn)){const tag=c.arguments[0].getText(sf),object=c.arguments[1];
   if(['.Body','.ChartBars','.TransactionChart'].some(name=>tag.endsWith(name)))props(c,'canvas:__canvas,');
   const child=prop(object,'children')?.initializer,style=prop(object,'style')?.initializer;
   if(id===829&&tag.endsWith('.Body')&&style&&ts.isObjectLiteralExpression(style)){
    if(child&&ts.isStringLiteral(child)&&child.text==='Diferencia')insert(style.getStart(sf)+1,"...(__canvas?{color:'#123B32'}:{}),");
    const color=prop(style,'color');if(color&&ts.isConditionalExpression(color.initializer)&&color.initializer.getText(sf).includes('.difference'))replace(color.initializer,`__canvas&&(${color.initializer.condition.getText(sf)})?'#9B1639':(${color.initializer.getText(sf)})`);
   }
   if(id===829){const name=prop(object,'name')?.initializer,color=prop(object,'color');if(name&&ts.isStringLiteral(name)&&name.text==='pie-chart-outline'&&color)replace(color.initializer,`__canvas?'#B7FFE8':(${color.initializer.getText(sf)})`);}
   if(id===935){
    const iconColor=prop(object,'color');if(iconColor)replace(iconColor.initializer,`__canvas?'#B7FFE8':(${iconColor.initializer.getText(sf)})`);
    if(tag.endsWith('.Body')&&style&&ts.isObjectLiteralExpression(style)){const color=prop(style,'color');if(color){let ink;if(child&&ts.isStringLiteral(child))ink=child.text.includes('Ingreso')?'#B7FFE8':child.text.includes('Gasto')?'#FFE8F0':null;else if(color.initializer.getText(sf).endsWith('.primary'))ink='#B7FFE8';if(ink)replace(color.initializer,`__canvas?'${ink}':(${color.initializer.getText(sf)})`);}}
   }
  }
 }
 if(id===794){const fn=exported('default'),requireName=node.parameters[1].name.getText(sf);insert(fn.body.getStart(sf)+1,`const __onCanvas=${requireName}(792).useTheme().name==='dark';`);if(!deps.includes(792))deps.push(792);for(const c of jsxCalls(fn)){const tag=c.arguments[0].getText(sf),object=c.arguments[1];if(tag.endsWith('.IconBadge'))props(c,"iconColor:__onCanvas?'#D6FFF1':undefined,");if(tag.endsWith('.DashboardAction')){const title=prop(object,'title')?.initializer;const ink=title&&ts.isStringLiteral(title)&&title.text==='Nómina'?'#FFD5E4':'#B7FFE8';props(c,`canvas:__onCanvas,iconColor:__onCanvas?'${ink}':undefined,`);}}}
 if(id===825){const charts=jsxCalls(node).filter(c=>c.arguments[0].getText(sf).endsWith('.MonthlyCharts'));if(charts.length!==2)throw Error('Expected two Home charts');for(const c of charts)props(c,"canvas:name==='dark',");}
 if(!changes.length)throw Error('No changes '+id);let factory=old;for(const change of changes.sort((a,b)=>b.start-a.start))factory=factory.slice(0,change.start)+change.value+factory.slice(change.end);
 edits.push({start:statement.getStart(sf),end:statement.end,value:`__d(${factory},${id},${JSON.stringify(deps)});`});patched.push(id);
 }
 if(!edits.length)continue;let out=raw;for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];const next=url.replace(/-[a-f0-9]{32}\.js$/,`-${h.slice(0,32)}.js`);routes[next]=routes[url];renamed.set(url,next);
}
if(new Set(patched).size!==6)throw Error('Expected only six contrast-related module IDs: '+patched);
// Rename every JS importer affected by changed chunk URLs so neither HTTP cache nor
// an old service worker can retain a manifest pointing at stale business chunks.
let grew=true;
while(grew){grew=false;for(const url of baselineURLs){if(!url.endsWith('.js')||renamed.has(url))continue;const raw=z.gunzipSync(Buffer.from(content[routes[url][0]],'base64')).toString();if([...renamed.keys()].some(old=>raw.includes(old)||raw.includes(old.split('/').pop()))){renamed.set(url,url.replace(/\.js$/,'-contrast20261122.js'));grew=true;}}}
for(const [url,[hash,mime]]of Object.entries(routes)){
 if(!/javascript|text\/html|application\/json/.test(mime))continue;
 const raw=z.gunzipSync(Buffer.from(content[hash],'base64')).toString();let out=raw;
 for(const [old,next]of renamed){out=out.split(old).join(next);out=out.split(old.split('/').pop()).join(next.split('/').pop());}
 if(url==='/sw.js')out=out.replace(/edumoney-shell-[a-zA-Z0-9-]+/g,'edumoney-shell-contrast-20261122');
 if(out!==raw){const h=crypto.createHash('sha256').update(out).digest('hex');content[h]=z.gzipSync(out,{level:9}).toString('base64');routes[url]=[h,mime];}if(renamed.has(url))routes[renamed.get(url)]=routes[url];
}
const used=new Set(Object.values(routes).map(([hash])=>hash));const surrounding=source.slice(0,rr.start)+source.slice(rr.end,cr.start)+source.slice(cr.end);for(const hash of Object.keys(content))if(!used.has(hash)&&!surrounding.includes(hash))delete content[hash];
let out=source;for(const e of [{...rr,value:JSON.stringify(routes)},{...cr,value:JSON.stringify(content)}].sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.value+out.slice(e.end);
const site='/workspace/sites/edumoney-web';fs.writeFileSync(site+'/worker/index.js',out);fs.mkdirSync(site+'/dist/server',{recursive:true});fs.writeFileSync(site+'/dist/server/index.js',out);console.log(JSON.stringify({patched,renamed:[...renamed],preservedServer:out.slice(0,rr.start)===source.slice(0,rr.start),output:out.length}));
