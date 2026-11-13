import {expect,it} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {recognizeIncome} from '../src/modules/income/recognition';
import {statementTotals,type IncomeStatement} from '../src/modules/income/domain';
import {IncomeStore} from '../src/modules/income/store';
import {MoneyStore,type SqlDb} from '../src/modules/money/store';
import {DocumentStore,DuplicateDocumentError} from '../src/modules/documents/store';
import type {DocumentInput} from '../src/modules/documents/types';
import {migrate} from '../src/storage/migrate';
import {BackupStore,BACKUP_TABLES_V14,type BackupPayload} from '../src/modules/backup/store';
function adapter(db:DatabaseSync):SqlDb{return {execAsync:async sql=>{db.exec(sql);},runAsync:async(sql,...p)=>({changes:Number(db.prepare(sql).run(...p).changes)}),getAllAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).all(...p) as T[],getFirstAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).get(...p) as T??null};}
const hash=async(s:string)=>createHash('sha256').update(s).digest('hex');
const statement=():IncomeStatement=>({version:1,kind:'paystub',issuer:'Patrono FICTICIO',reference:'FICTICIO-1',periodStart:'2026-11-01',periodEnd:'2026-11-13',grossCents:100000,netCents:85350,complete:true,deductions:[{id:'pr',categoryId:'pr-tax',label:'PR tax',amountCents:5000},{id:'ss',categoryId:'social-security',label:'SS',amountCents:6200},{id:'mc',categoryId:'medicare',label:'Medicare',amountCents:1450},{id:'med',categoryId:'medical',label:'Plan médico',amountCents:2000}]});
const document=():DocumentInput=>({id:'talonario-ficticio',kind:'paid_income',source:'library',description:'Patrono FICTICIO',date:'2026-11-13',amountCents:85350,notes:'Confirmado',rawText:null,image:{mime:'image/jpeg',base64:readFileSync('assets/tests/receipt.jpg').toString('base64')},keepImage:true,movementId:null,billId:null,expectedMovementVersion:null,expectedBillVersion:null,categoryId:null,paymentMethod:'bank',supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:true,incomeStatement:statement()});
async function setup(){const db=new DatabaseSync(':memory:');const sql=adapter(db);await migrate(sql);const ledger=new MoneyStore(sql);return {db,sql,ledger,docs:new DocumentStore(ledger,hash,()=> '2026-11-13'),income:new IncomeStore(ledger),backup:new BackupStore(ledger)};}
it('reconoce bruto, neto y deducciones actuales de PR sin mezclar acumulados ni patronales',()=>{
 const p=recognizeIncome('PATRONO FICTICIO\nCURRENT YTD\nGross Pay 1000.00 20000.00\nDEDUCTIONS\nPR Income Tax 50.00 1000.00\nSocial Security 6.20% 62.00 1240.00\nMedicare 14.50 290.00\nPlan médico 20.00 400.00\nEmployer Medicare 14.50 290.00\nNet Pay 853.50 17070.00');
 expect(p.gross).toBe('1000.00');expect(p.net).toBe('853.50');expect(p.deductions.map(d=>[d.categoryId,d.amount])).toEqual([['pr-tax','50.00'],['social-security','62.00'],['medicare','14.50'],['medical','20.00']]);
});
it('no adivina cuál cifra es actual sin encabezado y no clasifica Tax ambiguo como PR',()=>{
 const p=recognizeIncome('PAT FICTICIO\nIncome Tax 30.00 600.00\nYEAR TO DATE\nSocial Security 2000.00');
 expect(p.deductions).toHaveLength(1);expect(p.deductions[0]).toMatchObject({categoryId:'other',amount:''});expect(p.warnings.join(' ')).toContain('columnas');
 expect(recognizeIncome('CHEQUE FICTICIO\nAmount $200.00',true).net).toBe('200.00');
});
it('capta otras partidas en sección de deducciones para confirmar su categoría',()=>{
 const p=recognizeIncome('DEDUCCIONES\nEstacionamiento 15.00\nSINOT 3.00\nNET PAY 982.00');expect(p.deductions.map(d=>d.categoryId)).toEqual(['other','sinot']);
});
it('separa la retención PR de Seguro Social, Medicare y demás sin volver a sumar gastos',()=>{
 const p=statement();expect(statementTotals(p)).toMatchObject({known:14650,difference:0,withholding:5000});
 expect(()=>statementTotals({...p,netCents:85000})).toThrow('cuadrar');
});
it('mantiene pendientes desconocidos, sin asumir retención o bruto cero',()=>{
 const p={...statement(),kind:'check' as const,grossCents:null,complete:false,deductions:[]};expect(statementTotals(p)).toMatchObject({withholding:null,difference:null});
 expect(()=>statementTotals({...p,complete:true})).toThrow('completo');
});
it('guarda ingreso, foto y desglose atómicamente y detecta reintento y foto repetida',async()=>{
 const s=await setup();try{await s.docs.save(document());await s.docs.save(document());const data=await s.ledger.snapshot();expect(data.movements).toHaveLength(1);expect(data.movements[0]).toMatchObject({kind:'income',amountCents:85350,grossCents:100000,withholdingCents:5000});expect((await s.income.snapshot()).statements[0].statement).toEqual(statement());expect((await s.docs.content(document().id))?.base64).toBe(document().image?.base64);await expect(s.docs.save({...document(),id:'duplicado'})).rejects.toBeInstanceOf(DuplicateDocumentError);await expect(s.docs.save({...document(),incomeStatement:{...statement(),reference:'OTRO'}})).rejects.toThrow('reintento');}finally{s.db.close();}
});
it('conserva categorías personalizadas y detalles en respaldo 16 y admite restauración 14',async()=>{
 const s=await setup();try{await s.income.addCategory('parking','Estacionamiento FICTICIO');await expect(s.income.addCategory('dup','Estacionamiento FICTICIO')).rejects.toThrow('existe');const d=document();d.incomeStatement!.deductions[3]={id:'other',categoryId:'parking',label:'Estacionamiento',amountCents:2000};await s.docs.save(d);const snapshot=await s.backup.snapshot();expect(snapshot.schema).toBe(16);await s.backup.restore(snapshot,'RESTAURAR');expect((await s.income.snapshot()).categories.some(c=>c.id==='parking')).toBe(true);expect((await s.income.snapshot()).statements).toHaveLength(1);const old:BackupPayload={...snapshot,schema:14,tables:Object.fromEntries(BACKUP_TABLES_V14.map(t=>[t,snapshot.tables[t]]))};await s.backup.restore(old,'RESTAURAR');expect((await s.income.snapshot()).statements).toHaveLength(0);expect((await s.ledger.snapshot()).movements).toHaveLength(1);}finally{s.db.close();}
});
it('revierte el movimiento si falla la escritura del desglose',async()=>{
 const s=await setup();try{s.db.exec("CREATE TRIGGER fail_statement BEFORE INSERT ON income_statements BEGIN SELECT RAISE(ABORT,'Fallo ficticio'); END;");await expect(s.docs.save(document())).rejects.toThrow('Fallo ficticio');expect((await s.ledger.snapshot()).movements).toHaveLength(0);expect((await s.docs.snapshot()).documents).toHaveLength(0);}finally{s.db.close();}
});
it('expone datos salariales y deducciones en el expediente CPA sin duplicar ingresos',async()=>{
 const s=await setup();try{await s.docs.save(document());const {TaxStore}=await import('../src/modules/tax/store');const {buildExport}=await import('../src/modules/tax/domain');const snapshot=await new TaxStore(s.ledger).snapshot(2026);expect(snapshot.incomeStatements).toHaveLength(1);const report=buildExport(snapshot,false,[]);expect(report.movements).toHaveLength(1);expect(report.incomeStatements[0].statement.deductions).toHaveLength(4);expect(report.csv).toContain('deducciones_talonario_json');expect(report.csv).toContain('social-security');expect(report.csv.split('\r\n')).toHaveLength(2);}finally{s.db.close();}
});
it('impide repetir referencia del mismo pagador y permite un pago realmente distinto confirmado',async()=>{
 const s=await setup();try{const first={...document(),source:'manual' as const,image:null,keepImage:false};await s.docs.save(first);await expect(s.docs.save({...first,id:'copia',date:'2026-11-12'})).rejects.toBeInstanceOf(DuplicateDocumentError);await s.docs.save({...first,id:'otro-pago',confirmSimilar:true,incomeStatement:{...statement(),reference:'FICTICIO-2'}});expect((await s.ledger.snapshot()).movements).toHaveLength(2);}finally{s.db.close();}
});
it('omite líneas identificadoras sensibles y no las propone como deducciones',()=>{
 const p=recognizeIncome('PATRONO FICTICIO\nSocial Security Number 123-45-6789\nSocial Security 62.00\nNet Pay 938.00');expect(p.deductions).toHaveLength(1);expect(JSON.stringify(p)).not.toContain('123-45-6789');
});
it('respeta el cambio de orden entre acumulado y actual dentro del mismo talonario',()=>{
 const p=recognizeIncome('PATRONO FICTICIO\nCURRENT YTD\nGross Pay 1000.00 20000.00\nDEDUCTIONS YTD CURRENT\nPR Income Tax 1000.00 50.00\nNet Pay 17000.00 850.00');expect(p.gross).toBe('1000.00');expect(p.deductions[0].amount).toBe('50.00');expect(p.net).toBe('850.00');
});
it('conserva el desglose de tarifas y horas al guardar, reabrir y restaurar el cheque',async()=>{const s=await setup();try{const earnings=[{code:'REGHR',rate:'20.00',hours:'50.00',amount:'1000.00'}];const d=document();d.incomeStatement={...statement(),earnings};await s.docs.save(d);expect((await s.income.snapshot()).statements[0].statement.earnings).toEqual(earnings);const backup=await s.backup.snapshot();await s.backup.restore(backup,'RESTAURAR');expect((await s.income.snapshot()).statements[0].statement.earnings).toEqual(earnings);expect((await s.ledger.snapshot()).movements).toHaveLength(1);}finally{s.db.close();}});
it('guarda y reabre la propuesta estructurada de Gemini sin incluir claves ni sumar dos ingresos',async()=>{const s=await setup();try{const {geminiStatement}=await import('../src/modules/documents/ai/types');const reading={document_type:'paystub' as const,currency:'USD' as const,merchant:'Patrono FICTICIO',date:'2026-11-13',period_start:null,period_end:null,total_paid_cents:null,gross_cents:100000,net_cents:85350,deductions:statement().deductions.map(d=>({label:d.label,category:d.categoryId,amount_cents:d.amountCents})),earnings:[{code:'REGHR',rate_cents:2000,hours:'50.00',amount_cents:100000}],warnings:[]};const p=geminiStatement(reading,85350,'Patrono FICTICIO',['pr','ss','mc','med'])!;await s.docs.save({...document(),incomeStatement:p});expect((await s.income.snapshot()).statements[0].statement).toEqual(p);expect((await s.ledger.snapshot()).movements).toHaveLength(1);expect((await s.ledger.snapshot()).movements[0].amountCents).toBe(85350);expect(p.complete).toBe(false);expect(JSON.stringify(await s.backup.snapshot())).not.toContain('X-Gemini-Key');}finally{s.db.close();}});
