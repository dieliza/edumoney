import { DatabaseSync } from 'node:sqlite';
import { createHash,randomBytes } from 'node:crypto';
import { mkdtempSync,readFileSync,rmSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeAll,describe,it,expect } from 'vitest';
import { migrate } from '../src/storage/migrate';
import { MoneyStore,type SqlDb } from '../src/modules/money/store';
import { BusinessStore } from '../src/modules/business/store';
import { BusinessLedgerStore } from '../src/modules/business/ledgerStore';
import { businessExport } from '../src/modules/business/ledgerDomain';
import { DocumentStore } from '../src/modules/documents/store';
import { PayrollStore } from '../src/modules/business/payroll/store';
import { blankEmployee,blankPolicy,type Actual } from '../src/modules/business/payroll/types';
import { reconciliation } from '../src/modules/business/payroll/domain';
import { payrollReport } from '../src/modules/business/payroll/report';
import { BackupStore,type BackupPayload } from '../src/modules/backup/store';
import { encryptBackup,decryptBackup } from '../src/modules/backup/crypto';

const password='RECUPERACIÓN-FICTICIA-2026';
const today=()=> '2026-11-09';
const digest=async(text:string)=>createHash('sha256').update(text).digest('hex');
function adapter(db:DatabaseSync):SqlDb {return {
 execAsync:async sql=>{db.exec(sql);},
 runAsync:async(sql,...p)=>({changes:Number(db.prepare(sql).run(...p).changes)}),
 getAllAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).all(...p) as T[],
 getFirstAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).get(...p) as T??null,
};}
async function open(path=':memory:') {
 const db=new DatabaseSync(path);await migrate(adapter(db));
 const ledger=new MoneyStore(adapter(db));
 return {db,ledger,backup:new BackupStore(ledger),business:new BusinessLedgerStore(ledger,today),payroll:new PayrollStore(ledger,today),documents:new DocumentStore(ledger,digest,today)};
}
async function seed(s:Awaited<ReturnType<typeof open>>) {
 await new BusinessStore(s.ledger).save({holder:{id:'h',legalName:'Titular FICTICIO recuperación',legalForm:'individual',municipality:'',merchantNumber:'',llcJurisdiction:null,llcMembers:null,prClassification:'pending',federalClassification:'pending'},dbas:[{id:'dba',holderId:'h',name:'DBA FICTICIO'}],projects:[{id:'p1',holderId:'h',dbaId:'dba',name:'Proyecto FICTICIO uno'},{id:'p2',holderId:'h',dbaId:'dba',name:'Proyecto FICTICIO dos'}]},0);
 const movementId=await s.business.save({id:'expense',holderId:'h',kind:'expense',date:today(),description:'Recibo mixto FICTICIO',amountCents:5500,paymentMethod:'bank',existingMovementId:null,expectedMovementVersion:null,useKind:'mixed',businessBps:3750,justification:'37.5% comercial FICTICIO',cpaStatus:'pending',grossCents:null,commissionCents:null,refundCents:null,ivuCents:null,allocations:[{projectId:'p1',amountCents:3300},{projectId:'p2',amountCents:2200}],confirmSimilar:false});
 await s.documents.save({id:'receipt',kind:'attachment',source:'library',description:'Imagen FICTICIA',date:today(),amountCents:5500,notes:'Comprobante FICTICIO conservado',rawText:null,image:{mime:'image/jpeg',base64:readFileSync('assets/tests/receipt.jpg').toString('base64')},keepImage:true,movementId,billId:null,expectedMovementVersion:1,expectedBillVersion:null,categoryId:null,paymentMethod:null,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:true});
 await s.business.reserve('h','tax',10000,'Reserva FICTICIA manual',0);
 await s.business.reserve('h','ivu',11500,'Reserva FICTICIA, no remesa',0);
 await s.business.reserve('h','payroll',0,'Cero confirmado FICTICIO',0);
 await s.payroll.saveEmployee({...blankEmployee('h'),id:'e',name:'Empleado FICTICIO privado',code:'REC-FICTICIO-01',last4:'0000',rateCents:220000,r4Date:'2026-01-01',personal:'individual',veteran:'no',dependents:0,halfDependents:0,allowances:9,extraCents:0,ordinary:'yes'});
 await s.payroll.savePolicy({...blankPolicy('h',2026),id:'policy',fica:'yes',sinot:'yes',sinotEmployeeBps:30,suta:'yes',sutaBps:290,futa:'yes',futaCreditBps:540,futaReductionBps:0,cfse:'yes',cfseBps:100,cfseClass:'CLASE FICTICIA',source:'Tasas FICTICIAS, no carta patronal'});
 await s.payroll.saveRun({id:'run',holderId:'h',employeeId:'e',date:'2026-10-31',start:'2026-10-01',end:'2026-10-31',reference:'CALC-FICTICIO',hoursHundredths:null,priorWagesCents:0,priorSource:'Cero previo confirmado FICTICIO',otherCents:0,note:''});
 const c=(await s.payroll.snapshot()).runs[0].calculation;
 const actual:Actual={gross:220000,ssWages:220000,medicareWages:220000,net:197019,withheld:{pr:5491,ss:13640,medicare:3190,additionalMedicare:0,sinot:660,other:0},reference:'PAGO-FICTICIO',note:'Importes FICTICIOS confirmados'};
 expect(c.net).toBe(actual.net);
 await s.payroll.confirmPayment('run',actual,1);
 await s.payroll.deposit({id:'deposit',holderId:'h',runId:'run',agency:'pr',date:'2026-11-01',amountCents:2000,reference:'DEP-FICTICIO/1',note:'Partida FICTICIA'});
}
let original:BackupPayload,encrypted:string;
beforeAll(async()=>{
 const s=await open();
 try {await seed(s);original=await s.backup.snapshot();encrypted=await encryptBackup(JSON.stringify(original),password,async n=>randomBytes(n));}
 finally{s.db.close();}
},30000);

