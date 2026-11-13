import {UserInputError} from '../../core/errors';
import {cents} from '../../core/money';
export type DeductionRule={mode:'fixed'|'percentage';percentage:string;base:'gross'|'adjusted'|'custom'|'threshold';baseCents:number|null;definition:string;description?:string;fixedCents:number|null;active:boolean;payer:string;year:string;thresholdCents:number|null;openingCents:number|null};
export type AppliedCalculation={rule:DeductionRule;baseCents:number;grossCents:number|null;priorCents:number|null;amountCents:number};
export const blankRule=():DeductionRule=>({mode:'fixed',percentage:'',base:'gross',baseCents:null,definition:'',fixedCents:null,active:true,payer:'',year:'',thresholdCents:null,openingCents:null});
export const payerKey=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
function nonnegative(n:number|null,label:string):number{if(n===null||cents(n)<0)throw new UserInputError(`Completa ${label} con un importe no negativo.`);return n;}
/** El porcentaje se interpreta como decimal exacto; 7.5 significa 7.5%, nunca 0.075%. */
export function percentAmount(base:number,percentage:string){
 nonnegative(base,'la base');if(!/^\d{1,3}(?:[.,]\d{1,6})?$/.test(percentage))throw new UserInputError('Introduce un porcentaje entre 0 y 100, con hasta seis decimales.');
 const [whole,fraction='']=percentage.replace(',','.').split('.');const scale=10n**BigInt(fraction.length);const rate=BigInt(whole)*scale+BigInt(fraction||'0');if(rate>100n*scale)throw new UserInputError('El porcentaje no puede superar 100%.');
 const denominator=100n*scale;return cents(Number((BigInt(base)*rate+denominator/2n)/denominator));
}
export function validateRule(rule:DeductionRule,allowIncomplete=false){
 if(!['fixed','percentage'].includes(rule.mode)||!['gross','adjusted','custom','threshold'].includes(rule.base)||typeof rule.active!=='boolean'||rule.definition.length>240||(rule.description?.length??0)>240||rule.payer.length>240)throw new UserInputError('Revisa la regla de deducción.');
 for(const n of [rule.baseCents,rule.fixedCents,rule.thresholdCents,rule.openingCents])if(n!==null)nonnegative(n,'la regla');
 if(rule.percentage!=='')percentAmount(0,rule.percentage);
 if(allowIncomplete||!rule.active)return;
 if(rule.mode==='fixed'){nonnegative(rule.fixedCents,'el importe fijo');return;}
 percentAmount(0,rule.percentage);
 if(rule.base==='adjusted'||rule.base==='custom'){nonnegative(rule.baseCents,'la base ajustada o personalizada');if(!rule.definition.trim())throw new UserInputError('Explica cómo definiste la base ajustada o personalizada.');}
 if(rule.base==='threshold'){if(!payerKey(rule.payer)||!/^20\d{2}$/.test(rule.year))throw new UserInputError('Confirma el pagador legal y el año natural de la regla.');nonnegative(rule.thresholdCents,'el umbral exento');nonnegative(rule.openingCents,'el acumulado anterior a los registros de la app');}
}
export function calculateDeduction(rule:DeductionRule,gross:number|null,historyCents:number=0):AppliedCalculation{
 validateRule(rule);if(!rule.active)throw new UserInputError('La regla está desactivada. Actívala antes de aplicarla.');
 let base=0,prior:number|null=null,amount=0;
 if(rule.mode==='fixed'){amount=rule.fixedCents!;}else{
  if(rule.base==='gross'||rule.base==='threshold')base=nonnegative(gross,'el ingreso bruto');else base=rule.baseCents!;
  if(rule.base==='threshold'){prior=cents(rule.openingCents!+nonnegative(historyCents,'el historial del pagador'));base=cents(Math.max(0,cents(prior+base)-rule.thresholdCents!)-Math.max(0,prior-rule.thresholdCents!));}
  amount=percentAmount(base,rule.percentage);
 }
 return {rule:{...rule},baseCents:base,grossCents:gross,priorCents:prior,amountCents:amount};
}
