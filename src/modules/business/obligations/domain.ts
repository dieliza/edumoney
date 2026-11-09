import { addAmounts,cents } from '../../../core/money';
import { UserInputError } from '../../../core/errors';
import { validDate,validMonth } from '../../money/domain';
import { MUNICIPALITIES,NON_PARTICIPATING,RULE_VERSION,VERIFIED_ON,rateLabels } from './catalog';
import type { ContractorPayment,ObligationForm,Provider,Relief,SUTOffer,SavedPayment,ObligationRecord,SUTCollection,ObligationsSnapshot } from './types';
export const sumKnown=(values:(number|null)[])=>values.some(v=>v===null)?null:addAmounts(...values.map(v=>cents(v!)));
export function percentOf(amount:number,rateBps:number){cents(amount);if(amount<0||!Number.isSafeInteger(rateBps)||rateBps<0||rateBps>10000)throw new UserInputError('Importe o porcentaje fuera de rango.');return cents(Number((BigInt(amount)*BigInt(rateBps)+5000n)/10000n));}
export function municipalProcedure(municipality:string,period:string){
 if(!validMonth(period))return 'Período pendiente';
 if(!MUNICIPALITIES.includes(municipality))return 'Municipio pendiente de confirmar';
 if(period<'2026-07')return 'Procedimiento municipal/COFIM del período anterior; confirmar trámite';
 return NON_PARTICIPATING.includes(municipality)?'Radicación y pago municipal separados; confirmar procedimiento del municipio':'SURI: planilla consolidada; pagos estatal y municipal separados';
}
export function evaluateSUT(offer:SUTOffer,baseCents:number|null,date:string) {
 const pending:string[]=[],assumptions=['Simulación del escenario seleccionado; no confirma por sí sola la clasificación legal.','Redondeo de cada componente al centavo más cercano; no sustituye ajustes de planilla, créditos ni reglas especiales.'];
 if(!validDate(date))throw new UserInputError('Fecha de simulación no válida.');
 if(baseCents!==null&&(cents(baseCents)<0))throw new UserInputError('La base no puede ser negativa.');
 if(!offer.nature.trim())pending.push('Describir qué producto, servicio, acceso o contenido recibe el comprador.');
 if(offer.classificationConfirmed!=='yes'||!offer.classificationReference.trim())pending.push('Confirmar naturaleza tributable/exenta y su fundamento. Suscripción o membresía no determinan la tasa por sí solas.');
 if(offer.destination==='pending')pending.push('Confirmar destino/fuente de la venta; para digitales revisar la ubicación del comprador.');
 if(offer.destination==='outside')pending.push('Venta fuera de PR: verificar fuente y obligaciones de la otra jurisdicción; no se presume exención universal.');
 if(offer.customer==='pending')pending.push('Confirmar si el cliente es consumidor o comerciante.');
 if(offer.collectorCertificate!=='yes')pending.push('Confirmar certificado de comerciante, nexo y responsabilidad de cobro.');
 if(!MUNICIPALITIES.includes(offer.municipality))pending.push('Confirmar municipio de la transacción/localidad.');
 if(offer.channel==='pending')pending.push('Confirmar canal de venta.');
 if(offer.rate==='pending')pending.push('Seleccionar tasa o exención con fundamento verificable.');
 if(offer.rate==='special4'&&!offer.volumeReference.trim())pending.push('Revisar tipo de servicio, volumen del año anterior/grupo controlado y certificado; el umbral de $200,000 no aplica a todo servicio.');
 if(offer.rate==='special4'&&offer.customer==='consumer')pending.push('Confirmar si es profesional designado: la tasa B2B no se aplica automáticamente a un consumidor.');
 if(offer.rate==='exempt'&&!offer.classificationReference.trim())pending.push('Documentar la exención aplicable, no solo el nombre de la oferta.');
 if(offer.rate==='prepared7')pending.push('Confirmar certificado y condiciones de alimentos preparados; no se presume elegibilidad por el nombre.');
 if(offer.validFrom>date||(offer.validTo!==null&&offer.validTo<date))pending.push('La clasificación guardada no cubre la fecha de la operación.');
 if(date>VERIFIED_ON||date.slice(0,4)!=='2026')pending.push('Confirmar vigencia y avisos para la fecha; el catálogo se verificó el '+VERIFIED_ON+'.');
 let collector:'merchant'|'marketplace'|'none'|'pending'='pending';
 if(offer.channel!=='marketplace'&&offer.rate==='exempt'&&offer.classificationConfirmed==='yes'&&offer.classificationReference.trim()&&offer.destination==='pr')collector='none';
 else if(offer.destination==='pr'&&offer.collectorCertificate==='yes') {
  if(offer.channel==='direct'||offer.channel==='website')collector='merchant';
  else if(offer.channel==='marketplace'&&offer.marketplaceConfirmed==='yes'&&offer.marketplaceWaiver.trim())collector='marketplace';
 }
 if(offer.channel==='marketplace'&&(offer.marketplaceConfirmed!=='yes'||!offer.marketplaceWaiver.trim()))pending.push('Confirmar facilitador registrado, alcance de cobro/remisión y relevo del vendedor; una pasarela de pago no basta.');
 if(offer.channel==='marketplace'&&offer.rate!=='standard'&&offer.rate!=='pending')pending.push('Confirmar que el tratamiento reducido o exento aplica a la venta del facilitador; el certificado del vendedor no se transfiere automáticamente.');
 const rates=offer.rate==='standard'?[1050,100]:offer.rate==='special4'?[400,0]:offer.rate==='prepared7'?[600,100]:offer.rate==='exempt'?[0,0]:null;
 const stateCents=baseCents===null||!rates?null:percentOf(baseCents,rates[0]);
 const municipalCents=baseCents===null||!rates?null:percentOf(baseCents,rates[1]);
 return {ruleVersion:RULE_VERSION,scenario:rateLabels[offer.rate],stateRateBps:rates?.[0]??null,municipalRateBps:rates?.[1]??null,stateCents,municipalCents,totalCents:sumKnown([stateCents,municipalCents]),collector,remitter:collector,procedure:municipalProcedure(offer.municipality,date.slice(0,7)),pending,assumptions,sources:['ivu2026','monthly','municipal','digital','marketplace','b2b']};
}
function reliefFor(p:ContractorPayment,reliefs:Relief[],pending:string[]) {
 if(p.reliefStatus==='pending'){pending.push('Confirmar si existe relevo o excepción.');return null;}
 if(p.reliefStatus==='none')return p.scope==='statutory_exempt'?(pending.push('Confirmar declaración jurada de la excepción 1062.03(b).'),null):1000;
 const r=reliefs.find(r=>r.id===p.reliefId&&r.providerId===p.providerId);
 if(!r||!r.reference.trim()||p.date<r.validFrom||(r.validTo!==null&&p.date>r.validTo)){pending.push('El documento no cubre proveedor/fecha; confirmar relevo o tratamiento aplicable.');return null;}
 if(p.scope==='statutory_exempt'&&r.kind!=='statutory'){pending.push('La excepción estatutaria requiere su fundamento y declaración; no se confunde con relevo de Hacienda.');return null;}
 if(p.scope!=='statutory_exempt'&&r.kind==='statutory'){pending.push('Confirma el tipo de pago amparado por la declaración jurada.');return null;}
 return r.kind==='partial6'?600:0;
}
/** Agrupa por titular pagador + proveedor legal + año natural, nunca por proyecto o DBA. */
export function evaluateWithholding(p:ContractorPayment,records:SavedPayment[],providers:Provider[],reliefs:Relief[]) {
 if(!validDate(p.date))throw new UserInputError('Fecha de simulación no válida.');
 for(const v of [p.servicesCents,p.ivuCents,p.reimbursedCents,p.actualWithheldCents,p.actualNetCents])if(v!==null&&cents(v)<0)throw new UserInputError('Los importes no pueden ser negativos.');
 const pending:string[]=[],provider=records.find(v=>v.id===p.id)?.providerAtSave??providers.find(v=>v.id===p.providerId);
 const sequence=records.find(v=>v.id===p.id)?.sequence??Number.MAX_SAFE_INTEGER;
 const prior=records.filter(v=>!v.voidedAt&&v.id!==p.id&&v.holderId===p.holderId&&v.providerId===p.providerId&&v.date.slice(0,4)===p.date.slice(0,4)&&(v.date<p.date||(v.date===p.date&&v.sequence<sequence))&&v.scope!=='excluded');
 const before=sumKnown(prior.map(v=>['pending','special'].includes(v.scope)||(v.scope==='ordinary'&&!['individual','corporation','pass_through'].includes(v.providerAtSave.classification))?null:v.servicesCents));
 const currentTotal=p.scope==='excluded'?before:sumKnown([before,p.servicesCents]);
 if(p.servicesCents===null)pending.push('Confirmar importe de servicios, separado de IVU y reembolsos.');
 if(before===null)pending.push('Completar bases desconocidas de pagos anteriores del mismo año.');
 if(p.scope==='pending'||p.scope==='special')pending.push('Confirmar naturaleza del pago y regla aplicable; caso especial no se calcula como ordinario.');
 if(p.scope==='ordinary'&&(!provider||!['individual','corporation','pass_through'].includes(provider.classification)))pending.push('Confirmar clasificación/residencia PR del proveedor. No se aplica automáticamente a empleado, no residente o caso especial.');
 let rateBps:number|null=null;
 if(p.scope==='excluded')rateBps=0;
 else if((p.scope==='ordinary'&&provider&&['individual','corporation','pass_through'].includes(provider.classification))||p.scope==='statutory_exempt')rateBps=reliefFor(p,reliefs,pending);
 if(p.date.slice(0,4)!=='2026'||p.date>VERIFIED_ON)pending.push('Revalidar vigencia para la fecha: el formulario y catálogo revisados corresponden a 2026.');
 const taxableCents=p.servicesCents===null||before===null?null:Math.max(0,currentTotal!-50000)-Math.max(0,before-50000);
 const expectedWithheldCents=rateBps===null?null:rateBps===0?0:taxableCents===null?null:percentOf(taxableCents,rateBps);
 const difference=p.actualWithheldCents===null||expectedWithheldCents===null?null:cents(p.actualWithheldCents-expectedWithheldCents);
 return {ruleVersion:RULE_VERSION,beforeCents:before,cumulativeCents:currentTotal,taxableCents,rateBps,expectedWithheldCents,actualWithheldCents:p.actualWithheldCents,differenceCents:difference,pending,
  assumptions:['Escenario ordinario: primeros $500 sin retención por pagador/proveedor/año; se grava solo el exceso incremental.','Mismo día: orden de registro. Un pago anterior añadido después puede cambiar la simulación de pagos posteriores, nunca su retención real registrada.','IVU y reembolsos separados no se agregan a la base de servicios. Casos especiales y elección por sucursal requieren revisión específica.','Pagos excluidos de esta retención pueden tener otras obligaciones; no se determina exención de todo impuesto.'],sources:['sp2026','deposits','exceptions']};
}
export function nominalDueDate(form:ObligationForm,period:string):string|null {
 if((form==='deposit'||form==='SC2915')&&validMonth(period)){const [y,m]=period.split('-').map(Number);return new Date(Date.UTC(y,m,form==='deposit'?15:20)).toISOString().slice(0,10);}
 if(form==='4806SP1'&&/^\d{4}-Q[1-4]$/.test(period))return new Date(Date.UTC(Number(period.slice(0,4)),Number(period.at(-1))*3+1,0)).toISOString().slice(0,10);
 if(['4806SP','4806SP2'].includes(form)&&/^\d{4}$/.test(period))return `${Number(period)+1}-02-28`;
 return null;
}

