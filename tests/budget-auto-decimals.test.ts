import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {DollarField} from '../src/modules/budget/BudgetControls.web';
import {budgetReport,defaultPlan,pieData} from '../src/modules/budget/domain';
import type {BudgetContext} from '../src/modules/budget/types';
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:'light',colors:{line:'#CCD7DD',surfaceAlt:'#F8FAFB',text:'#102F42'}})}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function field(value:number,onChange:(n:number)=>void,disabled=false){return nodes(DollarField({value,onChange,label:'Cantidad de presupuesto',disabled})).find(n=>n.type==='input')!;}
function enter(n:Node,value:string){(n.props.onChange as (e:{target:{value:string}})=>void)({target:{value}});}
it('al escribir 1, 0, 0 desplaza los centavos automáticamente como ingresos y gastos',()=>{let value=0;const update=(n:number)=>value=n;enter(field(value,update),'0.001');expect(value).toBe(1);enter(field(value,update),'0.010');expect(value).toBe(10);enter(field(value,update),'0.100');expect(value).toBe(100);expect(field(value,update).props.value).toBe('1.00');});
it('admite reemplazar y pegar importes sin perder centavos',()=>{const update=vi.fn();enter(field(0,update),'100');expect(update).toHaveBeenLastCalledWith(100);enter(field(100,update),'$1,234.56');expect(update).toHaveBeenLastCalledWith(123456);expect(field(123456,update).props.value).toBe('1234.56');});
it('retroceso desplaza a la derecha y vaciar devuelve cero sin duplicar cambios',()=>{const update=vi.fn();enter(field(1234,update),'12.3');expect(update).toHaveBeenLastCalledWith(123);enter(field(123,update),'');expect(update).toHaveBeenLastCalledWith(0);expect(update).toHaveBeenCalledTimes(2);});
it('conserva la cantidad ante importes negativos, exceso de dígitos o campo desactivado',()=>{const update=vi.fn();enter(field(100,update),'-100');enter(field(100,update),'1234567890123456');enter(field(100,update,true),'200');expect(update).not.toHaveBeenCalled();});
it('renderiza importes grandes existentes con precisión de centavos',()=>{expect(field(9007199254740991,()=>{}).props.value).toBe('90071992547409.91');});
it('actualiza la distribución y el círculo inmediatamente sin crear un movimiento',()=>{const c:BudgetContext={today:'2026-11-26',money:{movements:[],categories:[],budgets:[],schedules:[],commitments:[]},funds:{funds:[],transfers:[],locations:[],legacy:[],events:[],movements:[]},bills:{bills:[],series:[],payments:[],categories:[],movements:[]},debts:{debts:[],payments:[],events:[],plans:[],movements:[],bills:[]}};let p=defaultPlan('2026-11','personal',c);enter(field(0,n=>{p={...p,rows:p.rows.map((r,i)=>i===0?{...r,amountCents:n}:r)};}),'100');expect(budgetReport(p,c).assigned).toBe(100);expect(pieData(budgetReport(p,c),'planned').values[0].value).toBe(100);expect(c.funds.movements).toHaveLength(0);});
