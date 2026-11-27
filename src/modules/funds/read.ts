import {deletedGoalIds} from '../goals/deletion';
import type {SqlDb} from '../money/store';
import {movementSelect,readMovement} from '../money/store';
import type {LedgerMovement} from '../money/types';
import {scopedMovements} from '../money/scopedMovements';
import {fundLabels,type Fund,type FundData,type FundTransfer,type MoneyLocation,type FundKind} from './types';
import type {AccountScope} from '../money/accountScope';
export const fundSelect=`SELECT id,scope,kind,name,goal_id AS goalId,target_cents AS targetCents,contribution_cents AS contributionCents,cadence,target_date AS targetDate,location_id AS locationId,budget_month AS budgetMonth,category_id AS categoryId,archived,version,created_at AS createdAt FROM money_funds`;
export const transferSelect=`SELECT sequence,id,scope,from_id AS fromId,to_id AS toId,amount_cents AS amountCents,date,description,version,created_at AS createdAt,reversed_at AS reversedAt,reversal_reason AS reversalReason FROM fund_transfers`;
export const goalFundId=(id:string)=>'goal:'+id;
export const unassignedFundId='legacy-unassigned-savings';
export const defaultFundId=(scope:AccountScope,kind:FundKind)=>'fund:'+scope+':'+kind;
type GoalRow={id:string;name:string;kind:string;targetCents:number;openingCents:number;desiredDate:string|null;cadence:'weekly'|'biweekly'|'monthly';archived:number;version:number};
export async function readFundData(db:SqlDb):Promise<FundData>{
 const originals=(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date,id')).map(readMovement);
 const entries=await db.getAllAsync<{movementId:string;movementVersion:number;kind:'income'|'expense';useKind:'personal'|'business'|'mixed'|'pending';businessBps:number|null}>('SELECT movement_id AS movementId,movement_version AS movementVersion,kind,use_kind AS useKind,business_bps AS businessBps FROM business_entries');
 const movements=scopedMovements(originals,entries);
 const goalRows=await db.getAllAsync<GoalRow>('SELECT id,name,kind,target_cents AS targetCents,opening_cents AS openingCents,desired_date AS desiredDate,COALESCE(cadence_detail,cadence) AS cadence,archived,version FROM goals');
 const stored=await db.getAllAsync<Fund>(fundSelect);
 const funds:Fund[]=stored.map(f=>({...f,archived:!!f.archived,openingCents:0,legacyCents:0,balanceCents:0}));
 const budgets=await db.getAllAsync<{month:string;category_id:string;amount_cents:number}>('SELECT month,category_id,amount_cents FROM monthly_budgets');
 for(const f of funds)if(f.scope==='personal'&&f.kind==='budget'&&f.categoryId&&f.budgetMonth)f.targetCents=budgets.find(b=>b.month===f.budgetMonth&&b.category_id===f.categoryId)?.amount_cents??0;
 const deleted=await deletedGoalIds(db);
 for(const g of goalRows){
  const existing=funds.find(f=>f.goalId===g.id);
  const base={deletedGoal:deleted.has(g.id),name:g.name,kind:g.kind==='emergency'?'emergency' as const:'savings' as const,targetCents:g.targetCents,openingCents:g.openingCents,goalVersion:g.version,targetDate:g.desiredDate,cadence:g.cadence,archived:!!g.archived};
  if(existing)Object.assign(existing,base);
  else funds.push({id:goalFundId(g.id),scope:'personal',goalId:g.id,...base,contributionCents:0,cadence:g.cadence,targetDate:g.desiredDate,locationId:null,budgetMonth:null,categoryId:null,version:0,createdAt:'',legacyCents:0,balanceCents:0});
 }
 const links=await db.getAllAsync<{goalId:string;movementId:string;amountCents:number}>('SELECT goal_id AS goalId,movement_id AS movementId,amount_cents AS amountCents FROM goal_contributions WHERE reversed_at IS NULL');
 const legacy:FundData['legacy']=[];
 for(const m of movements.filter(m=>!m.deletedAt&&m.kind==='goal_contribution'&&m.useKind!=='business')){
  const link=links.find(c=>c.movementId===m.id),fund=link?funds.find(f=>f.goalId===link.goalId):null;
  legacy.push({movementId:m.id,fundId:fund?.id??unassignedFundId,amountCents:m.amountCents,date:m.date});
 }
 if(legacy.some(p=>p.fundId===unassignedFundId)&&!funds.some(f=>f.id===unassignedFundId))funds.push({id:unassignedFundId,scope:'personal',kind:'savings',name:'Ahorros sin meta',goalId:null,targetCents:0,contributionCents:0,cadence:'monthly',targetDate:null,locationId:null,budgetMonth:null,categoryId:null,archived:false,version:0,createdAt:'',openingCents:0,legacyCents:0,balanceCents:0});
 // Choices remain virtual until a confirmed transfer materializes its endpoints atomically.
 for(const scope of ['personal','business'] as const)for(const kind of ['savings','emergency','budget'] as const){const id=defaultFundId(scope,kind);if(!funds.some(f=>f.id===id))funds.push({id,scope,kind,name:fundLabels[kind],goalId:null,targetCents:0,contributionCents:0,cadence:'monthly',targetDate:null,locationId:null,budgetMonth:null,categoryId:null,archived:false,version:0,createdAt:'',openingCents:0,legacyCents:0,balanceCents:0});}
 return {funds,movements,legacy,transfers:await db.getAllAsync<FundTransfer>(transferSelect+' ORDER BY date,sequence'),locations:await db.getAllAsync<MoneyLocation>('SELECT id,name,kind,version FROM money_locations ORDER BY name'),events:await db.getAllAsync('SELECT entity_id AS entityId,action,before_json AS beforeJson,reason,recorded_at AS recordedAt FROM fund_events ORDER BY id DESC')};
}
