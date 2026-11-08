import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe,it,expect } from 'vitest';
import { migrate } from '../src/storage/migrate';
import { schemaV1 } from '../src/storage/schema';
import { schemaV2 } from '../src/storage/schemaV2';
import { cents } from '../src/core/money';
import { MoneyStore,type SqlDb } from '../src/modules/money/store';
import { monthlySummary } from '../src/modules/money/domain';
import type { LedgerMovement } from '../src/modules/money/types';
import { BillsStore,SimilarBillPaymentError } from '../src/modules/bills/store';
import { nextBillDate,billStatus,outstanding,reminderPlan,shiftDays } from '../src/modules/bills/domain';
import { ReminderScheduler,type ReminderPort } from '../src/modules/bills/reminders';
import type { Bill,BillInput,PaymentInput } from '../src/modules/bills/types';
const today=()=> '2026-11-08';
function adapter(db:DatabaseSync):SqlDb{return {
 execAsync:async sql=>{db.exec(sql);},
 runAsync:async(sql,...p)=>({changes:Number(db.prepare(sql).run(...p).changes)}),
 getAllAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).all(...p) as T[],
 getFirstAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).get(...p) as T??null,
};}
async function setup(){const db=new DatabaseSync(':memory:');await migrate(adapter(db));const ledger=new MoneyStore(adapter(db));return{db,ledger,bills:new BillsStore(ledger,today)};}
const input=(id='b1',patch:Partial<BillInput>={}):BillInput=>({id,provider:'Electricidad',amountCents:cents(10000),dueDate:'2026-11-15',categoryId:'expense-services',paymentKind:'expense',reminderDays:3,...patch});
const payment=(patch:Partial<PaymentInput>={}):PaymentInput=>({id:'p1',billId:'b1',expectedVersion:1,amountCents:cents(4000),date:today(),paymentMethod:'bank',existingMovementId:null,confirmSimilar:false,...patch});
const movement=(id='m1',patch:Partial<LedgerMovement>={}):LedgerMovement=>({id,idempotencyKey:id,kind:'expense',amountCents:cents(4000),currency:'USD',date:today(),description:'Electricidad ya registrada',categoryId:'expense-services',paymentMethod:'bank',taxReview:false,useKind:'unknown',grossCents:null,withholdingCents:null,createdAt:'now',updatedAt:'now',deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1,...patch});
const view=(patch:Partial<Bill>={}):Bill=>({...input(),seriesId:null,occurrenceDate:null,version:1,createdAt:null,updatedAt:null,voidedAt:null,paidCents:cents(0),legacyRecurrence:null,...patch});
describe('Etapa 4: facturas y pagos en SQLite real',()=>{
 it('migra v2 preservando factura, pago y movimiento; revierte una ampliación interrumpida',async()=>{
  const db=new DatabaseSync(':memory:');try{
   db.exec(schemaV1+schemaV2+"PRAGMA user_version=2; INSERT INTO bills(id,provider,amount_cents,due_date,recurrence) VALUES('old','Proveedor',100,'2026-11-01','texto antiguo');");
   await new MoneyStore(adapter(db)).create(movement('old-m',{amountCents:cents(50)}));
   db.exec("INSERT INTO bill_payments VALUES('old-p','old','old-m',50)");
   const real=adapter(db);await expect(migrate({...real,execAsync:async sql=>{await real.execAsync(sql);if(sql.includes('CREATE TABLE bill_series'))throw Error('interrupted');}})).rejects.toThrow('interrupted');
   expect(db.prepare('PRAGMA user_version').get()).toMatchObject({user_version:2});
   await migrate(real);const s=await new BillsStore(new MoneyStore(real),today).snapshot();
   expect(s.bills[0]).toMatchObject({id:'old',paidCents:50,legacyRecurrence:'texto antiguo'});expect(s.movements).toHaveLength(1);
   expect(s.series).toHaveLength(0);
  }finally{db.close();}
 });
 it('crear/programar no crea gastos ni marca pagos; genera fechas una sola vez',async()=>{
  const {db,ledger,bills}=await setup();try{
   await Promise.all([bills.create(input(),{id:'series',cadence:'monthly',intervalCount:1,endDate:null}),bills.create(input(),{id:'series',cadence:'monthly',intervalCount:1,endDate:null})]);
   await Promise.all([bills.materialize(today()),bills.materialize(today())]);const s=await bills.snapshot();
   expect(s.bills.map(b=>b.dueDate)).toEqual(['2026-11-15','2026-12-15','2027-01-15']);
   expect(s.bills.every(b=>b.paidCents===0)).toBe(true);expect((await ledger.snapshot()).movements).toHaveLength(0);
   expect(monthlySummary(await ledger.snapshot(),'2026-11').commitments).toBe(10000);
  }finally{db.close();}
 });
 it('pago parcial y completo, reintentos y doble pulsación mantienen un solo movimiento por pago',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),null);await Promise.all([bills.pay(payment()),bills.pay(payment())]);
   let s=await bills.snapshot();expect(outstanding(s.bills[0])).toBe(6000);expect(billStatus(s.bills[0],today())).toContain('Pago parcial');
   expect(s.movements).toHaveLength(1);expect(monthlySummary(await ledger.snapshot(),'2026-11')).toMatchObject({expenses:4000,commitments:6000,available:-10000});
   await bills.pay(payment({id:'p2',amountCents:cents(6000),expectedVersion:2}));s=await bills.snapshot();
   expect(billStatus(s.bills[0],today())).toBe('Pagada');expect(s.payments).toHaveLength(2);
   expect(monthlySummary(await ledger.snapshot(),'2026-11')).toMatchObject({expenses:10000,commitments:0,available:-10000});
   await expect(bills.pay(payment({id:'p3',amountCents:cents(1),expectedVersion:3}))).rejects.toThrow('supera');
   await expect(bills.pay(payment({amountCents:cents(1)}))).rejects.toThrow('identificador');
  }finally{db.close();}
 });
 it('vincula gasto existente sin duplicarlo y exige coincidencia exacta',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),null);await ledger.create(movement());
   await expect(bills.pay(payment())).rejects.toBeInstanceOf(SimilarBillPaymentError);
   await expect(bills.pay(payment({existingMovementId:'m1',date:'2026-11-07'}))).rejects.toThrow('coincidir');
   await bills.pay(payment({existingMovementId:'m1'}));expect((await ledger.snapshot()).movements).toHaveLength(1);
   expect((await bills.snapshot()).bills[0].paidCents).toBe(4000);
   await bills.create(input('b2',{provider:'Otro proveedor'}),null);await expect(bills.pay(payment({id:'p2',billId:'b2',existingMovementId:'m1'}))).rejects.toThrow('vínculo');
   await expect(ledger.setDeleted('m1',1,true,'Prueba')).rejects.toThrow('vinculado');
  }finally{db.close();}
 });
 it('pagar tarjeta reduce flujo sin volver a sumar la compra como gasto',async()=>{
  const {db,ledger,bills}=await setup();try{
   await ledger.create(movement('purchase',{amountCents:cents(10000),paymentMethod:'credit'}));
   await bills.create(input('b1',{paymentKind:'debt_payment',categoryId:null}),null);
   await expect(bills.pay(payment({paymentMethod:'credit'}))).rejects.toThrow('deuda');
   await bills.pay(payment({amountCents:cents(10000)}));
   expect(monthlySummary(await ledger.snapshot(),'2026-11')).toMatchObject({expenses:10000,payments:10000,available:-10000});
  }finally{db.close();}
 });
 it('pago con tarjeta de un servicio cuenta un gasto sin salida de efectivo inventada',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),null);await bills.pay(payment({amountCents:cents(10000),paymentMethod:'credit'}));
   expect(monthlySummary(await ledger.snapshot(),'2026-11')).toMatchObject({expenses:10000,cashFlow:0,commitments:0});
  }finally{db.close();}
 });
 it('corregir fecha exige motivo y versión, conserva historial y no cambia ancla o siguiente de la serie',async()=>{
  const {db,bills}=await setup();try{
   await bills.create(input(),{id:'series',cadence:'monthly',intervalCount:1,endDate:null});
   await expect(bills.edit(input('b1',{dueDate:'2026-11-20'}),1,'')).rejects.toThrow('motivo');
   await bills.edit(input('b1',{dueDate:'2026-11-20'}),1,'Proveedor cambió la fecha');
   await expect(bills.edit(input(),1,'Vieja')).rejects.toThrow('cambió');
   expect(JSON.parse((await bills.revisions('b1'))[0].beforeJson).dueDate).toBe('2026-11-15');
   await bills.materialize(today());const s=await bills.snapshot();expect(s.bills.map(b=>b.dueDate)).toEqual(['2026-11-20','2026-12-15','2027-01-15']);
   expect(s.series[0].anchorDate).toBe('2026-11-15');
  }finally{db.close();}
 });
 it('atrasos no se desplazan, pausar detiene generación y reanudar recupera fechas sin duplicar',async()=>{
  const {db,bills}=await setup();try{
   await bills.create(input('b1',{dueDate:'2026-10-01'}),{id:'series',cadence:'weekly',intervalCount:2,endDate:'2026-11-30'});
   await bills.toggleSeries('series',false);await bills.materialize(today());expect((await bills.snapshot()).bills).toHaveLength(1);
   await bills.toggleSeries('series',true);await bills.materialize(today());let s=await bills.snapshot();
   expect(s.bills[0].dueDate).toBe('2026-10-01');expect(billStatus(s.bills[0],today())).toBe('Atrasada');
   expect(s.bills.map(b=>b.dueDate)).toEqual(['2026-10-01','2026-10-15','2026-10-29','2026-11-12','2026-11-26']);
   expect(s.series[0].active).toBe(false);await bills.materialize(today());s=await bills.snapshot();expect(s.bills).toHaveLength(5);
  }finally{db.close();}
 });
 it('revierte pago creado retirando gasto con auditoría; movimiento preexistente se conserva',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),null);await bills.pay(payment());await bills.reversePayment('p1','Pago registrado por error');await bills.reversePayment('p1','Reintento');
   let s=await bills.snapshot();expect(s.bills[0].paidCents).toBe(0);expect(s.payments[0].reversed).toBe(true);
   expect(monthlySummary(await ledger.snapshot(),'2026-11').expenses).toBe(0);expect(await ledger.revisions('bill-movement:p1')).toHaveLength(1);
   await ledger.create(movement());await bills.pay(payment({id:'p2',expectedVersion:3,existingMovementId:'m1'}));await bills.reversePayment('p2','Solo desvincular');
   s=await bills.snapshot();expect(s.bills[0].paidCents).toBe(0);expect(s.movements.find(m=>m.id==='m1')?.deletedAt).toBeNull();
   expect(monthlySummary(await ledger.snapshot(),'2026-11').expenses).toBe(4000);
  }finally{db.close();}
 });
 it('anula pendiente con historial, sin deshacer pagos ni reponer una ocurrencia anulada',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),{id:'series',cadence:'monthly',intervalCount:1,endDate:null});await bills.pay(payment());
   await bills.voidBill('b1',2,'Se canceló el servicio');await bills.materialize(today());
   const s=await bills.snapshot();expect(s.bills.filter(b=>b.occurrenceDate==='2026-11-15')).toHaveLength(1);
   expect(billStatus(s.bills[0],today())).toBe('Anulada');expect(monthlySummary(await ledger.snapshot(),'2026-11')).toMatchObject({expenses:4000,commitments:0});
   await expect(bills.pay(payment({id:'p2',expectedVersion:3}))).rejects.toThrow('anulada');
  }finally{db.close();}
 });
 it('falla atómicamente al insertar vínculo, y protege pagos contra borrado y cambios incoherentes',async()=>{
  const {db,ledger,bills}=await setup();try{
   await bills.create(input(),null);db.exec("CREATE TRIGGER fail_payment BEFORE INSERT ON bill_payments BEGIN SELECT RAISE(ABORT,'interrupted'); END;");
   await expect(bills.pay(payment())).rejects.toThrow('interrupted');expect((await ledger.snapshot()).movements).toHaveLength(0);expect((await bills.snapshot()).bills[0].version).toBe(1);
   db.exec('DROP TRIGGER fail_payment;');await bills.pay(payment());
   await expect(bills.edit(input('b1',{amountCents:cents(3999)}),2,'Bajar')).rejects.toThrow('menor');
   await expect(bills.edit(input('b1',{categoryId:'expense-food'}),2,'Cambiar')).rejects.toThrow('clasificación');
   await expect(ledger.edit(movement('bill-movement:p1',{idempotencyKey:'bill-payment:p1'}),'Cambiar')).rejects.toThrow('vinculado');
   await expect(bills.pay(payment({id:'future',expectedVersion:2,date:'2026-11-09'}))).rejects.toThrow('fecha');
  }finally{db.close();}
 });
 it('conserva facturas, series, pagos y cambios después de cerrar y reabrir SQLite',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'edumoney-bills-'));let db=new DatabaseSync(join(dir,'data.db'));
  try{
   await migrate(adapter(db));let store=new BillsStore(new MoneyStore(adapter(db)),today);await store.create(input(),{id:'s',cadence:'days',intervalCount:10,endDate:null});await store.pay(payment());await store.edit(input('b1',{dueDate:'2026-11-16'}),2,'Acuerdo');
   db.close();db=new DatabaseSync(join(dir,'data.db'));await migrate(adapter(db));store=new BillsStore(new MoneyStore(adapter(db)),today);
   expect((await store.snapshot()).bills[0]).toMatchObject({dueDate:'2026-11-16',paidCents:4000,version:3});expect(await store.revisions('b1')).toHaveLength(1);expect((await store.snapshot()).series).toHaveLength(1);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
 });
});
describe('Fechas y recordatorios locales',()=>{
 it('respeta día ancla mensual, año bisiesto, intervalos semanales y días configurables',()=>{
  const s={anchorDate:'2028-01-31',nextDate:'2028-01-31',cadence:'monthly' as const,intervalCount:1};
  expect(nextBillDate(s)).toBe('2028-02-29');expect(nextBillDate({...s,nextDate:'2028-02-29'})).toBe('2028-03-31');
  expect(nextBillDate({...s,cadence:'weekly',intervalCount:2})).toBe('2028-02-14');expect(nextBillDate({...s,cadence:'days',intervalCount:10})).toBe('2028-02-10');
  expect(()=>nextBillDate({...s,intervalCount:0})).toThrow();expect(()=>shiftDays('2026-02-30',1)).toThrow();
 });
 it('planifica a las 9 locales, excluye pagos/anuladas/sin permiso solicitado/horas pasadas y limita cupo',()=>{
  const now=new Date('2026-11-08T10:00:00');
  const plan=reminderPlan([view(),view({id:'paid',paidCents:cents(10000)}),view({id:'void',voidedAt:'now'}),view({id:'off',reminderDays:null}),view({id:'past',dueDate:'2026-11-11'}),view({id:'same',dueDate:'2026-11-08',reminderDays:0})],now);
  expect(plan.reminders).toHaveLength(1);expect(new Date(plan.reminders[0].at).getHours()).toBe(9);expect(new Date(plan.reminders[0].at).getDate()).toBe(12);
  const many=Array.from({length:60},(_,i)=>view({id:`b${i}`}));expect(reminderPlan(many,now)).toMatchObject({deferred:12});
 });
 it('reconcilia cambio de fecha y pago cancelando avisos, sin duplicar ni tocar avisos ajenos',async()=>{
  const items=new Map<string,number>([['other',1]]);let calls=0;
  const port:ReminderPort={permission:async()=>true,list:async()=>[...items].map(([id,at])=>({id,at})),cancel:async id=>{items.delete(id);},schedule:async(id,at)=>{items.set(id,at);calls++;}};
  const scheduler=new ReminderScheduler(port);const now=new Date('2026-11-08T10:00:00');await Promise.all([scheduler.sync([view()],now),scheduler.sync([view()],now)]);expect(calls).toBe(1);
  const old=items.get('edumoney-bill:b1');await scheduler.sync([view({dueDate:'2026-11-20'})],now);expect(items.get('edumoney-bill:b1')).not.toBe(old);
  await scheduler.sync([view({paidCents:cents(10000)})],now);expect([...items.keys()]).toEqual(['other']);
 });
 it('permiso denegado cancela avisos propios y error del SO no se presenta como éxito',async()=>{
  let cancelled=false;const port:ReminderPort={permission:async()=>false,list:async()=>[{id:'edumoney-bill:b1',at:1}],cancel:async()=>{cancelled=true;},schedule:async()=>{throw Error('should not schedule');}};
  expect(await new ReminderScheduler(port).sync([view()],new Date())).toContain('sin permiso');expect(cancelled).toBe(true);
  await expect(new ReminderScheduler({...port,permission:async()=>true,list:async()=>[],schedule:async()=>{throw Error('OS unavailable');}}).sync([view()],new Date('2026-11-08T00:00:00'))).rejects.toThrow('OS unavailable');
 });
});