describe('Recuperación integrada de Negocio y nómina — datos ficticios',()=>{
 it('recupera archivo cifrado en instalación vacía y conserva relaciones, imagen, exportaciones y acumulados tras reabrir',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'edumoney-recovery-ficticio-'));
  let s:Awaited<ReturnType<typeof open>>|undefined;
  try {
   const path=join(folder,'fresh.db'),file=join(folder,'respaldo.json');
   writeFileSync(file,encrypted);const saved=readFileSync(file,'utf8');
   expect(saved).not.toContain('Empleado FICTICIO privado');expect(saved).not.toContain('DBA FICTICIO');
   s=await open(path);expect((await s.backup.snapshot()).tables.business_holders.rows).toHaveLength(0);
   await s.backup.restore(JSON.parse(await decryptBackup(saved,password)),'RESTAURAR');
   expect((await s.backup.snapshot()).tables).toEqual(original.tables);
   const businessBefore=businessExport(await s.business.snapshot(),'h',null,['receipt']);
   const payrollBefore=payrollReport(await s.payroll.snapshot(),'h',2026);
   s.db.close();s=undefined;s=await open(path);
   expect((await s.backup.snapshot()).tables).toEqual(original.tables);
   expect(businessExport(await s.business.snapshot(),'h',null,['receipt'])).toEqual(businessBefore);
   expect(payrollReport(await s.payroll.snapshot(),'h',2026)).toEqual(payrollBefore);
   expect(businessBefore.totals).toMatchObject({expenseCents:5500,commercialExpenseCents:2063});
   expect((await s.documents.content('receipt'))?.base64).toBe(readFileSync('assets/tests/receipt.jpg').toString('base64'));
   expect((await s.ledger.snapshot()).movements).toHaveLength(1);
   expect(reconciliation(await s.payroll.snapshot(),'h','e',2026)).toMatchObject({count:1,gross:220000,net:197019});
   await s.backup.restore(original,'RESTAURAR');
   expect((await s.backup.snapshot()).tables).toEqual(original.tables);
   const run=(await s.payroll.snapshot()).runs[0];
   await expect(s.payroll.confirmPayment('run',run.actual!,run.version)).rejects.toThrow();
   await s.payroll.deposit({id:'deposit2',holderId:'h',runId:'run',agency:'pr',date:'2026-11-02',amountCents:3491,reference:'DEP-FICTICIO/2',note:'Segunda partida FICTICIA tras recuperar'});
   expect(reconciliation(await s.payroll.snapshot(),'h','e',2026).obligations.find(x=>x.agency==='pr')).toEqual({agency:'pr',due:5491,deposited:5491,difference:0});
  } finally {s?.db.close();rmSync(folder,{recursive:true,force:true});}
 },30000);
 it('contraseña incorrecta y archivo alterado conservan intacto el destino con datos',async()=>{
  const s=await open();
  try {
   await s.backup.restore(original,'RESTAURAR');const before=(await s.backup.snapshot()).tables;
   const recover=async(text:string,phrase:string)=>s.backup.restore(JSON.parse(await decryptBackup(text,phrase)),'RESTAURAR');
   await expect(recover(encrypted,'OTRA-CONTRASEÑA-FICTICIA')).rejects.toThrow('incorrecta');
   expect((await s.backup.snapshot()).tables).toEqual(before);
   const bad=JSON.parse(encrypted);bad.ciphertext=(bad.ciphertext[0]==='a'?'b':'a')+bad.ciphertext.slice(1);
   await expect(recover(JSON.stringify(bad),password)).rejects.toThrow('alterado');
   expect((await s.backup.snapshot()).tables).toEqual(before);
  } finally{s.db.close();}
 },30000);
 it('referencia de depósito rota revierte la sustitución completa y no confirmar no modifica registros',async()=>{
  const s=await open();
  try {
   await s.backup.restore(original,'RESTAURAR');
   await s.business.reserve('h','tax',12345,'Cambio FICTICIO posterior al respaldo',1);
   const before=(await s.backup.snapshot()).tables;
   const payload:unknown=JSON.parse(await decryptBackup(encrypted,password));
   await expect(s.backup.restore(payload,'')).rejects.toThrow('RESTAURAR');
   expect((await s.backup.snapshot()).tables).toEqual(before);
   const bad=structuredClone(payload) as BackupPayload;
   bad.tables.business_payroll_deposits.rows[0].run_id='missing-run';
   await expect(s.backup.restore(bad,'RESTAURAR')).rejects.toThrow('referencias');
   expect((await s.backup.snapshot()).tables).toEqual(before);
  } finally{s.db.close();}
 },30000);
});
