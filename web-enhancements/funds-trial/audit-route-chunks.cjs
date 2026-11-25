// Audit independently loaded route bundles, rather than an artificial all-modules registry.
const fs=require('fs'),assert=require('assert/strict'),graph=require('./host-graph.cjs');
const g=graph(process.argv[2]),base=new Set(g.entryAssets.flatMap(a=>g.byAsset.get(a))),problems=[];
const sharedExtra=[...g.active].filter(a=>/\/_layout-/.test(a)).flatMap(a=>g.byAsset.get(a));
const rows=[];
for(const [asset,ids]of g.byAsset){if(g.entryAssets.includes(asset)||!ids.length)continue;
 const present=new Set([...base,...sharedExtra,...ids]),missing=[];
 for(const id of present){const f=g.defs.get(id).factory,m=/const ids=(\{[^;]+\});/.exec(f);if(!m)continue;
  const map=JSON.parse(m[1]);
  for(const call of f.matchAll(/require\("([^"]+)"\)/g)){
   const value=map[call[1]];if(value===undefined)continue; // Legacy factories can contain more than one lexical require-map.
   const targets=typeof value==='object'?Object.values(value):[value];
   for(const target of targets)if(!present.has(target))missing.push({module:id,import:call[1],target,owner:g.defs.get(target)?.asset?.split('/').pop()});
  }
 }
 if(missing.length)problems.push({asset:asset.split('/').pop(),missing});
 rows.push({asset:asset.split('/').pop(),modules:ids.length,missing:missing.length});
}
const report={cases:1,independentChunks:rows.length,totalModules:g.defs.size,problems,rows};
const name=process.argv.includes('--fixed')?'route-audit-fixed.json':'route-audit-before.json';
fs.writeFileSync('/workspace/edumoney/docs/stages/evidence/progress-blank/'+name,JSON.stringify(report,null,2));
console.log(JSON.stringify({cases:1,independentChunks:rows.length,totalModules:g.defs.size,missing:[...new Map(problems.flatMap(p=>p.missing).map(m=>[m.module+':'+m.target,m])).values()]}));
if(process.argv.includes('--fixed'))assert.equal(problems.length,0,'A route still depends on another unloaded route');
