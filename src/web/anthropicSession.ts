let key='';let mode:'local'|'anthropic'='local';const listeners=new Set<()=>void>();
export const readerSnapshot=()=>mode;
export const subscribeReader=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function activateAnthropic(value:string){value=value.trim();if(!/^sk-ant-[A-Za-z0-9_-]{20,249}$/.test(value))throw Error('Introduce una clave válida de Anthropic Console.');key=value;mode='anthropic';listeners.forEach(fn=>fn());}
export function activateLocalReader(){key='';mode='local';listeners.forEach(fn=>fn());}
/** La clave es de la persona y solo vive en memoria: no va a registros, URLs, respaldos ni código publicado. */
export function anthropicSessionKey(){if(mode!=='anthropic'||!key)throw Error('Activa Anthropic con tu clave en Configuración → Lector de recibos.');return key;}
