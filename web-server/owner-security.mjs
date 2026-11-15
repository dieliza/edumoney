export async function educationOwner(request,env){
 if((env.EDUCATION_OWNER_ID&&request.headers.get('oai-authenticated-user-id')===env.EDUCATION_OWNER_ID)||(env.EDUCATION_OWNER_EMAIL&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.EDUCATION_OWNER_EMAIL.toLowerCase()))return true;
 const token=/^Bearer edumoney-device\.([a-f0-9]{64})$/.exec(request.headers.get('Authorization')??'')?.[1];
 if(!token||!/^[a-f0-9]{64}$/.test(env.EDUCATION_OWNER_DEVICE_HASH??''))return false;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 return hash===env.EDUCATION_OWNER_DEVICE_HASH;
}
async function eduCryptoKey(env){if(!/^[a-f0-9]{64}$/.test(env.EDUCATION_VAULT_KEY??''))throw Error('server_key_missing');return crypto.subtle.importKey('raw',Uint8Array.from(env.EDUCATION_VAULT_KEY.match(/../g),b=>parseInt(b,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function eduSeal(env,key){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('EduMoney education generator v1')},await eduCryptoKey(env),new TextEncoder().encode(key)));const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({iv:hex(iv),ciphertext:hex(ciphertext)});}
export async function eduSecret(env){const obj=await env.BUCKET.get('education/generator-key-v1.json');if(!obj)return null;const e=await obj.json(),bytes=s=>Uint8Array.from(s.match(/../g),b=>parseInt(b,16));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(e.iv),additionalData:new TextEncoder().encode('EduMoney education generator v1')},await eduCryptoKey(env),bytes(e.ciphertext)));}
