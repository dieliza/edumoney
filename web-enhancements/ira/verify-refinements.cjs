const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
(async()=>{
const root='/workspace/edumoney',site='/workspace/sites/edumoney-ira',report=JSON.parse(fs.readFileSync(root+'/docs/stages/evidence/ira-refinements/package.json')),g=require(root+'/web-enhancements/funds-trial/host-graph.cjs')(site),checks=[];
function check(name,fn){fn();checks.push({name,passed:true});}
check('five targeted existing modules; no new screens or modules',()=>{assert.equal(report.modifiedFactories.length,5);assert.equal(report.added.length,0);});
check('packaged sources match reviewed source',()=>{for(const r of report.report.filter(r=>r.compiled))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'/'+r.compiled)).digest('hex'),r.source_sha256);});
check('service worker aliases use identical code and new cache',()=>{const sw=g.read('/sw.js');assert(sw.includes('edumoney-shell-'+report.buildName));for(const u of Object.keys(g.routes).filter(u=>/^\/sw(?:-.*)?\.js$/.test(u)))assert.equal(g.read(u),sw);assert(sw.includes('push')&&sw.includes('skipWaiting'));});
check('canonical service worker and all precache assets exist',()=>{assert(g.html.includes('/register-sw.js?build='+report.buildName));for(const u of JSON.parse(/const ASSETS=(\[[^;]+\]);/.exec(g.read('/sw.js'))[1]))assert(g.routes[u]);});
check('tax research remains monthly',()=>{const s=fs.readFileSync(site+'/worker/tax-rules.js','utf8');assert(!s.includes('7*24*60*60'));assert(fs.readFileSync(site+'/worker/index.js','utf8').includes('mensualmente'));});
const worker=(await import('file://'+site+'/worker/index.js')).default;
for(const u of ['/funds?kind=ira&scope=personal','/sw.js',...g.entryAssets.slice(0,2)]){const r=await worker.fetch(new Request('https://edumoney-web.diegoluissantospabon.chatgpt.site'+u,{headers:{accept:u.startsWith('/funds')?'text/html':'*/*'}}),{},{});assert.equal(r.status,200,u);assert((await r.arrayBuffer()).byteLength>0);checks.push({name:'Worker GET '+u,passed:true});}
fs.writeFileSync(root+'/docs/stages/evidence/ira-refinements/artifact-checks.json',JSON.stringify({checks,protectedModules:report.protectedModules,workerBytes:report.workerBytes},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,passed:checks.every(c=>c.passed),protectedModules:report.protectedModules}));
})().catch(e=>{console.error(e);process.exitCode=1;});
