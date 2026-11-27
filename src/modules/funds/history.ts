import type {AccountScope} from '../money/accountScope';
import type {Fund,FundKind,FundTransfer} from './types';
export function transferHistory(rows:FundTransfer[],funds:Fund[],scope:AccountScope,filter:{kind?:FundKind;fundId?:string;month?:string}={}){
 const ids=new Set(funds.filter(f=>f.scope===scope&&(!filter.kind||f.kind===filter.kind&&(!f.goalId||!!filter.fundId))&&(!filter.fundId||f.id===filter.fundId)).map(f=>f.id));
 return rows.filter(t=>t.scope===scope&&(!filter.month||t.date.slice(0,7)===filter.month)&&(!filter.kind&&!filter.fundId||t.fromId!==null&&ids.has(t.fromId)||t.toId!==null&&ids.has(t.toId))).sort((a,b)=>b.date.localeCompare(a.date)||b.sequence-a.sequence);
}
export const transferEndpoint=(id:string|null,funds:Fund[])=>id===null?'Balance disponible':funds.find(f=>f.id===id)?.name??'Fondo';
