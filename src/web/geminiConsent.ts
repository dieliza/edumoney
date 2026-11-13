let pending:((ok:boolean)=>void)|null=null;const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
export const geminiConsentOpen=()=>pending!==null;
export const subscribeGeminiConsent=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function answerGeminiConsent(ok:boolean){const resolve=pending;pending=null;notify();resolve?.(ok);}
/** Un diálogo dentro de EduMoney; no depende de window.confirm ni de permisos de modales del navegador. */
export function requestGeminiConsent():Promise<boolean>{answerGeminiConsent(false);return new Promise(resolve=>{pending=resolve;notify();});}
