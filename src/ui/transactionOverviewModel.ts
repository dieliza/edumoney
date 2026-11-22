import {transactionCategoryTotals} from '../modules/money/transactionChartModel';
import type {Category,LedgerMovement} from '../modules/money/types';
const expenseColors=['#FF9800','#03A9F4','#8B3DE8','#F2329F','#E85555','#00A6A6'];
export function transactionOverviewModel(movements:LedgerMovement[],categories:Category[],month:string,available?:number){
 const income=transactionCategoryTotals(movements,categories,month,'income'),expenses=transactionCategoryTotals(movements,categories,month,'expense');
 const availableAmount=available??Number(income.reduce((sum,c)=>sum+BigInt(c.spent),0n)-expenses.reduce((sum,c)=>sum+BigInt(c.spent),0n));
 const slices=[...(availableAmount>0?[{id:'available',name:'Disponible',kind:'available' as const,archived:false,spent:availableAmount,count:0,color:'#17B75A'}]:[]),...expenses.map((c,i)=>({...c,color:expenseColors[i%expenseColors.length]}))];
 const total=slices.reduce((sum,c)=>sum+BigInt(c.spent),0n);let offset=0;
 const sectors=slices.map(c=>{const fraction=total?Number(BigInt(c.spent)*1000000n/total)/1000000:0;const item={...c,fraction,offset};offset+=fraction;return item;});
 return{income:income.map(c=>({...c,color:'#17B75A'})),expenses:sectors.filter(c=>c.kind==='expense'),sectors};
}
export function sectorPath(offset:number,fraction:number){const a=offset*2*Math.PI-Math.PI/2,b=(offset+fraction)*2*Math.PI-Math.PI/2;return `M 110 110 L ${110+100*Math.cos(a)} ${110+100*Math.sin(a)} A 100 100 0 ${fraction>.5?1:0} 1 ${110+100*Math.cos(b)} ${110+100*Math.sin(b)} Z`;}
