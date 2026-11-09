import { UserInputError } from '../../../core/errors';
import { cents } from '../../../core/money';
import { validDate,validMonth } from '../../money/domain';
import { MUNICIPALITIES,providerLabels,rateLabels,reliefLabels } from './catalog';
import { nominalDueDate } from './domain';
import type { ContractorPayment,ObligationRecord,Provider,Relief,SUTCollection,SUTOffer } from './types';
function text(v:unknown,max:number,required=false):v is string{return typeof v==='string'&&v.length<=max&&(!required||!!v.trim());}
export function checkId(v:unknown){if(!text(v,100,true))throw new UserInputError('Identificador local no válido.');}
export function optionalMoney(v:number|null){if(v!==null&&cents(v)<0)throw new UserInputError('Los importes conocidos deben ser no negativos; deja en blanco los desconocidos.');}
const dateRange=(from:string,to:string|null)=>validDate(from)&&(to===null||(validDate(to)&&to>=from));
export function validateOffer(o:SUTOffer) {
 checkId(o.id);checkId(o.holderId);
 if(!text(o.name,200,true)||!text(o.nature,2000)||!['product','service','subscription','membership'].includes(o.kind)||!['direct','website','marketplace','pending'].includes(o.channel)||!['consumer','business','mixed','pending'].includes(o.customer)||!['pr','outside','pending'].includes(o.destination)||!Object.hasOwn(rateLabels,o.rate)||!text(o.municipality,100)||(o.municipality!==''&&!MUNICIPALITIES.includes(o.municipality))||!dateRange(o.validFrom,o.validTo))throw new UserInputError('Revisa oferta, canal, municipio y fechas de clasificación.');
 for(const a of [o.collectorCertificate,o.classificationConfirmed,o.marketplaceConfirmed])if(!['yes','no','pending'].includes(a))throw new UserInputError('Revisa los estados pendientes de confirmar.');
 for(const v of [o.classificationReference,o.marketplaceWaiver,o.volumeReference])if(!text(v,2000))throw new UserInputError('Las referencias deben tener hasta 2,000 caracteres.');
}
export function validateCollection(c:SUTCollection,today:string){
 checkId(c.id);checkId(c.holderId);checkId(c.offerId);
 if(!validDate(c.date)||c.date>today||!['merchant','marketplace','pending'].includes(c.actor)||!text(c.reference,240)||!text(c.note,2000,true))throw new UserInputError('Revisa fecha no futura, responsable y nota del registro de IVU.');
 for(const v of [c.baseCents,c.collectedCents,c.stateCents,c.municipalCents])optionalMoney(v);
 if(c.stateCents!==null&&c.municipalCents!==null)cents(Number(BigInt(c.stateCents)+BigInt(c.municipalCents)));
 if(c.collectedCents!==null&&c.stateCents!==null&&c.municipalCents!==null&&BigInt(c.stateCents)+BigInt(c.municipalCents)!==BigInt(c.collectedCents))throw new UserInputError('IVU estatal más municipal debe coincidir con el total confirmado.');
}
export function validateProvider(p:Provider){checkId(p.id);if(!text(p.name,200,true)||!text(p.reference,120,true)||!Object.hasOwn(providerLabels,p.classification)||!text(p.notes,2000))throw new UserInputError('Indica nombre legal, referencia local única y clasificación del proveedor.');}
export function validateRelief(r:Relief){checkId(r.id);checkId(r.providerId);if(!Object.hasOwn(reliefLabels,r.kind)||!dateRange(r.validFrom,r.validTo)||!text(r.reference,2000,true))throw new UserInputError('Revisa tipo, vigencia y referencia del certificado o declaración jurada.');}
export function validatePayment(p:ContractorPayment,today:string){
 checkId(p.id);checkId(p.holderId);checkId(p.providerId);
 if(!validDate(p.date)||p.date>today||!['ordinary','statutory_exempt','excluded','pending','special'].includes(p.scope)||!['none','pending','document'].includes(p.reliefStatus)||!text(p.note,2000,true))throw new UserInputError('Revisa fecha, naturaleza del pago y nota de confirmación.');
 if((p.reliefStatus==='document')!==!!p.reliefId)throw new UserInputError('Selecciona un documento o confirma que no se aplica uno.');
 for(const v of [p.servicesCents,p.ivuCents,p.reimbursedCents,p.actualWithheldCents,p.actualNetCents])optionalMoney(v);
 if([p.servicesCents,p.ivuCents,p.reimbursedCents,p.actualWithheldCents,p.actualNetCents].every(v=>v!==null)&&BigInt(p.servicesCents!)+BigInt(p.ivuCents!)+BigInt(p.reimbursedCents!)-BigInt(p.actualWithheldCents!)!==BigInt(p.actualNetCents!))throw new UserInputError('Servicios más IVU y reembolsos, menos retención, deben coincidir con el neto confirmado.');
}
export function validateObligation(o:ObligationRecord,today:string) {
 checkId(o.id);checkId(o.holderId);
 if(!['ivu','contractors'].includes(o.flow)||!['remittance','filing'].includes(o.kind)||!['state','municipal','combined','services'].includes(o.scope)||!['pending','confirmed','not_applicable'].includes(o.status)||!(o.form==='local_ivu'?validMonth(o.period):nominalDueDate(o.form,o.period))||!text(o.reference,240)||!text(o.note,2000,true)||!text(o.dueSource,2000))throw new UserInputError('Revisa período, formulario, estado y nota de la obligación.');
 if(!text(o.municipality,100)||(o.municipality!==''&&!MUNICIPALITIES.includes(o.municipality)))throw new UserInputError('Municipio de la obligación no válido.');
 if(o.flow==='ivu'&&(o.scope==='municipal'||o.form==='local_ivu')&&!MUNICIPALITIES.includes(o.municipality))throw new UserInputError('Identifica el municipio de la remesa o declaración municipal.');
 if(o.kind==='remittance'&&o.flow==='ivu'&&o.scope==='combined')throw new UserInputError('Registra por separado las remesas estatal y municipal.');
 if(o.form==='local_ivu'&&(o.scope!=='municipal'||(o.period>='2026-07'&&!['Bayamón','Carolina','Guaynabo','Mayagüez','San Juan'].includes(o.municipality))))throw new UserInputError('Para municipios participantes desde julio de 2026 usa la planilla de SURI; conserva trámite local para los no participantes.');
 const monthForm=o.kind==='remittance'?'deposit':o.form;
 if(o.kind==='remittance'&&(o.form!=='deposit'||!nominalDueDate(monthForm,o.period)||o.providerId!==null))throw new UserInputError('El depósito/remesa se registra por pagador y mes, separado de la informativa.');
 if(o.flow==='ivu'&&(o.providerId!==null||o.scope==='services'||(o.kind==='filing'&&!['SC2915','local_ivu'].includes(o.form))))throw new UserInputError('IVU usa su propio flujo, sin proveedor contratista.');
 if(o.flow==='contractors'&&(o.scope!=='services'||(o.kind==='filing'&&!['4806SP1','4806SP','4806SP2'].includes(o.form))))throw new UserInputError('Revisa el formulario del flujo de contratistas.');
 if((o.form==='4806SP')!==!!o.providerId)throw new UserInputError('La informativa 480.6SP se identifica por proveedor; las demás obligaciones son del pagador.');
 optionalMoney(o.amountCents);
 if(o.kind==='filing'&&o.amountCents!==null)throw new UserInputError('Presentar una declaración no registra otro pago.');
 if(o.status==='confirmed'&&(!o.reference.trim()||!o.date||!validDate(o.date)||o.date>today||(o.kind==='remittance'&&(o.amountCents===null||o.amountCents<=0))))throw new UserInputError('Una confirmación necesita fecha, referencia e importe positivo para depósitos.');
 if(o.status==='not_applicable'&&o.kind==='remittance')throw new UserInputError('Si no hubo remesa no confirmes un pago; conserva la obligación pendiente.');
 if(o.date!==null&&(!validDate(o.date)||o.date>today))throw new UserInputError('Fecha de confirmación no válida.');
 if(o.dueDate!==null&&(!validDate(o.dueDate)||!o.dueSource.trim()))throw new UserInputError('Un vencimiento confirmado necesita fecha y fuente propia.');
}
