import {requestGeminiConsent} from '../../../web/geminiConsent';
import {UserInputError} from '../../../core/errors';
import {geminiSessionKey} from '../../../web/geminiSession';
import {prepareGeminiPhoto} from './preparePhoto.web';
import {geminiText,type GeminiReading} from './types';
import type {CaptureResult} from '../types';
export async function readGeminiPhoto(file:File):Promise<CaptureResult|null>{
 const key=geminiSessionKey();
 if(!await requestGeminiConsent())return null;
 const image=await prepareGeminiPhoto(file);let response:Response;
 try{response=await fetch('/api/receipt-read',{method:'POST',headers:{'Content-Type':'application/json','X-Gemini-Key':key},cache:'no-store',signal:AbortSignal.timeout(55000),body:JSON.stringify({image,consent:true})});}catch{throw new UserInputError('No se pudo completar la lectura con Gemini. No se guardó nada. Puedes reintentar o elegir lectura local.');}
 const result=await response.json().catch(()=>null);if(!response.ok||!result?.reading)throw new UserInputError(typeof result?.message==='string'?result.message:'La respuesta de Gemini no pudo validarse. No se guardó nada.');
 const reading=result.reading as GeminiReading;
 return {image,text:geminiText(reading),structured:reading,warning:'Lectura estructurada con Google Gemini. Revisa los campos antes de guardar. Los datos desconocidos quedan pendientes; no se calcula lo que no esté impreso.',needsAmountReview:false};
}
