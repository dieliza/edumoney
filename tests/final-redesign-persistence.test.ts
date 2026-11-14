import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {migrate} from '../src/storage/migrate';
import {MoneyStore,type SqlDb} from '../src/modules/money/store';
import {cents} from '../src/core/money';
import {historicalSeries,topExpenses} from '../src/modules/money/analysisModel';
const adapter=(db:DatabaseSync):SqlDb=>({execAsync:async sql=>{db.exec(sql);},runAsync:async(sql,...params)=>({changes:Number(db.prepare(sql).run(...params).changes)}),getAllAsync:async<T>(sql:string,...params:(string|number|null)[])=>db.prepare(sql).all(...params) as T[],getFirstAsync:async<T>(sql:string,...params:(string|number|null)[])=>db.prepare(sql).get(...params) as T??null});
it('reabre categorías personalizadas y su clasificación sin alterar importes ni historia',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'edu-wheel-')),path=join(folder,'test.db');let db=new DatabaseSync(path);
 try{
  await migrate(adapter(db));const store=new MoneyStore(adapter(db));
  await store.saveCategory('custom-expense','Mascotas ficticias','expense');await store.saveCategory('custom-income','Ingreso ficticio','income');
  await store.create({id:'test-entry',idempotencyKey:'test-entry',kind:'expense',amountCents:cents(12345),currency:'USD',date:'2026-11-14',description:'',categoryId:'custom-expense',paymentMethod:'cash',taxReview:false,useKind:'personal',grossCents:null,withholdingCents:null,createdAt:'now',updatedAt:'now',deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1});
  await expect(store.saveCategory('custom-expense','Otra','income')).rejects.toThrow();
  db.close();db=new DatabaseSync(path);const data=await new MoneyStore(adapter(db)).snapshot();
  expect(data.categories.find(c=>c.id==='custom-expense')).toMatchObject({name:'Mascotas ficticias',kind:'expense'});expect(data.categories.find(c=>c.id==='custom-income')?.kind).toBe('income');expect(data.movements[0]).toMatchObject({categoryId:'custom-expense',amountCents:12345});
  const rows=historicalSeries(data,'2026-11',6,'custom-expense');expect(rows.at(-1)).toMatchObject({income:0,expenses:12345,category:12345,hasRecords:true});expect(topExpenses([{id:'custom-expense',name:'Mascotas ficticias',spent:rows.at(-1)!.expenses}])[0].spent).toBe(12345);
 }finally{db.close();rmSync(folder,{recursive:true,force:true});}
});

it('conserva más de 50 movimientos al reabrir y compila el mes completo, sin mezclar otros meses',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'edu-history-month-')),path=join(folder,'test.db');let db=new DatabaseSync(path);
 try{
  await migrate(adapter(db));let store=new MoneyStore(adapter(db));
  for(let i=0;i<128;i++){
   const income=i===125,december=i>125;
   await store.create({id:`ficticio-${i}`,idempotencyKey:`ficticio-${i}`,kind:income?'income':'expense',amountCents:cents(income?20000:december?1000:100),currency:'USD',date:december?'2026-12-01':'2026-11-14',description:`Movimiento FICTICIO ${i}`,categoryId:income?'income-salary':'expense-food',paymentMethod:'cash',taxReview:false,useKind:'personal',grossCents:null,withholdingCents:null,createdAt:'2026-11-14T12:00:00Z',updatedAt:'2026-11-14T12:00:00Z',deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1});
  }
  await store.setDeleted('ficticio-0',1,true,'Anulación FICTICIA');db.close();db=new DatabaseSync(path);store=new MoneyStore(adapter(db));
  const data=await store.snapshot();expect(data.movements).toHaveLength(128);expect(data.movements.slice(0,50)).toHaveLength(50);
  const november=historicalSeries(data,'2026-11',6).at(-1)!;expect(november).toMatchObject({income:20000,expenses:12400,hasRecords:true});expect(historicalSeries(data,'2026-12',6).at(-1)).toMatchObject({income:0,expenses:2000});
  expect(data.movements.filter(m=>!m.deletedAt&&m.kind==='expense'&&m.date.startsWith('2026-11'))).toHaveLength(124);
 }finally{db.close();rmSync(folder,{recursive:true,force:true});}
});
