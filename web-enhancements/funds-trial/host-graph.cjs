const fs=require('fs'),z=require('zlib'),ts=require('typescript'),assert=require('assert/strict');
module.exports=function(site){
 const worker=fs.readFileSync(site+'/worker/index.js','utf8'),start=worker.indexOf('const ROUTES=')+13;
 let depth=0,q=false,e=false,end=start;
 for(;end<worker.length;end++){const c=worker[end];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end++;break;}}
 const routes=JSON.parse(worker.slice(start,end)),content={};
 const valuesMatch=/const __EDU_ROUTE_VALUES=(\[.*?\]);const ROUTES=/.exec(worker);if(valuesMatch){const values=JSON.parse(valuesMatch[1]);for(const key of Object.keys(routes))if(typeof routes[key]==='number'){assert(values[routes[key]],'Unknown packed route');routes[key]=values[routes[key]];}}
 const poolPath=site+'/worker/content-prefixes.js';let prefixes=[];if(fs.existsSync(poolPath)){const poolText=fs.readFileSync(poolPath,'utf8');if(poolText.startsWith('export default '))prefixes=JSON.parse(poolText.slice(15).replace(/;\s*$/,''));else{assert(poolText.startsWith('const pool='),'Unknown prefix pool');prefixes=JSON.parse(poolText.slice(11,poolText.indexOf(';\nfor(')));const {unpack85}=require('../goal-race/z85-pool-codec.cjs');for(let i=0;i<prefixes.length;i++){const v=prefixes[i];if(Array.isArray(v)){assert(Number.isSafeInteger(v[0])&&v[0]>=0&&v[0]<i&&Number.isSafeInteger(v[1])&&v[1]>=0&&typeof prefixes[v[0]]==='string');prefixes[i]=prefixes[v[0]].slice(0,v[1])+unpack85(v[2]);}else prefixes[i]=unpack85(v);}}}
 for(const f of fs.readdirSync(site+'/worker').filter(f=>/^content-\d+\.js$/.test(f))){const text=fs.readFileSync(site+'/worker/'+f,'utf8');if(text.startsWith('export default {'))Object.assign(content,JSON.parse(text.slice(15).replace(/;\s*$/,'')));else if(text.startsWith("import prefixes from './content-prefixes.js';")){const start=text.indexOf('const data=')+11,end=text.indexOf(';\nfor(',start),data=JSON.parse(text.slice(start,end));for(const[key,v]of Object.entries(data)){if(Array.isArray(v)){assert(Number.isSafeInteger(v[0])&&typeof prefixes[v[0]]==='string'&&(typeof v[1]==='string'||typeof v[1]?.z==='string'||typeof v[1]?.q==='string'),'Invalid static content prefix');data[key]=prefixes[v[0]]+require('../goal-race/z85-pool-codec.cjs').unpack85(v[1]);}else data[key]=require('../goal-race/z85-pool-codec.cjs').unpack85(v);}Object.assign(content,data);}else throw Error('Unsupported content shard '+f);}

 const suffixMatch=/const __EDU_ROUTE_SUFFIXES=(\[.*?\]);/.exec(worker);if(suffixMatch){const suffixes=JSON.parse(suffixMatch[1]);for(const key of Object.keys(routes))if(key[0]==='!'){const pos=key.indexOf(':'),index=parseInt(key.slice(1,pos),36);assert(typeof suffixes[index]==='string');routes[key.slice(pos+1)+suffixes[index]]=routes[key];delete routes[key];}}
 const prefixesMatch=/const __EDU_ROUTE_PREFIXES=(\[.*?\]);/.exec(worker);if(prefixesMatch){const prefixes=JSON.parse(prefixesMatch[1]);for(let i=0;i<prefixes.length;i++){const v=prefixes[i];if(Array.isArray(v)){assert(Number.isSafeInteger(v[0])&&v[0]>=0&&v[0]<i&&Number.isSafeInteger(v[1])&&typeof prefixes[v[0]]==='string'&&typeof v[2]==='string');prefixes[i]=prefixes[v[0]].slice(0,v[1])+v[2];}}for(const key of Object.keys(routes))if(key.startsWith('@')){const pos=key.indexOf(':'),index=parseInt(key.slice(1,pos),36);assert(typeof prefixes[index]==='string','Unknown route prefix');routes[prefixes[index]+key.slice(pos+1)]=routes[key];delete routes[key];}}
 const read=u=>z.gunzipSync(Buffer.from(content[routes[u][0]],'base64')).toString(),html=read('/index.html');
 const entryAssets=[...html.matchAll(/src="([^"?]+\.js)/g)].map(m=>m[1]).filter(u=>routes[u]&&u.startsWith('/_expo/'));
 const active=new Set(entryAssets),candidates=Object.keys(routes).filter(u=>u.startsWith('/_expo/')&&u.endsWith('.js'));
 for(const u of active){const text=read(u);for(const v of candidates)if(text.includes(v)||text.includes(v.split('/').pop()))active.add(v);}
 const defs=new Map(),byAsset=new Map();
 for(const u of active){const text=read(u),sf=ts.createSourceFile(u,text,99,true),ids=[];
  for(const st of sf.statements){const c=st.expression;if(!c||!ts.isCallExpression(c)||c.expression.getText(sf)!=='__d')continue;
   const id=+c.arguments[1].getText(sf);assert(!defs.has(id),'Duplicate active module '+id);
   defs.set(id,{id,factory:c.arguments[0].getText(sf),deps:JSON.parse(c.arguments[2].getText(sf)),asset:u,start:st.getStart(sf),end:st.end});ids.push(id);
  }byAsset.set(u,ids);
 }
 return{worker,start,end,routes,content,read,html,entryAssets,active,defs,byAsset};
};
