import type {MoneyStore,SqlDb} from '../money/store';
import {lessons} from '../learning/content';
import {sectionItems,type SearchItem,dateWords} from './model';
import {paymentLabels} from '../money/types';
type Row=Record<string,unknown>;
type Source={table:string;section:string;path:string;names:string[];fields:string[];date?:string;amount?:string;business?:boolean};
const sources:Source[]=[
 {table:'money_funds',section:'Fondos',path:'/funds',names:['name'],fields:['name','kind','scope','budget_month'],amount:'target_cents'},
 {table:'fund_transfers',section:'Transferencias internas',path:'/funds',names:['description'],fields:['description','scope','reversed_at'],date:'date',amount:'amount_cents'},
 {table:'categories',section:'Categorías',path:'/money',names:['name'],fields:['name','kind','archived']},
 {table:'bills',section:'Facturas',path:'/bills',names:['provider'],fields:['provider','recurrence','voided_at'],date:'due_date',amount:'amount_cents'},
 {table:'debts',section:'Deudas',path:'/debts',names:['name'],fields:['name','due_date','closing_date','archived'],date:'due_date',amount:'balance_cents'},
 {table:'goals',section:'Metas',path:'/goals',names:['name'],fields:['name','kind','archived'],date:'desired_date',amount:'target_cents'},
 {table:'documents',section:'Documentos',path:'/documents',names:['description'],fields:['description','notes','source','status','record_kind','deleted_at','raw_text'],date:'document_date',amount:'amount_cents'},
 {table:'income_schedules',section:'Cobros programados',path:'/debts',names:['description'],fields:['description','cadence','active'],date:'next_date',amount:'amount_cents'},
 {table:'bill_series',section:'Gastos programados',path:'/debts',names:['provider','description'],fields:['provider','description','cadence','active'],date:'next_date',amount:'amount_cents'},
 {table:'decision_scenarios',section:'Simulaciones',path:'/decisions',names:['name'],fields:['name','kind'],date:'created_at'},
 {table:'business_holders',section:'Negocios',path:'/business',names:['legal_name'],fields:['legal_name','legal_form','municipality'],business:true},
 {table:'business_dbas',section:'Negocios',path:'/business',names:['name'],fields:['name'],business:true},
 {table:'business_projects',section:'Proyectos',path:'/business',names:['name'],fields:['name'],business:true},
 {table:'business_payroll_runs',section:'Nómina',path:'/business-payroll',names:['reference'],fields:['reference'],date:'date',business:true},
 {table:'business_obligation_records',section:'Obligaciones comerciales',path:'/business-obligations',names:['form','reference'],fields:['form','reference','period','status','note','voided_at'],date:'due_date',amount:'amount_cents',business:true},
 {table:'business_planning_records',section:'Planificación comercial',path:'/business-planning',names:['record_key'],fields:['record_key','kind','voided_at'],date:'updated_at',business:true},
 {table:'business_contractors',section:'Contratistas',path:'/business-obligations',names:['name','legal_name'],fields:['name','legal_name'],business:true}
];
const str=(v:unknown)=>typeof v==='string'?v:typeof v==='number'?String(v):'';
const wordLabel=(value:string)=>({pending:'pendiente',received:'recibido',corrected:'corregido',not_applicable:'no aplica',voice:'dictado voz',camera:'foto cámara',library:'foto galería',income:'ingreso',expense:'gasto',monthly:'mensual',weekly:'semanal',annual:'anual'}[value]??value);
const kindName=(kind:string)=>({income:'Ingreso',expense:'Gasto',transfer:'Transferencia',loan:'Préstamo',debt_payment:'Pago de deuda',goal_contribution:'Aportación a meta'}[kind]??kind);
/** Solo columnas permitidas. Nunca claves, perfiles familiares, credenciales, binarios ni auditorías. */
async function tableRows(db:SqlDb,table:string,fields:string[]):Promise<Row[]>{
 const columns=await db.getAllAsync<{name:string}>('PRAGMA table_info('+table+')');
 const allowed=new Set(columns.map(c=>c.name));
 const selected=['id',...fields].filter((c,i,a)=>allowed.has(c)&&a.indexOf(c)===i);
 return selected.length?db.getAllAsync<Row>('SELECT '+selected.join(',')+' FROM '+table):[];
}
export async function loadSearchItems(store:MoneyStore):Promise<SearchItem[]>{
 return store.read(async db=>{
 const items:SearchItem[]=[...sectionItems,...lessons.map(l=>({id:'lesson:'+l.id,title:l.title,section:'Aprende',detail:l.summary,words:[...l.paragraphs,l.question,l.explanation].join(' '),target:{path:['debt','credit','loan','vehicle','home'].includes(l.id)?'/debt-lessons':'/learn',params:{lessonId:l.id}}}))];
 const categories=await db.getAllAsync<{id:string;name:string}>('SELECT id,name FROM categories');
 const category=new Map(categories.map(c=>[c.id,c.name]));
 const commercialEntries=await db.getAllAsync<{id:string;movement_id:string;holder_id:string}>("SELECT id,movement_id,holder_id FROM business_entries WHERE use_kind='business'");
 const commercialByMovement=new Map(commercialEntries.map(e=>[e.movement_id,e]));
 const commercial=new Set(commercialByMovement.keys());
 const movementAccounts=new Map<string,'business'|'personal'>();
 const movements=await tableRows(db,'movements',['kind','description','date','amount_cents','category_id','payment_method','use_kind','deleted_at']);
 for(const r of movements){
  const id=str(r.id),business=r.use_kind==='business'||commercial.has(id),account=business?'business':'personal',kind=kindName(str(r.kind)),cat=category.get(str(r.category_id))??'';
  movementAccounts.set(id,account);
  const amount=typeof r.amount_cents==='number'?(r.amount_cents/100).toFixed(2):'',method=str(r.payment_method);
  const detail=[kind,business?'Comercial':'Personal',cat,str(r.date),amount?'$'+amount:'',r.deleted_at?'Eliminada':''].filter(Boolean).join(' · ');
  items.push({id:'movement:'+id,title:str(r.description)||kind,section:'Transacciones',detail,date:str(r.date),category:cat,account,words:[kind,r.kind==='income'?'ingresos cobros':r.kind==='expense'?'gastos pagos':'',cat,amount,method,(paymentLabels as Record<string,string>)[method]??method.replace(/^custom:/,''),business?'comercial negocio':'personal'].join(' '),target:{path:'/charts',params:{month:str(r.date).slice(0,7)}},edit:!r.deleted_at&&['income','expense'].includes(str(r.kind))?(commercialByMovement.has(id)?{path:'/business-ledger',params:{holderId:commercialByMovement.get(id)!.holder_id,entryId:commercialByMovement.get(id)!.id}}:{path:'/money',params:{movementId:id}}):undefined});
 }
 for(const s of sources){
  const rows=await tableRows(db,s.table,[...s.fields,...s.names,...(s.date?[s.date]:[]),...(s.amount?[s.amount]:[]),'movement_id','holder_id']);
  for(const r of rows){
   const id=str(r.id),title=s.names.map(n=>str(r[n])).find(Boolean)||s.section;
   const date=s.date?str(r[s.date]).slice(0,10):'',amount=s.amount&&typeof r[s.amount]==='number'?(Number(r[s.amount])/100).toFixed(2):'';
   const params:Record<string,string>={};
   if(s.table==='categories')params.section='categories';
   if(s.table==='debts')params.debtId=id;
   if(s.table==='goals')params.goalId=id;
   if(s.table==='money_funds'){params.fundId=id;params.scope=str(r.scope);}
   if(s.table==='fund_transfers'){params.transferId=id;params.scope=str(r.scope);}
   if(s.table==='documents')params.documentId=id;
   if(s.table==='documents'&&r.source==='voice'){delete params.documentId;params.dictation=id;}
   if(s.table==='bills')params.billId=id;
   if(s.table==='decision_scenarios')params.scenarioId=id;
   if(s.table==='decision_scenarios')params.kind=str(r.kind);
   if(s.table==='income_schedules')params.tab='scheduled';
   if(s.table==='bill_series')params.tab='bills';
   if(r.holder_id)params.holderId=str(r.holder_id);
   const deleted=!!r.deleted_at||!!r.voided_at;
   items.push({id:s.table+':'+id,title,section:s.section,date,detail:[s.section,date,amount?'$'+amount:'',r.archived?'Archivada':'',deleted?'Eliminada':''].filter(Boolean).join(' · '),words:s.fields.map(f=>str(r[f])+' '+wordLabel(str(r[f]))).join(' ')+' '+dateWords(date)+' '+amount,account:s.business?'business':s.table==='documents'?movementAccounts.get(str(r.movement_id)):undefined,target:{path:r.source==='voice'?'/dictations':s.path,params}});
  }
 }
 const employees=await tableRows(db,'business_payroll_employees',['holder_id','code','record_json']);
 for(const row of employees){
  try{const employee=JSON.parse(str(row.record_json));const name=str(employee.name);if(name)items.push({id:'employee:'+str(row.id),title:name,section:'Nómina',detail:'Empleado · Comercial',words:name+' '+str(row.code),account:'business',target:{path:'/business-payroll',params:{holderId:str(row.holder_id)}}});}catch{/* Se omiten perfiles dañados; no se indexan datos contributivos del empleado. */}
 }
 const tips=await tableRows(db,'education_content',['version','record_json']);
 const latest=new Map<string,Row>();
 for(const row of tips){const old=latest.get(str(row.id));if(!old||Number(row.version)>Number(old.version))latest.set(str(row.id),row);}
 for(const row of latest.values()){
  if(str(row.id).startsWith('__'))continue;
  try{const tip=JSON.parse(str(row.record_json));if(typeof tip.title==='string')items.push({id:'tip:'+str(row.id),title:tip.title,section:'Aprende',detail:'Lección de Aprende',words:[tip.body,tip.example,tip.question,tip.explanation].filter(v=>typeof v==='string').join(' '),target:{path:'/learn'}});}catch{/* Un registro editorial dañado no bloquea los datos financieros. */}
 }
 return items;
 });
}
