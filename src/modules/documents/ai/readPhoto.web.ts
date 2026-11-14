import {requestAnthropicConsent} from '../../../web/anthropicConsent';
import {UserInputError} from '../../../core/errors';
import {anthropicSessionKey} from '../../../web/anthropicSession';
import {prepareAnthropicPhoto} from './preparePhoto.web';
import {anthropicText,type AnthropicReading} from './types';
import type {CaptureResult} from '../types';
export async function readAnthropicPhoto(file:File):Promise<CaptureResult|null>{
 const key=anthropicSessionKey();
 if(!await requestAnthropicConsent())return null;
 const image=await prepareAnthropicPhoto(file);let response:Response;
 try{response=await fetch('/api/receipt-read',{method:'POST',headers:{'Content-Type':'application/json','X-Anthropic-Key':key},cache:'no-store',signal:AbortSignal.timeout(55000),body:JSON.stringify({image,consent:true})});}catch{throw new UserInputError('No se pudo completar la lectura con Anthropic. No se guardó nada. Puedes reintentar o elegir lectura local.');}
 const result=await response.json().catch(()=>null);if(!response.ok||!result?.reading)throw new UserInputError(typeof result?.message==='string'?result.message:'La respuesta de Anthropic no pudo validarse. No se guardó nada.');
 const reading=result.reading as AnthropicReading;
 return {image,text:anthropicText(reading),structured:reading,warning:'Lectura estructurada con Anthropic. Revisa los campos antes de guardar. Los datos desconocidos quedan pendientes; no se calcula lo que no esté impreso.',needsAmountReview:false};
}
