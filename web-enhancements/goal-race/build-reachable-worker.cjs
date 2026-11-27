// Package the existing Worker dependency graph, excluding orphaned generated releases.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=process.cwd(),files=new Set(['index.js']);
for(const file of files){const text=fs.readFileSync(path.join(root,'worker',file),'utf8');for(const m of text.matchAll(/^(?:import|export)\s+(?:[^\n'"]*?\sfrom\s*)?['"](\.\/[^'"]+\.js)['"]/gm)){const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1]));assert(!target.startsWith('../'));files.add(target);}}
if(process.argv.includes('--list')){console.log(JSON.stringify([...files]));process.exit(0);}
fs.rmSync(root+'/dist/server',{recursive:true,force:true});fs.mkdirSync(root+'/dist/server',{recursive:true});fs.mkdirSync(root+'/dist/.openai',{recursive:true});for(const file of files){const target=path.join(root,'dist/server',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'worker',file),target);}fs.copyFileSync(root+'/.openai/hosting.json',root+'/dist/.openai/hosting.json');console.log('Packaged '+files.size+' reachable Worker modules.');
