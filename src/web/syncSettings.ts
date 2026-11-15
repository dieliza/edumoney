import {getWebSettings as read,setWebSettings as write} from './vault';
let queue:Promise<unknown>=Promise.resolve();
function serialized<T>(task:()=>Promise<T>):Promise<T>{const next=queue.then(task);queue=next.catch(()=>{});return next;}
export function getWebSettings<T>():Promise<T|undefined>{return serialized(()=>read<T>());}
export function setWebSettings(value:unknown){return serialized(()=>write(value));}
export function updateWebSettings<T>(change:(current:T|undefined)=>T|undefined){return serialized(async()=>{const next=change(await read<T>());if(next!==undefined)await write(next);});}
