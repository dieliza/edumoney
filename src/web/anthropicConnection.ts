import {activateAnthropic,activateLocalReader,readerSnapshot,validateAnthropicKey} from './anthropicSession';
import {deleteWebAnthropicKey,getWebAnthropicKey,setWebAnthropicKey} from './vault';
let restoring:Promise<void>|undefined;
let revision=0;
export function restoreAnthropicConnection(){return restoring??= (async()=>{const before=revision;const key=await getWebAnthropicKey();if(before===revision&&readerSnapshot()==='local'&&key)activateAnthropic(key);})().catch(error=>{restoring=undefined;throw error;});}
export async function connectAnthropic(value:string){
 const key=validateAnthropicKey(value);
 let response:Response;try{response=await fetch('/api/receipt-reader-activation',{method:'POST',headers:{'X-Anthropic-Key':key},cache:'no-store',signal:AbortSignal.timeout(25000)});}catch{throw Error('No se pudo conectar con Anthropic. Tu clave sigue en el campo; vuelve a intentar.');}
 const result=await response.json().catch(()=>null);if(!response.ok||result?.verified!==true||result?.model!=='claude-haiku-5-5')throw Error(typeof result?.message==='string'?result.message:'Anthropic no pudo verificar esta conexión.');
 await setWebAnthropicKey(key);revision++;activateAnthropic(key);
}
export async function disconnectAnthropic(){await deleteWebAnthropicKey();revision++;activateLocalReader();}
