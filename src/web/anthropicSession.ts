let key='';let mode:'local'|'anthropic'='local';const listeners=new Set<()=>void>();
export const readerSnapshot=()=>mode;
export const subscribeReader=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function validateAnthropicKey(value:string){value=value.trim();if(!/^sk-ant-[A-Za-z0-9_-]{20,249}$/.test(value))throw Error('Pega la clave de API completa que empieza por sk-ant-. No uses la contraseña de Anthropic ni la de EduMoney.');return value;}
export function activateAnthropic(value:string){key=validateAnthropicKey(value);mode='anthropic';listeners.forEach(fn=>fn());}
export function activateLocalReader(){key='';mode='local';listeners.forEach(fn=>fn());}
/** La copia activa vive en RAM; la conexión la conserva cifrada en vault.ts, fuera de registros, URLs, respaldos y código publicado. */
export function anthropicSessionKey(){if(mode!=='anthropic'||!key)throw Error('Activa Anthropic con tu clave en Configuración → Lector de recibos.');return key;}
