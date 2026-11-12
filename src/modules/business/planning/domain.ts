import { UserInputError } from '../../../core/errors';
import { addAmounts,cents } from '../../../core/money';
import { validDate } from '../../money/domain';
import { commercialAmount,netDeposit } from '../ledgerDomain';
import { nominalDueDate,municipalProcedure,obligationBaseDue } from '../obligations/domain';
import { ruleSources,VERIFIED_ON } from '../obligations/catalog';
import type { BusinessEntry } from '../ledgerTypes';
import type { Plan,PlanningSnapshot,Scenario } from './types';
export const sum=(values:number[])=>addAmounts(...values.map(cents));
export function knownSum(values:(number|null)[]):number|null{if(values.some(v=>v===null))return null;try{return sum(values as number[]);}catch(e){if(e instanceof UserInputError)return null;throw e;}}
const subtract=(a:number|null,b:number|null)=>a===null||b===null?null:knownSum([a,-b]);
export const planningSources=[...ruleSources,{id:'estimatedDates',name:'480.E-1: fechas base de estimada',url:'https://hacienda.pr.gov/sites/default/files/documentos/480_e-1_0.pdf',effective:'Cupón rev. 10.16 consultado 2026-11-09; fechas nominales para año calendario',summary:'Abril, junio, septiembre y diciembre para corporaciones; último plazo de individuos en enero siguiente. Confirmar obligación, régimen, feriados y avisos vigentes.'},{id:'calendar',name:'Calendario de Hacienda',url:'https://hacienda.pr.gov/calendario-contributivo',effective:'Consultado 2026-11-09; comprobar año de cada documento enlazado',summary:'No se infiere que un archivo enlazado sin año sea el calendario vigente. Se conservan fechas verificadas con fuente.'}];
export function panel(s:PlanningSnapshot,p:Plan,asOf:string){
 if(!validDate(asOf)||!asOf.startsWith(String(p.year)))throw new UserInputError('La fecha de corte debe pertenecer al año del panel.');
 const holder=s.ledger.holders.find(h=>h.id===p.holderId);if(!holder)throw new UserInputError('Titular no disponible.');
 const pending:string[]=[],profitParts:(number|null)[]=[],cashParts:(number|null)[]=[];
 const activePayments=s.records.payment.filter(r=>!r.voidedAt&&r.value.holderId===p.holderId).map(r=>r.value);
 const treatments=s.records.treatment.filter(r=>!r.voidedAt&&r.value.holderId===p.holderId).map(r=>r.value);
 const treatmentsByEntry=new Map(treatments.map(t=>[t.entryId,t]));
 const taxEntries=new Set(activePayments.filter(v=>v.status==='paid'&&v.entryId).map(v=>v.entryId));
 const movementsById=new Map(s.ledger.movements.map(m=>[m.id,m]));
 const entriesById=new Map(s.ledger.entries.map(e=>[e.id,e]));
 const entries=s.ledger.entries.filter(e=>e.holderId===p.holderId&&e.date>=`${p.year}-01-01`&&e.date<=asOf);
 function cashOf(e:BusinessEntry){return e.paymentMethod==='credit'?0:e.paymentMethod==='other'?null:(e.kind==='income'?e.amountCents:-e.amountCents);}
 for(const e of entries){
  const inCash=e.date>=p.openingDate;
  if(e.stale||e.deletedAt){pending.push(`${e.description}: movimiento modificado o eliminado; revisar conciliación.`);profitParts.push(null);if(inCash)cashParts.push(null);continue;}
  const t=treatmentsByEntry.get(e.id),tax=taxEntries.has(e.id);
  let role=tax?'tax':t?.role??(p.defaultOperating==='yes'?'operating':'pending');
  if(t&&t.entryVersion!==e.version){role='pending';pending.push(`${e.description}: clasificación anterior a la versión actual.`);}
  if(role==='pending'){profitParts.push(null);pending.push(`${e.description}: confirmar si es operación, equipo, contribución, financiación o retiro/aportación.`);}
  else if(role==='operating'){
   if(e.kind==='income')profitParts.push(netDeposit(e)===null?null:sum([e.grossCents!,-e.refundCents!,-e.commissionCents!]));
   else profitParts.push(commercialAmount(e)===null?null:-commercialAmount(e)!);
  }
  if(e.kind==='income'&&role==='operating'&&netDeposit(e)===null)pending.push(`${e.description}: completar desglose de bruto, comisiones, devoluciones e IVU.`);
  if(e.kind==='expense'&&role==='operating'&&commercialAmount(e)===null)pending.push(`${e.description}: falta el uso o porcentaje comercial.`);
  if(inCash){const value=cashOf(e);cashParts.push(value);if(value===null)pending.push(`${e.description}: método de pago «Otro» requiere conciliación de efectivo.`);}
 }
 for(const r of s.records.cash.filter(r=>!r.voidedAt&&r.value.holderId===p.holderId)){
  const v=r.value;if(v.date<p.openingDate||v.date>asOf)continue;
  const m=v.movementId?movementsById.get(v.movementId):undefined;
  if(v.movementId&&(!m||m.deletedAt||m.version!==v.movementVersion||m.amountCents!==v.amountCents)){cashParts.push(null);pending.push(`${v.reference}: movimiento de efectivo cambió; conciliar.`);}
  else cashParts.push(v.amountCents===null?null:v.direction==='in'?v.amountCents:-v.amountCents);
 }
 for(const v of activePayments.filter(v=>v.status==='paid'&&v.date>=p.openingDate&&v.date<=asOf)){
  if(v.cash==='separate')cashParts.push(v.amountCents===null?null:-v.amountCents);
  else if(v.cash==='pending'){cashParts.push(null);pending.push(`${v.reference}: confirmar dónde se refleja el pago estimado en efectivo.`);}
  else{const e=v.entryId?entriesById.get(v.entryId):undefined;if(!e||e.deletedAt||e.stale||e.version!==v.entryVersion||e.amountCents!==v.amountCents){cashParts.push(null);pending.push(`${v.reference}: gasto del pago estimado requiere conciliación.`);}}
 }
 const profitCents=knownSum(profitParts),cashChangeCents=knownSum(cashParts);
 if(p.openingDate>asOf)pending.push('La fecha de efectivo inicial es posterior al corte; revisar antes de calcular saldo.');
 if(p.openingCashCents===null)pending.push('Indicar efectivo inicial al comenzar la fecha base.');
 if(p.cashComplete!=='yes')pending.push('Confirmar que se incluyeron cobros, compras con crédito, pagos de tarjetas, préstamos y movimientos de propietarios.');
 const cashCents=p.cashComplete==='yes'&&p.openingCashCents!==null&&p.openingDate<=asOf?knownSum([p.openingCashCents,cashChangeCents]):null;
 const cutoffEnd=new Date(asOf+'T23:59:59.999').getTime();
 const reserves=Object.fromEntries((['tax','ivu','payroll'] as const).map(k=>{const r=s.ledger.reserves.find(r=>r.holderId===p.holderId&&r.kind===k);const timestamp=r?new Date(r.updatedAt).getTime():NaN;return [k,!r||!Number.isFinite(timestamp)||timestamp>cutoffEnd?null:r.amountCents];})) as Record<'tax'|'ivu'|'payroll',number|null>;
 for(const k of ['tax','ivu','payroll'] as const)if(reserves[k]===null)pending.push(`Reserva ${k==='tax'?'contributiva':k==='ivu'?'de IVU':'de nómina'}: indicar importe, cero confirmado o revisar fecha posterior al corte.`);
 const reservedCents=knownSum(Object.values(reserves)),availableCents=subtract(cashCents,reservedCents);
 const recordedPaidCents=knownSum(activePayments.filter(v=>v.status==='paid'&&v.year===p.year&&v.date<=asOf&&(p.taxScope==='combined'||v.jurisdiction===p.taxScope)).map(v=>v.amountCents));
 if(profitCents===null&&profitParts.every(v=>v!==null))pending.push('Resultado agregado fuera de rango; revisar importes.');
 if(cashChangeCents===null&&cashParts.every(v=>v!==null))pending.push('Variación de efectivo fuera de rango; revisar importes.');
 if(reservedCents===null&&Object.values(reserves).every(v=>v!==null))pending.push('Reservas agregadas fuera de rango.');
 const taxPending:string[]=[];
 if(recordedPaidCents===null)taxPending.push('Importes de estimadas pendientes o fuera de rango.');
 if((p.taxScope!=='federal'&&holder.prClassification==='pending')||(p.taxScope!=='pr'&&holder.federalClassification==='pending'))taxPending.push('Confirmar clasificación contributiva correspondiente al alcance elegido; miembros de LLC no bastan.');
 if(p.profileVersion!==holder.version)taxPending.push('El perfil cambió: revisar fundamento e importe de la proyección.');
 if(p.annualTaxCents===null||!p.taxBasis.trim())taxPending.push('Indicar contribución anual proyectada y fundamento. Este panel no presume una tasa legal sobre la ganancia.');
 if(p.creditsCents===null)taxPending.push('Confirmar otras retenciones/créditos aplicables o cero; no repetir pagos estimados.');
 if(p.paymentsComplete!=='yes')taxPending.push('Confirmar que se registraron todos los pagos estimados del alcance y año.');
 const dueCents=taxPending.length?null:subtract(subtract(p.annualTaxCents,recordedPaidCents),p.creditsCents);
 if(dueCents===null&&!taxPending.length)taxPending.push('Saldo contributivo agregado fuera de rango; revisar importes.');
 const allocated=p.taxReserveAllocatedCents!==null&&reserves.tax!==null&&p.taxReserveAllocatedCents<=reserves.tax?p.taxReserveAllocatedCents:null;
 if(allocated===null)taxPending.push('Confirmar cuánto de la reserva contributiva corresponde a esta proyección, sin exceder su total actual.');
 const needReserveCents=dueCents===null||allocated===null?null:dueCents<=allocated?0:subtract(dueCents,allocated);
 return {profitCents,cashChangeCents,cashCents,reserves,reservedCents,availableCents,recordedPaidCents,dueCents,needReserveCents,taxReserveAllocatedCents:allocated,taxPending,pending,assumptions:['Resultado de operaciones registradas antes de depreciación y ajustes contributivos. No es renta tributable ni contabilidad completa de cuentas por cobrar.','Los cobros usan bruto menos devoluciones y comisiones; el IVU cobrado no es ganancia.','Compras a crédito afectan resultado cuando son operación, pero no efectivo hasta registrar su pago. Equipos, financiación, aportaciones/retiros y pagos estimados se separan de operación.','El efectivo inicial es declarado al comenzar la fecha base; el efectivo calculado no es saldo bancario confirmado. Reservar dinero no crea un gasto.','La proyección anual y los créditos son importes declarados con fundamento; no se anualiza automáticamente ni se exige validación de CPA.']};
}
export function compareScenario(base:ReturnType<typeof panel>,v:Scenario){
 for(const n of [v.salesCents,v.expensesCents,v.collectionsCents,v.paymentsCents,v.equipmentCostCents,v.equipmentCashCents,v.taxChangeCents])if(n!==null)cents(n);
 if(v.equipmentCostCents!==null&&v.equipmentCostCents<0||v.equipmentCashCents!==null&&v.equipmentCashCents<0||v.equipmentCostCents!==null&&v.equipmentCashCents!==null&&v.equipmentCashCents>v.equipmentCostCents)throw new UserInputError('Revisa costo y pago del equipo antes de simular.');
 const profitDelta=knownSum([v.salesCents,v.expensesCents===null?null:-v.expensesCents]);
 const cashDelta=knownSum([v.collectionsCents,v.paymentsCents===null?null:-v.paymentsCents,v.equipmentCashCents===null?null:-v.equipmentCashCents]);
 const profitCents=knownSum([base.profitCents,profitDelta]),cashCents=knownSum([base.cashCents,cashDelta]);
 const availableCents=subtract(cashCents,base.reservedCents);
 const dueCents=knownSum([base.dueCents,v.taxChangeCents]);
 const needReserveCents=dueCents===null||base.taxReserveAllocatedCents===null?null:dueCents<=base.taxReserveAllocatedCents?0:subtract(dueCents,base.taxReserveAllocatedCents);
 const assumedFinancingCents=v.equipmentCostCents===null||v.equipmentCashCents===null?null:subtract(v.equipmentCostCents,v.equipmentCashCents);
 return {profitDelta,cashDelta,profitCents,cashCents,availableCents,dueCents,needReserveCents,assumedFinancingCents,explanations:['Las ventas cambian el resultado; los cobros cambian el efectivo. No se supone que toda venta se cobre inmediatamente.','Los gastos operativos y sus pagos se introducen por separado. Una reducción se escribe negativa.','El equipo no se descuenta de inmediato de este resultado antes de depreciación; el efectivo baja solo por lo pagado. La diferencia es financiación/importe aún por atender del escenario.','El cambio contributivo es un supuesto declarado, no una tasa o deducción automática. Comparar no crea movimientos, pagos ni reservas.',v.assumptions]};
}
export interface CalendarRow {key:string;name:string;period:string;date:string|null;status:string;source:string;note:string}
export function calendar(s:PlanningSnapshot,p:Plan):CalendarRow[]{
 const rows:CalendarRow[]=[],y=p.year,h=p.holderId;
 const source=(id:string)=>planningSources.find(s=>s.id===id)!.url;
 const records=s.obligations.obligations.filter(o=>o.holderId===h&&!o.voidedAt);
 function add(key:string,name:string,period:string,date:string|null,src:string,note:string,status='Por confirmar'){rows.push({key,name,period,date,status,source:src,note});}
 if(p.ivu==='pending')add('ivu-pending','IVU: confirmar si corresponde',String(y),null,source('ivu2026'),'Confirmar certificado, ofertas, canal y responsable.');
 if(p.contractors==='pending')add('sp-pending','Contratistas: confirmar obligación',String(y),null,source('sp2026'),'Confirmar pagador/proveedores, servicios y relevos.');
 for(let m=1;m<=12;m++){
  const month=`${y}-${String(m).padStart(2,'0')}`;
  if(p.ivu==='yes')add(`ivu:${month}`,'IVU: presentación mensual y revisión de remesas',month,nominalDueDate('SC2915',month),source('monthly'),municipalProcedure(s.ledger.holders.find(v=>v.id===h)?.municipality??'',month)+'; pagar no confirma presentación ni remesa municipal.');
  if(p.contractors==='yes')add(`deposit:${month}`,'Servicios: depósito mensual base',month,nominalDueDate('deposit',month),source('deposits'),'Confirmar alternativa trimestral de CC 19-10 si retención del trimestre < $2,500 y cumple condiciones.');
 }
 if(p.contractors==='yes'){
  for(let q=1;q<=4;q++)add(`quarter:${q}`,'480.6SP-1 trimestral',`${y}-Q${q}`,nominalDueDate('4806SP1',`${y}-Q${q}`),source('deposits'),'Revisar período y confirmación propia.');
  add('sp2','480.6SP.2: conciliación anual',String(y),nominalDueDate('4806SP2',String(y)),source('sp2'),'No sustituye las informativas por proveedor.');
  const providers=new Set(s.obligations.payments.filter(v=>!v.voidedAt&&v.holderId===h&&v.date.startsWith(String(y))&&v.scope!=='excluded').map(v=>v.providerId));
  for(const id of providers)add(`sp:${id}`,`480.6SP: ${s.obligations.providers.find(v=>v.id===id)?.name??'Proveedor pendiente'}`,String(y),nominalDueDate('4806SP',String(y)),source('sp2026'),'Confirmar clasificación, importes y entrega al proveedor.');
 }
 const holder=s.ledger.holders.find(v=>v.id===h);
 const scheduleMatches=p.estimatedSchedule==='individual'&&holder?.prClassification==='individual'||p.estimatedSchedule==='corporation'&&holder?.prClassification==='corporation';
 if(scheduleMatches&&p.calendarYear==='yes')for(const [i,date] of [`${y}-04-15`,`${y}-06-15`,`${y}-09-15`,p.estimatedSchedule==='individual'?`${y+1}-01-15`:`${y}-12-15`].entries())add(`estimated:${i}`,`Estimada PR: plazo base ${i+1}`,String(y),date,source('estimatedDates'),'Solo fecha nominal para régimen declarado y año calendario. Confirmar obligación, inicio, excepciones y avisos. Un pago registrado no confirma que se cumplió todo el plazo.');
 else add('estimated-pending','Estimada: confirmar calendario y régimen',String(y),null,source('estimatedDates'),'Clasificación, año fiscal, obligación o fechas pendientes. Entidad conducto/ignorada no se trata automáticamente como corporación o individuo.');
 add('annual-return','Planilla anual: confirmar formulario, régimen y fecha',String(y),null,source('calendar'),'Confirmar cierre contributivo y obligaciones del titular o socios. No se asigna una fecha de otro año sin verificar.');
 add('municipal-other','Obligaciones municipales y permisos: confirmar alcance',String(y),null,source('calendar'),'Verificar patente, permisos y trámites aplicables con el municipio; añadir fechas verificadas con su fuente.');
 if(p.employees!=='no')add('payroll','Nómina: obligaciones por configurar',String(y),null,source('calendar'),'Revisar el módulo de Nómina y confirmar Hacienda/SSA, desempleo, SINOT y CFSE según el perfil.');
 for(const o of records.filter(o=>o.period.startsWith(String(y))))add(`record:${o.id}`,o.form==='deposit'?'Depósito/remesa registrada':o.form,o.period,o.dueDate??obligationBaseDue(o),o.dueSource||source(o.flow==='ivu'?'monthly':'deposits'),o.note,o.status==='confirmed'?o.kind==='filing'?'Presentación confirmada':'Pago confirmado':o.status==='not_applicable'?'No aplica':'Pendiente');
 for(const r of s.records.calendar.filter(r=>!r.voidedAt&&r.value.holderId===h&&r.value.year===y)){const v=r.value;add(`manual:${v.id}`,v.name,String(y),v.date,v.source,v.note,v.status==='done'?'Atendida con referencia':'Pendiente');}
 if(String(y)!==VERIFIED_ON.slice(0,4))for(const row of rows)row.note+=' Revalidar fuentes para el año elegido; el catálogo se consultó '+VERIFIED_ON+'.';
 return rows.sort((a,b)=>(a.date??'9999').localeCompare(b.date??'9999')||a.key.localeCompare(b.key));
}
