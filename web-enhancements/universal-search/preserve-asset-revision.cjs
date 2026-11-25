// Retain URLs served by an intermediate release so open clients can update safely.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const site=process.argv[2],revision=process.argv[3];assert(/^[a-f0-9]{40}$/.test(revision));
const old=file=>execFileSync('git',['show',revision+':'+file],{cwd:site,maxBuffer:64*1024*1024,encoding:'utf8'});
function routes(source){const start=source.indexOf('const ROUTES=')+13;let depth=0,q=false,e=false;for(let i=start;i<source.length;i++){const c=source[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return{start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error('routes');}
const file=path.join(site,'worker/index.js'),source=fs.readFileSync(file,'utf8'),current=routes(source),prior=routes(old('worker/index.js')).value;
const parts=importer=>[...importer.matchAll(/\.\/content-(\d+)\.js/g)].map(m=>'worker/content-'+m[1]+'.js');
const decode=src=>JSON.parse(src.slice(src.indexOf('{'),src.lastIndexOf('}')+1));
let content={};for(const part of parts(fs.readFileSync(path.join(site,'worker/content.js'),'utf8')))Object.assign(content,decode(fs.readFileSync(path.join(site,part),'utf8')));
for(const part of parts(old('worker/content.js')))for(const [key,value]of Object.entries(decode(old(part))))if(!(key in content))content[key]=value;
let retained=0;for(const [url,value]of Object.entries(prior))if(!(url in current.value)){current.value[url]=value;retained++;}
fs.writeFileSync(file,source.slice(0,current.start)+JSON.stringify(current.value)+source.slice(current.end));
const shards=[];let part={},size=0;for(const [key,value]of Object.entries(content)){if(size+value.length>12_000_000&&size){shards.push(part);part={};size=0;}part[key]=value;size+=key.length+value.length+8;}shards.push(part);
shards.forEach((p,i)=>fs.writeFileSync(path.join(site,`worker/content-${i}.js`),'export default '+JSON.stringify(p)+';\n'));
fs.writeFileSync(path.join(site,'worker/content.js'),shards.map((_,i)=>`import part${i} from './content-${i}.js';`).join('\n')+'\nexport const CONTENT=Object.assign({},'+shards.map((_,i)=>'part'+i).join(',')+');\n');
for(const [url,value]of Object.entries(prior))if(url!=='/index.html'&&!/^\/sw(?:-.*)?\.js$/.test(url))assert.deepEqual(current.value[url],value,'Old resource changed '+url);
console.log('PASS: retained '+retained+' intermediate-release URLs without changing current scripts or cache; '+shards.length+' content shards');
