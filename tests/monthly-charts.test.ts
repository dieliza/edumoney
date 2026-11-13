import {expect,it} from 'vitest';
import {monthlyChartModel} from '../src/ui/monthlyCharts';
import {monthlySummary} from '../src/modules/money/domain';
import {cents} from '../src/core/money';
import type {Snapshot,LedgerMovement} from '../src/modules/money/types';
const entry=(id:string,kind:LedgerMovement['kind'],amount:number,categoryId:string|null=null):LedgerMovement=>({id,idempotencyKey:id,kind,amountCents:cents(amount),currency:'USD',date:'2026-11-13',description:'FICTICIO',categoryId,paymentMethod:'cash',taxReview:false,useKind:'personal',grossCents:null,withholdingCents:null,createdAt:'now',updatedAt:'now',deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1});
function model(movements:LedgerMovement[]){const snapshot:Snapshot={movements,categories:[{id:'salud',name:'Salud',kind:'expense',archived:false},{id:'comida',name:'Comida',kind:'expense',archived:false}],budgets:[],schedules:[],commitments:[]};return monthlyChartModel(monthlySummary(snapshot,'2026-11'),movements,'2026-11');}
it('compara ingresos y gastos con la misma escala, sin contar préstamos como ingreso',()=>{
 const m=model([entry('ingreso','income',100000),entry('gasto','expense',25000,'salud'),entry('prestamo','loan',50000)]);expect(m.incomeFraction).toBe(1);expect(m.expenseFraction).toBe(0.25);expect(m.difference).toBe(75000);expect(m.pages).toEqual(['overview','distribution','category:salud']);
});
it('añade páginas por categorías activas y conserva los gastos individuales sin duplicar totales',()=>{
 const m=model([entry('s1','expense',10000,'salud'),entry('s2','expense',5000,'salud'),entry('c','expense',2000,'comida'),entry('u','expense',1000)]);expect(m.categories).toHaveLength(3);expect(m.categories.find(c=>c.id==='salud')?.transactions).toHaveLength(2);expect(m.categories.find(c=>c.id==='salud')?.spent).toBe(15000);expect(m.pages).toContain('category:comida');expect(m.pages).toContain('category:uncategorized');expect(m.incomeFraction).toBe(0);expect(m.expenseFraction).toBe(1);
});
it('retira de las gráficas los gastos eliminados y los de otro mes',()=>{
 const m=model([{...entry('retirado','expense',10000,'salud'),deletedAt:'now'},{...entry('otro-mes','expense',3000,'comida'),date:'2026-10-13'}]);expect(m.pages).toEqual(['overview']);expect(m.categories).toHaveLength(0);
});
it('muestra cero sin divisiones inválidas y refleja cuando los gastos superan los ingresos',()=>{
 const empty=model([]);expect(empty.incomeFraction).toBe(0);expect(empty.expenseFraction).toBe(0);const over=model([entry('i','income',10000),entry('e','expense',20000,'salud')]);expect(over.incomeFraction).toBe(0.5);expect(over.expenseFraction).toBe(1);expect(over.difference).toBe(-10000);
});
