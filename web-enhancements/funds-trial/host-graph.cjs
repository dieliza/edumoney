const fs=require('fs'),z=require('zlib'),ts=require('typescript'),assert=require('assert/strict');
module.exports=function(site){
 const worker=fs.readFileSync(site+'/worker/index.js','utf8'),start=worker.indexOf('const ROUTES=')+13;
 let depth=0,q=false,e=false,end=start;
 for(;end<worker.length;end++){const c=worker[end];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end++;break;}}
 const routes=JSON.parse(worker.slice(start,end)),content={};
 const valuesMatch=/const __EDU_ROUTE_VALUES=(\[.*?\]);const ROUTES=/.exec(worker);if(valuesMatch){const values=JSON.parse(valuesMatch[1]);for(const key of Object.keys(routes))if(typeof routes[key]==='number'){assert(values[routes[key]],'Unknown packed route');routes[key]=values[routes[key]];}}
 for(const f of fs.readdirSync(site+'/worker').filter(f=>f.endsWith('.js')&&fs.readFileSync(site+'/worker/'+f,'utf8').startsWith('export default {')))Object.assign(content,JSON.parse(fs.readFileSync(site+'/worker/'+f,'utf8').slice(15).replace(/;\s*$/,'')));
 const prefixesMatch=/const __EDU_ROUTE_PREFIXES=(\[.*?\]);/.exec(worker);if(prefixesMatch){const prefixes=JSON.parse(prefixesMatch[1]);for(const key of Object.keys(routes))if(key.startsWith('@')){const pos=key.indexOf(':'),index=parseInt(key.slice(1,pos),36);assert(typeof prefixes[index]==='string','Unknown route prefix');routes[prefixes[index]+key.slice(pos+1)]=routes[key];delete routes[key];}}
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
