import {educationOwner,eduSecret} from './owner-security.mjs';
const READER_CONFIG='receipt-service/config-v1.json';
const srJson=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readerConfig(env){const obj=await env.BUCKET?.get(READER_CONFIG);return obj?await obj.json():{enabled:true};}
async function readerCrypto(env){if(!/^[a-f0-9]{64}$/.test(env.EDUCATION_VAULT_KEY??''))throw Error('server_key_missing');return crypto.subtle.importKey('raw',Uint8Array.from(env.EDUCATION_VAULT_KEY.match(/../g),v=>parseInt(v,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
const srHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
async function readerSeal(env,key){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:srHex(iv),ciphertext:srHex(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('EduMoney shared receipt reader v1')},await readerCrypto(env),new TextEncoder().encode(key))))};}
export async function sharedReaderKey(env){if(!env.BUCKET)return null;const config=await readerConfig(env);if(config.enabled===false)return null;if(!config.secret)return eduSecret(env);const bytes=s=>Uint8Array.from(s.match(/../g),v=>parseInt(v,16));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(config.secret.iv),additionalData:new TextEncoder().encode('EduMoney shared receipt reader v1')},await readerCrypto(env),bytes(config.secret.ciphertext)));}
export async function sharedReaderStatus(env){try{const config=await readerConfig(env);return {enabled:config.enabled!==false,configured:!!await sharedReaderKey(env),dailyLimit:config.limitSetByOwner===true?config.dailyLimit:null,provider:'Anthropic',model:'claude-haiku-5-5'};}catch{return {enabled:false,configured:false,provider:'Anthropic',model:'claude-haiku-5-5'};}}
/** Atomic conditional reservations bound public usage; no image, text or raw IP is stored. */
async function readerClaim(env,key,limit){for(let attempt=0;attempt<4;attempt++){const obj=await env.BUCKET.get(key);const value=obj?await obj.json():{count:0};if(value.count>=limit)return false;const saved=await env.BUCKET.put(key,JSON.stringify({count:value.count+1}),{onlyIf:new Headers(obj?{'If-Match':obj.httpEtag}:{'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});if(saved)return true;}return false;}
export async function reserveSharedReading(_request,env){const config=await readerConfig(env);if(config.enabled===false)return false;if(config.limitSetByOwner!==true||!Number.isSafeInteger(config.dailyLimit)||config.dailyLimit<1)return true;const day=new Date().toISOString().slice(0,10);return readerClaim(env,`receipt-service/owner-usage/${day}/total`,config.dailyLimit);}

export async function handleSharedReader(request,env,fetcher=fetch){
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return srJson({message:'Origen no permitido.'},403);
 const admin=new URL(request.url).pathname.endsWith('/admin');
 if(!admin)return request.method==='GET'?srJson(await sharedReaderStatus(env)):srJson({message:'Método no permitido.'},405);
 if(!await educationOwner(request,env))return srJson({message:'Acceso reservado al propietario.'},403);
 if(!env.BUCKET)return srJson({message:'Almacenamiento no disponible.'},503);
 if(request.method==='GET'){const status=await sharedReaderStatus(env);return srJson({...status,owner:true});}
 if(request.method!=='POST')return srJson({message:'Método no permitido.'},405);
 try{if(Number(request.headers.get('Content-Length'))>2048)return srJson({message:'Solicitud demasiado grande.'},413);const text=await request.text();if(text.length>2048)return srJson({message:'Solicitud demasiado grande.'},413);const body=JSON.parse(text);const old=await env.BUCKET.get(READER_CONFIG),config=old?await old.json():{enabled:true};
 if(body.action==='configure'){if(!/^sk-ant-[A-Za-z0-9_-]{20,249}$/.test(body.key??''))return srJson({message:'Clave de API no válida.'},400);const check=await fetcher('https://api.anthropic.com/v1/models/claude-haiku-5-5',{headers:{'x-api-key':body.key,'anthropic-version':'2023-06-01'},signal:AbortSignal.timeout(20000)});if(!check.ok)return srJson({message:'Anthropic no pudo verificar esta clave y modelo.'},400);const model=await check.json();if(model.type!=='model'||!/^claude-haiku-5-5(?:-\d{8})?$/.test(model.id??''))return srJson({message:'El modelo no se pudo verificar.'},400);config.secret=await readerSeal(env,body.key);config.enabled=true;
 }else if(body.action==='disable'){config.enabled=false;
 }else if(body.action==='enable'){config.enabled=true;
 }else if(body.action==='remove'){config.enabled=false;delete config.secret;
 }else if(body.action==='limit'){if(body.dailyLimit===null){delete config.dailyLimit;config.limitSetByOwner=false;}else{if(!Number.isSafeInteger(body.dailyLimit)||body.dailyLimit<1)return srJson({message:'Escribe un número entero positivo o deja el campo vacío para no limitar.'},400);config.dailyLimit=body.dailyLimit;config.limitSetByOwner=true;}
 }else return srJson({message:'Acción no válida.'},400);
 const saved=await env.BUCKET.put(READER_CONFIG,JSON.stringify(config),{onlyIf:new Headers(old?{'If-Match':old.httpEtag}:{'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});if(!saved)return srJson({message:'La configuración cambió. Vuelve a intentarlo.'},409);return srJson(await sharedReaderStatus(env));
 }catch{return srJson({message:'No se pudo actualizar el lector. La clave nunca se devuelve al navegador.'},503);}
}
