import {UserInputError} from '../../core/errors';
import {addAmounts,cents} from '../../core/money';
import {validDate} from '../money/domain';
import type {AccountScope} from '../money/accountScope';
import type {LedgerMovement} from '../money/types';
import type {FundData,FundsSummary,FundTransfer,TransferInput} from './types';
const sum=(values:number[])=>addAmounts(...values.map(cents));
export function cashDelta(m:LedgerMovement){if(m.deletedAt)return 0;if(m.kind==='income'||m.kind==='loan')return m.amountCents;if(m.kind==='expense')return m.paymentMethod==='credit'?0:-m.amountCents;if(m.kind==='debt_payment'||m.kind==='goal_contribution')return -m.amountCents;return 0;}
/** An IRA deletion cancels its complete ledger effect, including withdrawals funded by opening assets.
 * Keep source rows for audit/idempotency, but never treat them as active money or tax contributions. */
export function withoutDeletedIra(data:FundData):FundData{
 const ids=new Set(data.funds.filter(f=>f.restricted&&f.archived).map(f=>f.id));
 if(!ids.size)return data;
 return {...data,funds:data.funds.map(f=>ids.has(f.id)?{...f,openingCents:0,legacyCents:0,balanceCents:0}:f),legacy:data.legacy.filter(p=>!ids.has(p.fundId)),transfers:data.transfers.filter(t=>!ids.has(t.fromId??'')&&!ids.has(t.toId??''))};
}
export function fundSummary(data:FundData,scope:AccountScope,asOf:string):FundsSummary{
 data=withoutDeletedIra(data);
 if(!validDate(asOf))throw new UserInputError('Fecha de consulta no válida.');
 const transfers=data.transfers.filter(t=>t.scope===scope&&!t.reversedAt&&t.date<=asOf);
 const funds=data.funds.filter(f=>f.scope===scope).map(f=>{const legacyCents=sum(data.legacy.filter(p=>p.fundId===f.id&&p.date<=asOf).map(p=>p.amountCents));return {...f,legacyCents,balanceCents:sum([f.openingCents,legacyCents,...transfers.flatMap(t=>[...(t.toId===f.id?[t.amountCents]:[]),...(t.fromId===f.id?[-t.amountCents]:[])])])};});
 const available=sum([...data.movements.filter(m=>(scope==='business'?m.useKind==='business':m.useKind!=='business')&&m.date<=asOf).map(cashDelta),...transfers.flatMap(t=>[...(t.toId===null?[t.amountCents]:[]),...(t.fromId===null?[-t.amountCents]:[])])]);
 const savings=sum(funds.filter(f=>f.kind==='savings'&&!f.restricted).map(f=>f.balanceCents)),emergency=sum(funds.filter(f=>f.kind==='emergency'&&!f.restricted).map(f=>f.balanceCents)),budget=sum(funds.filter(f=>f.kind==='budget'&&!f.restricted).map(f=>f.balanceCents));
 const restricted=sum(funds.filter(f=>f.restricted).map(f=>f.balanceCents));
 // The IRA card is the current restricted asset, not net transfers (which can be negative after withdrawing opening assets).
 const ira=restricted;
 return {ira,restricted,available,total:sum([available,savings,emergency,budget,restricted]),savings,emergency,budget,funds,scope,asOf};
}
export function validateTransfer(p:TransferInput,today:string){
 if(!p.id||p.id.length>160||!['personal','business'].includes(p.scope)||p.fromId===p.toId||!validDate(p.date)||p.date>today||cents(p.amountCents)<=0||p.description.length>240)throw new UserInputError('Revisa origen y destino distintos, importe positivo y fecha no futura.');
}
/** A backdated correction cannot spend a fund that later transfers already consumed. */
export function validateAllocationTimeline(data:FundData,scope:AccountScope,changed?:FundTransfer,checkAvailable=true){
 data=withoutDeletedIra(data);
 const rows=data.transfers.filter(t=>t.scope===scope&&!t.reversedAt).sort((a,b)=>a.date.localeCompare(b.date)||a.sequence-b.sequence);
 const rolling=new Map(data.funds.filter(f=>f.scope===scope).map(f=>[f.id,f.openingCents]));
 let day='';let liquid=0;
 for(const t of rows){
  if(day!==t.date){day=t.date;liquid=sum(data.movements.filter(m=>(scope==='business'?m.useKind==='business':m.useKind!=='business')&&m.date<=day).map(cashDelta));for(const earlier of rows.filter(r=>r.date<day))liquid=sum([liquid,earlier.toId===null?earlier.amountCents:0,earlier.fromId===null?-earlier.amountCents:0]);}
  const balance=(id:string)=>sum([rolling.get(id)??0,...data.legacy.filter(p=>p.fundId===id&&p.date<=day).map(p=>p.amountCents)]);
  if(t.fromId!==null){if(!rolling.has(t.fromId)||balance(t.fromId)<t.amountCents)throw new UserInputError('El fondo de origen no tiene dinero suficiente en esa fecha. Revisa también las transferencias posteriores.');rolling.set(t.fromId,sum([rolling.get(t.fromId)!, -t.amountCents]));}
  else if(checkAvailable&&(!changed||t.date>=changed.date)&&liquid<t.amountCents)throw new UserInputError('El balance disponible no alcanza para esta reserva en esa fecha. Registra el ingreso o reduce la cantidad.');
  if(t.toId!==null){if(!rolling.has(t.toId))throw new UserInputError('El fondo de destino no existe en esta cuenta.');rolling.set(t.toId,sum([rolling.get(t.toId)!,t.amountCents]));}
  liquid=sum([liquid,t.toId===null?t.amountCents:0,t.fromId===null?-t.amountCents:0]);
 }
 for(const f of fundSummary(data,scope,'9999-12-31').funds)if(f.balanceCents<0)throw new UserInputError('La corrección dejaría un fondo con balance negativo.');
}

export function validateFundIntegrity(data:FundData){
 for(const f of data.funds)if(f.restricted&&(f.scope!=='personal'||f.kind!=='savings'))throw new UserInputError('La cuenta IRA del respaldo no conserva su tipo de activo restringido.');
 for(const transfer of data.transfers){validateTransfer(transfer,'9999-12-31');for(const id of [transfer.fromId,transfer.toId])if(id!==null&&!data.funds.some(f=>f.id===id&&f.scope===transfer.scope))throw new UserInputError('El respaldo mezcla fondos de distintas cuentas.');}
 for(const scope of ['personal','business'] as const)validateAllocationTimeline(data,scope,undefined,false);
}
