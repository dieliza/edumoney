let key='';let mode:'local'|'gemini'='local';const listeners=new Set<()=>void>();
export const readerSnapshot=()=>mode;
export const subscribeReader=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function activateGemini(value:string){value=value.trim();if(!/^[A-Za-z0-9_-]{20,256}$/.test(value))throw Error('Introduce una clave válida de Google AI Studio.');key=value;mode='gemini';listeners.forEach(fn=>fn());}
export function activateLocalReader(){key='';mode='local';listeners.forEach(fn=>fn());}
/** La clave es de la persona y solo vive en memoria: no va a registros, URLs, respaldos ni código publicado. */
export function geminiSessionKey(){if(mode!=='gemini'||!key)throw Error('Activa Gemini con tu clave en Configuración → Lector de recibos.');return key;}
