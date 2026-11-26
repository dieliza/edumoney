import type {EducationCatalog,EducationTip} from '../education/types';
import {getMoneyStore} from '../money/localStore';
import {BudgetStore} from './store';
const matching:Record<string,RegExp>={priorizar:/posibilidades|prioriz|flujo|ingresos.*gastos/i,recortar:/discrecion|recortar|entreten|necesidad/i,ahorro:/ahorr/i,minimos:/deuda|mínim|minim/i,emergencia:/emergencia/i,calendario:/futur|calendario|anual|vencim/i};
/** Local ordering only: no financial amounts leave the encrypted workspace, no lesson is marked read. */
export function rankBudgetLessons(catalog:EducationCatalog,signals:string[]):EducationCatalog{if(!signals.length)return catalog;const score=(tip:EducationTip)=>signals.filter(s=>tip.id===s||matching[s]?.test(tip.title+' '+tip.body)).length;const rank=(tips:EducationTip[])=>tips.map((tip,index)=>({tip,index,score:score(tip)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(v=>v.tip);return {...catalog,current:rank(catalog.current),history:rank(catalog.history)};}
export async function prioritizeCatalog(catalog:EducationCatalog){try{return rankBudgetLessons(catalog,await new BudgetStore(await getMoneyStore()).learningIds());}catch{return catalog;}}
