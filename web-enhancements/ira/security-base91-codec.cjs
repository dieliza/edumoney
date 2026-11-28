// Lossless transport of already-compressed assets. All decoded payloads remain unchanged.
const legacy=require('../goal-race/z85-pool-codec.cjs');
function pack(value){
 if(typeof value!=='string'||value.length<256||!/^[A-Za-z0-9+/]+=*$/.test(value))return value;
 const end=Math.floor(value.replace(/=+$/,'').length/4)*4,bytes=Buffer.from(value.slice(0,end),'base64');
 const alphabet=Array.from({length:94},(_,i)=>String.fromCharCode(i+33)).filter(c=>c!=='"'&&c!=="'"&&c!=='\\').join('');
 let b=0,n=0,out='';for(const byte of bytes){b|=byte<<n;n+=8;if(n>13){let v=b&8191;if(v>88){b>>>=13;n-=13;}else{v=b&16383;b>>>=14;n-=14;}out+=alphabet[v%91]+alphabet[Math.floor(v/91)];}}
 if(n){out+=alphabet[b%91];if(n>7||b>90)out+=alphabet[Math.floor(b/91)];}
 const encoded={q:out,t:value.slice(end)};return JSON.stringify(encoded).length<value.length?encoded:value;
}
module.exports={pack,unpack85:legacy.unpack85};
