import {cents} from '../core/money';
import type {LedgerMovement} from '../modules/money/types';
import type {monthlySummary} from '../modules/money/domain';
export function monthlyChartModel(summary:ReturnType<typeof monthlySummary>,movements:LedgerMovement[],month:string){
 const expenses=movements.filter(m=>!m.deletedAt&&m.kind==='expense'&&m.date.startsWith(month));
 const grouped=new Map<string,LedgerMovement[]>();for(const m of expenses){const id=m.categoryId??'uncategorized';const rows=grouped.get(id)??[];rows.push(m);grouped.set(id,rows);}
 const categories=summary.distribution.filter(c=>c.spent>0).map(c=>({...c,transactions:(grouped.get(c.id)??[]).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id))}));
 const scale=Math.max(summary.income,summary.expenses,1);
 return {categories,scale,incomeFraction:summary.income/scale,expenseFraction:summary.expenses/scale,difference:cents(summary.income-summary.expenses),pages:['overview',...(categories.length?['distribution',...categories.map(c=>`category:${c.id}`)]:[])]};
}
