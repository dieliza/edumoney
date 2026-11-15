import {addAmounts,cents,type Cents} from '../../core/money';
import {UserInputError} from '../../core/errors';
import {validMonth} from './domain';
import type {Category,LedgerMovement} from './types';
export type ChartKind='all'|'income'|'expense';
export interface TransactionPoint {id:string;kind:'income'|'expense';date:string;description:string;categoryId:string;categoryName:string;archived:boolean;amountCents:Cents;paymentMethod:string|null;createdAt:string}
/** One point per recorded movement. No grouping, inference or writes. */
export function transactionChartRows(movements:readonly LedgerMovement[],categories:readonly Category[],month:string,kind:ChartKind='all',category='all'):TransactionPoint[]{
 if(!validMonth(month))throw new UserInputError('Elige un mes válido para la gráfica.');
 const names=new Map(categories.map(c=>[c.id,c]));
 return movements.filter(m=>!m.deletedAt&&(m.kind==='income'||m.kind==='expense')&&m.date.startsWith(month)&&(kind==='all'||m.kind===kind)).map(m=>{const c=m.categoryId?names.get(m.categoryId):undefined;return {id:m.id,kind:m.kind as 'income'|'expense',date:m.date,description:m.description,categoryId:m.categoryId??(m.kind==='income'?'income-uncategorized':'uncategorized'),categoryName:c?.name??(m.categoryId?'Categoría no disponible':'Sin categoría'),archived:c?.archived??false,amountCents:m.amountCents,paymentMethod:m.paymentMethod,createdAt:m.createdAt};}).filter(m=>category==='all'||m.categoryId===category).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
/** Display-only category totals, keeping income and expense taxonomies separate. */
export function transactionCategoryTotals(movements:readonly LedgerMovement[],categories:readonly Category[],month:string,kind:'income'|'expense'){
 const grouped=new Map<string,{id:string;name:string;kind:'income'|'expense';archived:boolean;spent:Cents;count:number}>();
 for(const row of transactionChartRows(movements,categories,month,kind)){const group=grouped.get(row.categoryId)??{id:row.categoryId,name:row.categoryName,kind,archived:row.archived,spent:cents(0),count:0};group.spent=addAmounts(group.spent,row.amountCents);group.count++;grouped.set(group.id,group);}
 return [...grouped.values()].sort((a,b)=>b.spent-a.spent||a.name.localeCompare(b.name,'es')||a.id.localeCompare(b.id));
}
