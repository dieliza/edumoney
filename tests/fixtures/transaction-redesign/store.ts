import initSqlJs from 'sql.js';
import {migrate} from '../../../src/storage/migrate';
import {MoneyStore,type SqlDb} from '../../../src/modules/money/store';
import {BusinessLedgerStore} from '../../../src/modules/business/ledgerStore';
import {monthlySummary} from '../../../src/modules/money/domain';
import {commercialHomeOverview} from '../../../src/ui/commercialHomeOverview';
import {onDataCommitted} from '../../../src/storage/changeEvents';
const SQL=await initSqlJs({locateFile:()=>'/sql-wasm.wasm'}),database=new SQL.Database();
const sql:SqlDb={execAsync:async query=>{database.run(query);},runAsync:async(query,...args)=>{database.run(query,args);return{changes:database.getRowsModified()};},getAllAsync:async<T>(query:string,...args:(string|number|null)[])=>{const statement=database.prepare(query);try{statement.bind(args);const rows:T[]=[];while(statement.step())rows.push(statement.getAsObject() as T);return rows;}finally{statement.free();}},getFirstAsync:async<T>(query:string,...args:(string|number|null)[])=>{const statement=database.prepare(query);try{statement.bind(args);return statement.step()?statement.getAsObject() as T:null;}finally{statement.free();}}};
await migrate(sql);
database.run("INSERT INTO business_holders(id,legal_name,legal_form,municipality,merchant_number,pr_classification,federal_classification,updated_at) VALUES('qa-business','Negocio FICTICIO','individual','','','','','now')");
database.run("INSERT INTO categories(id,name,kind,archived) VALUES('qa-income','Ventas FICTICIAS','income',0),('qa-business-category','Comercial','expense',0),('qa-custom','Patio FICTICIO','expense',0)");
export const ledger=new MoneyStore(sql);
let delay=0,writeCalls=0,commits=0;
onDataCommitted(()=>{commits++;});
for(const method of ['create','saveCommercial'] as const){const original=ledger[method].bind(ledger) as (...args:unknown[])=>Promise<unknown>;(ledger[method] as unknown as (...args:unknown[])=>Promise<unknown>)=async(...args)=>{writeCalls++;if(delay)await new Promise(resolve=>setTimeout(resolve,delay));return original(...args);};}
export async function getMoneyStore(){return ledger;}
export const isPreview=true;
export async function reviewSnapshot(){const all=await ledger.snapshot(),personal=await ledger.snapshot(true),business=await new BusinessLedgerStore(ledger).snapshot();return{all,personal,business,personalSummary:monthlySummary(personal,'2026-11'),businessSummary:commercialHomeOverview(business,all.categories,'2026-11').summary,writeCalls,commits};}
export function setWriteDelay(value:number){delay=value;}