export function obligationBaseDue(o:Pick<ObligationRecord,'flow'|'form'|'period'>){return nominalDueDate(o.flow==='ivu'&&o.form==='deposit'?'SC2915':o.form,o.period);}
export const collectionTotal=(c:Pick<SUTCollection,'collectedCents'|'stateCents'|'municipalCents'>)=>c.collectedCents??sumKnown([c.stateCents,c.municipalCents]);
export function sutSummary(data:ObligationsSnapshot,holderId:string,month:string) {
 if(!validMonth(month))throw new UserInputError('Elige un período AAAA-MM.');
 const rows=data.collections.filter(c=>!c.voidedAt&&c.holderId===holderId&&c.date.startsWith(month));
 const own=rows.filter(c=>c.actor==='merchant'),marketplace=rows.filter(c=>c.actor==='marketplace');
 const remittances=data.obligations.filter(o=>!o.voidedAt&&o.holderId===holderId&&o.flow==='ivu'&&o.kind==='remittance'&&o.period===month&&o.status==='confirmed');
 const collectedCents=sumKnown(own.map(collectionTotal)),remittedCents=sumKnown(remittances.map(o=>o.amountCents));
 return {collectedCents,marketplaceCents:sumKnown(marketplace.map(collectionTotal)),actorPending:rows.filter(c=>c.actor==='pending').length,remittedCents,differenceCents:collectedCents===null||remittedCents===null?null:cents(collectedCents-remittedCents),stateCollectedCents:sumKnown(own.map(c=>c.stateCents)),municipalCollectedCents:sumKnown(own.map(c=>c.municipalCents)),pendingRecords:rows.filter(c=>collectionTotal(c)===null).length};
}
export function contractorSummary(data:ObligationsSnapshot,holderId:string,providerId:string,year:string) {
 if(!/^\d{4}$/.test(year))throw new UserInputError('Elige un año natural de cuatro dígitos.');
 const rows=data.payments.filter(p=>!p.voidedAt&&p.holderId===holderId&&p.providerId===providerId&&p.date.startsWith(year));
 const services=rows.filter(p=>p.scope!=='excluded');
 const calculated=rows.map(p=>evaluateWithholding(p,data.payments,data.providers,data.reliefs));
 return {servicesCents:sumKnown(services.map(p=>p.servicesCents)),excludedCents:sumKnown(rows.filter(p=>p.scope==='excluded').map(p=>p.servicesCents)),actualWithheldCents:sumKnown(rows.map(p=>p.actualWithheldCents)),expectedWithheldCents:sumKnown(calculated.map(r=>r.expectedWithheldCents)),pendingCount:calculated.filter(r=>r.pending.length||r.expectedWithheldCents===null).length,count:rows.length};
}
