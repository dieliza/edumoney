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
