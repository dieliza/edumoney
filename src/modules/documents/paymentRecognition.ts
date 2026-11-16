import type {PaymentMethod} from '../money/types';
/** Only explicit tender/utterances; logos and card brands alone do not establish payment. */
export function recognizedPayment(text:string,structured?:string|null,mode:'utterance'|'document'='utterance'):PaymentMethod|null {
 if(structured&&['cash','check','debit','credit','bank','other'].includes(structured))return structured as PaymentMethod;
 const evidence=text.split(/\n/).filter(line=>!/(?:aceptamos|metodos aceptados|we accept|payment methods accepted)/i.test(line)).filter(line=>mode==='utterance'||/(?:pagad|pago|payment|tender|paid|method|metodo)/i.test(line)||/(?:ath|cash|efectivo|cheque|check|debit|credit)[^\n]{0,25}\d+[.,]\d{2}/i.test(line)).join(' ');
 const s=evidence.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=new Set<PaymentMethod>();
 if(/\b(?:ath(?:\s+movil)?|debit(?:o)?|tarjeta de debito)\b/.test(s))found.add('debit');
 if(/\b(?:cash|efectivo)\b/.test(s))found.add('cash');
 if(/\b(?:check|cheque)\b/.test(s))found.add('check');
 if(/\b(?:credit|credito)\b/.test(s))found.add('credit');
 if(/\b(?:transferencia bancaria|deposito bancario|bank transfer|direct deposit|deposito directo)\b/.test(s))found.add('bank');
 // Explicit negative statements are not evidence of a payment method.
 if(/\b(?:no|sin|not)\s+(?:pague?\s+(?:con|en)\s+|use\s+)?(?:cash|efectivo|cheque|ath|debito|credito)\b/.test(s))return null;
 if(structured&&['cash','check','debit','credit','bank','other'].includes(structured))found.add(structured as PaymentMethod);
 return found.size===1?[...found][0]:null;
}
