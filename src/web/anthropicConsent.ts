const CONSENT_KEY='edumoney.anthropic-photo-consent.v1';
let pending:((ok:boolean)=>void)|null=null;const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
export const anthropicConsentOpen=()=>pending!==null;
export function hasAnthropicConsent():boolean{try{return globalThis.localStorage?.getItem(CONSENT_KEY)==='accepted';}catch{return false;}}
export const subscribeAnthropicConsent=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function revokeAnthropicConsent(){try{globalThis.localStorage?.removeItem(CONSENT_KEY);}catch{/* La lectura volverá a pedir autorización si no puede recordar la elección. */}answerAnthropicConsent(false);}
export function answerAnthropicConsent(ok:boolean){const resolve=pending;if(ok&&resolve){try{globalThis.localStorage?.setItem(CONSENT_KEY,'accepted');}catch{/* Sin almacenamiento disponible, se autoriza únicamente esta lectura. */}}pending=null;notify();resolve?.(ok);}
/** Recuerda únicamente la autorización, nunca la clave ni la foto. */
export function requestAnthropicConsent():Promise<boolean>{if(hasAnthropicConsent())return Promise.resolve(true);answerAnthropicConsent(false);return new Promise(resolve=>{pending=resolve;notify();});}
