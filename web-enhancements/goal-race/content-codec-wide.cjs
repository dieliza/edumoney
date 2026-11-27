// Lossless larger prefix sharing for accumulated static version aliases.
// Share static gzip/base64 prefixes. Expansion must reproduce every original payload exactly.
module.exports=function encodeContent(content){
 const entries=Object.entries(content),sorted=entries.filter(([,v])=>v.length>=2048).sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0),candidates=new Set();
 for(let i=1;i<sorted.length;i++){const a=sorted[i-1][1],b=sorted[i][1],max=Math.min(a.length,b.length,2097152);let n=0;while(n<max&&a.charCodeAt(n)===b.charCodeAt(n))n++;if(n>=2048)candidates.add(a.slice(0,n));}
 const ranked=[...candidates].map(prefix=>({prefix,score:entries.filter(([,v])=>v.startsWith(prefix)).length*prefix.length-prefix.length})).sort((a,b)=>b.score-a.score),pool=[],selected=new Map();
 for(const{prefix}of ranked){const matched=entries.filter(([key,v])=>v.startsWith(prefix)&&(!selected.has(key)||pool[selected.get(key)].length<prefix.length)),saving=matched.reduce((n,[key])=>n+prefix.length-(selected.has(key)?pool[selected.get(key)].length:0),0)-prefix.length-50;if(saving<2048)continue;const index=pool.length;pool.push(prefix);for(const[key]of matched)selected.set(key,index);}
 const used=[...new Set(selected.values())],remap=new Map(used.map((id,i)=>[id,i])),prefixes=used.map(id=>pool[id]),data={};
 for(const[key,value]of entries)data[key]=selected.has(key)?[remap.get(selected.get(key)),value.slice(pool[selected.get(key)].length)]:value;
 const before=Buffer.byteLength(JSON.stringify(content)),after=Buffer.byteLength(JSON.stringify(data))+Buffer.byteLength(JSON.stringify(prefixes));return{prefixes,data,savedBytes:before-after};
};
