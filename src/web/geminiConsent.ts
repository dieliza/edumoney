const CONSENT_KEY='edumoney.gemini-photo-consent.v1';
let pending:((ok:boolean)=>void)|null=null;const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
export const geminiConsentOpen=()=>pending!==null;
export function hasGeminiConsent():boolean{try{return globalThis.localStorage?.getItem(CONSENT_KEY)==='accepted';}catch{return false;}}
export const subscribeGeminiConsent=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function revokeGeminiConsent(){try{globalThis.localStorage?.removeItem(CONSENT_KEY);}catch{/* La lectura volverá a pedir autorización si no puede recordar la elección. */}answerGeminiConsent(false);}
export function answerGeminiConsent(ok:boolean){const resolve=pending;if(ok&&resolve){try{globalThis.localStorage?.setItem(CONSENT_KEY,'accepted');}catch{/* Sin almacenamiento disponible, se autoriza únicamente esta lectura. */}}pending=null;notify();resolve?.(ok);}
/** Recuerda únicamente la autorización, nunca la clave ni la foto. */
export function requestGeminiConsent():Promise<boolean>{if(hasGeminiConsent())return Promise.resolve(true);answerGeminiConsent(false);return new Promise(resolve=>{pending=resolve;notify();});}
