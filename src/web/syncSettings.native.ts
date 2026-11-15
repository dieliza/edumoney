import * as SecureStore from 'expo-secure-store';
const key='edumoney.private-sync.v1';
async function read<T>():Promise<T|undefined>{const value=await SecureStore.getItemAsync(key);return value?JSON.parse(value) as T:undefined;}
async function write(value:unknown){await SecureStore.setItemAsync(key,JSON.stringify(value),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});}
let queue:Promise<unknown>=Promise.resolve();
function serialized<T>(task:()=>Promise<T>):Promise<T>{const next=queue.then(task);queue=next.catch(()=>{});return next;}
export function getWebSettings<T>():Promise<T|undefined>{return serialized(()=>read<T>());}
export function setWebSettings(value:unknown){return serialized(()=>write(value));}
export function updateWebSettings<T>(change:(current:T|undefined)=>T|undefined){return serialized(async()=>{const next=change(await read<T>());if(next!==undefined)await write(next);});}
