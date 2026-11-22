const {Buffer}=require('node:buffer');
const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
function worker(file){const source=fs.readFileSync(file,'utf8');function obj(name){const start=source.indexOf('const '+name+'=')+name.length+7;let depth=0,q=false,e=false;for(let p=start;p<source.length;p++){const c=source[p];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(source.slice(start,p+1));}throw Error(name);}const routes=obj('ROUTES'),content=obj('CONTENT');return{source,routes,read:p=>z.gunzipSync(Buffer.from(content[routes[p][0]],'base64')).toString()};}
const before=worker('/tmp/edumoney-live85-worker.js'),after=worker('/workspace/sites/edumoney-web/worker/index.js');
assert.equal(before.source.slice(0,before.source.indexOf('const ROUTES=')),after.source.slice(0,after.source.indexOf('const ROUTES=')));
let checked=0;
for(const p of Object.keys(before.routes)){
 if(!p.includes('__common-'))continue;
 const old=new Map(),now=new Map();for(const [map,w]of [[old,before],[now,after]])vm.runInNewContext(w.read(p),{__d:(f,id,deps)=>map.set(id,{f,deps})},{timeout:1000});
 for(const [id,rec]of old){if(![797,1148,831].includes(id)){assert.equal(now.get(id)?.f.toString(),rec.f.toString(),'Unrelated module '+id);continue;}
 if(id!==797)continue;
 const module={exports:{}};const react={useState:()=>[undefined,()=>{}],useEffect:()=>{},useLayoutEffect:()=>{}};const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const f=now.get(id);const dep=n=>{const actual=f.deps[n];if(actual===13)return react;if(actual===7)return jsx;if(actual===792)return{useTheme:()=>({colors:{}})};if(actual===789)return{fixed:{}};return new Proxy({__esModule:true,default:'component'},{get:(o,k)=>k in o?o[k]:'component'});};
 f.f({},dep,dep,dep,module,module.exports, f.deps.map((_,i)=>i));
 const rendered=module.exports.Sheet({title:'Nueva transacción',close(){}});assert.equal(rendered.props.children.props.enabled,false);assert.equal(typeof module.exports.Field,'function');const outer=rendered.props.children.props.children[0];assert.equal(outer.props.style.height,'100%');assert.equal(outer.props.style.minHeight,0);const body=outer.props.children.find(c=>c?.props?.testID==='sheet-scroll');assert.equal(body.props.style.flex,1);assert.equal(body.props.style.minHeight,0);checked++;
 }
}
assert(checked>0);const html=after.read('/index.html');assert(html.includes('/register-sw.js?build=compact-86-20261122'));assert(after.read('/register-sw.js').includes("register('/sw.js'"));const sw=after.read('/sw.js');assert(sw.includes("CACHE='edumoney-shell-compact-86-20261122'"));for(const p of JSON.parse(/const ASSETS=(\[[^;]+\]);/.exec(sw)[1]))assert(after.routes[p],p);for(const p of Object.keys(after.routes))if(/^\/sw(?:-.*)?\.js$/.test(p))assert.equal(after.read(p),sw);assert(sw.includes('push'));assert(sw.includes('notificationclick'));
console.log(`Verified ${checked} sheet aliases render; all unrelated factories/server preserved; canonical updates and precache valid.`);

const activeHTML=after.read('/index.html');const common=Object.keys(after.routes).filter(p=>p.includes('__common-')&&activeHTML.includes(p.split('/').pop()));
// Validate the latest sheet and wheel factories from the same active bundle.
const paths=common.length?common:Object.keys(after.routes).filter(p=>p.includes('__common-')).slice(-1);
for(const p of paths){const records=new Map();vm.runInNewContext(after.read(p),{__d:(f,id,deps)=>records.set(id,{f,deps}),setTimeout:()=>1,clearTimeout(){},window:{matchMedia:()=>({matches:true})}},{timeout:1000});
 const rec=records.get(1148);assert(rec);let changed;const react={useId:()=>"wheel",useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:()=>{}};const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const model={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/ui/wheelModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:model.exports});
 const values={13:react,7:jsx,796:{Body:'Body'},792:{useTheme:()=>({colors:{}})},1149:model.exports};const module={exports:{}};const dep=i=>values[rec.deps[i]];rec.f({},dep,dep,dep,module,module.exports,rec.deps.map((_,i)=>i));
 const tree=module.exports.WheelPicker({label:'Categoría',value:'a',options:[['a','Comida'],['b','Vivienda'],['c','Servicios']],onChange:v=>{changed=v;}});
 function nodes(n){return [n,...(Array.isArray(n?.props?.children)?n.props.children:[n?.props?.children]).flat().filter(Boolean).flatMap(c=>typeof c==='object'?nodes(c):[])];}
 const all=nodes(tree),list=all.find(n=>n.props?.role==='listbox');assert.equal(list.props.style.height,132);assert.equal(all.find(n=>n.props?.role==='option').props.style.height,44);assert(!JSON.stringify(tree).includes('Desliza verticalmente'));list.props.onKeyDown({key:'ArrowDown',preventDefault(){}});assert.equal(changed,'b');list.props.ref.current={scrollTop:88,scrollTo(){}};list.props.onScroll();assert.equal(changed,'c');
}
console.log('Active wheel remains selectable by keyboard/scroll with 44px rows and 132px viewport; no instructional phrase.');
