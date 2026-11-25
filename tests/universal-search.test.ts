import {DatabaseSync} from 'node:sqlite';
import {expect,it} from 'vitest';
import {migrate} from '../src/storage/migrate';
import {MoneyStore,type SqlDb} from '../src/modules/money/store';
import {loadSearchItems} from '../src/modules/search/load';
import {searchItems,sectionItems,type SearchItem} from '../src/modules/search/model';
import {businessHelpExcluded,fieldMeaning,sectionMeaning} from '../src/ui/meaningCatalog';
const adapter=(db:DatabaseSync):SqlDb=>({execAsync:async sql=>{db.exec(sql);},runAsync:async(sql,...p)=>({changes:Number(db.prepare(sql).run(...p).changes)}),getAllAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).all(...p) as T[],getFirstAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).get(...p) as T??null});
async function setup(){const db=new DatabaseSync(':memory:');await migrate(adapter(db));return {db,store:new MoneyStore(adapter(db))};}
const fixture:SearchItem={id:'x',title:'Compra de café',section:'Transacciones',detail:'Comida · $1234.50 · Personal',date:'2026-11-25',category:'Comida',words:'cash efectivo',target:{path:'/charts'}};
it('encuentra palabras, acentos, categoría y método combinados',()=>{expect(searchItems([fixture],'CAFE comida efectivo')).toEqual([fixture]);expect(searchItems([fixture],'cafe negocio')).toEqual([]);});
it('encuentra fechas ISO, españolas y mes por nombre',()=>{for(const q of ['2026-11-25','25/11/2026','25 de noviembre','noviembre 2026','11/25/26'])expect(searchItems([fixture],q)).toHaveLength(1);});
it('encuentra importes con separador de miles y filtra por sección',()=>{expect(searchItems([fixture],'$1,234.50')).toHaveLength(1);expect(searchItems([fixture],'café','Deudas')).toHaveLength(0);});
it('encuentra las secciones por nombre o sinónimo y no ofrece administración de API',()=>{for(const q of ['simulador','editar historiales','presupuesto','dictados','DBA'])expect(searchItems(sectionItems,q).length).toBeGreaterThan(0);expect(sectionItems.some(i=>/api|education-admin/.test(i.target.path))).toBe(false);});
it('lee todo el historial y conserva cuenta, categoría y acceso exacto sin escribir datos',async()=>{const {db,store}=await setup();try{
 db.exec("INSERT INTO categories(id,name,kind) VALUES('comida','Café y comida','expense')");
 const stmt=db.prepare("INSERT INTO movements(id,idempotency_key,kind,amount_cents,date,description,category_id,payment_method,use_kind,created_at,updated_at) VALUES(?,?,'expense',1250,'2025-01-25',?,'comida','cash',?,'now','now')");
 for(let i=0;i<63;i++)stmt.run('m'+i,'m'+i,'Compra FICTICIA '+i,i===62?'business':'personal');
 const before=db.prepare('SELECT total_changes() AS n').get();
 const items=await loadSearchItems(store);
 expect(searchItems(items,'FICTICIA')).toHaveLength(63);
 const last=items.find(i=>i.id==='movement:m62')!;expect(last.account).toBe('business');expect(last.category).toBe('Café y comida');expect(last.edit?.params?.movementId).toBe('m62');
 expect(db.prepare('SELECT total_changes() AS n').get()).toEqual(before);
 }finally{db.close();}});
it('mantiene eliminadas visibles como tales y no ofrece editarlas',async()=>{const {db,store}=await setup();try{db.exec("INSERT INTO movements(id,idempotency_key,kind,amount_cents,date,description,use_kind,created_at,updated_at,deleted_at) VALUES('x','x','income',500,'2026-11-25','Eliminada FICTICIA','personal','now','now','now')");const i=(await loadSearchItems(store)).find(i=>i.id==='movement:x')!;expect(i.detail).toContain('Eliminada');expect(i.edit).toBeUndefined();}finally{db.close();}});
it('cada perfil usa su propio índice y ninguna clave ni número de comerciante se indexa',async()=>{const a=await setup(),b=await setup();try{a.db.exec("INSERT INTO business_holders(id,legal_name,legal_form,municipality,merchant_number,pr_classification,federal_classification,updated_at) VALUES('h','Tienda FICTICIA','individual','Bayamón','SECRETO-NO-INDEXAR','','','now')");expect(searchItems(await loadSearchItems(a.store),'Tienda FICTICIA')).toHaveLength(1);expect(searchItems(await loadSearchItems(b.store),'Tienda FICTICIA')).toHaveLength(0);expect(searchItems(await loadSearchItems(a.store),'SECRETO-NO-INDEXAR')).toHaveLength(0);}finally{a.db.close();b.db.close();}});
it('vincula dictados, metas y escenarios a su registro, sin confundir voz con categoría',async()=>{const {db,store}=await setup();try{
 db.exec("INSERT INTO documents(id,sha256,status,source,description) VALUES('d','sha','pending','voice','Dictado FICTICIO'); INSERT INTO goals(id,name,target_cents) VALUES('g','Viaje FICTICIO',10000); INSERT INTO decision_scenarios(id,name,kind,input_json,formula_version,created_at) VALUES('s','Auto FICTICIO','vehicle','{}',1,'2026-11-25')");
 const items=await loadSearchItems(store);
 expect(items.find(i=>i.id==='documents:d')?.target).toEqual({path:'/dictations',params:{dictation:'d'}});
 expect(items.find(i=>i.id==='goals:g')?.target.params?.goalId).toBe('g');
 expect(items.find(i=>i.id==='decision_scenarios:s')?.target.params).toMatchObject({scenarioId:'s',kind:'vehicle'});
 }finally{db.close();}});
it('las ayudas distinguen tasa nominal y APR y explican cómo completar el campo',()=>{expect(fieldMeaning('Tasa nominal anual fija (%)')).toContain('Para 12 %, escribe 12');expect(fieldMeaning('Tasa nominal anual hipotética (%)')).toContain('no garantiza');expect(fieldMeaning('APR (%)')).toContain('no la confundas');expect(fieldMeaning('Principal solicitado')).toContain('dinero');});
it('ofrece ayuda en secciones personales y respeta el contenido de negocios',()=>{for(const path of ['/money','/goals','/learn','/progress','/decisions','/debts','/bills','/documents','/dictations','/settings','/backup','/sync','/charts'])expect(sectionMeaning(path,'Sección')).toBeTruthy();for(const path of ['/business','/business-ledger','/business-payroll','/business-obligations','/tax','/planilla']){expect(businessHelpExcluded(path)).toBe(true);expect(sectionMeaning(path,'Negocio')).toBeUndefined();}});

it('busca empleados por nombre y código sin exponer datos familiares ni identificadores',async()=>{const {db,store}=await setup();try{
 db.exec("INSERT INTO business_holders(id,legal_name,legal_form,municipality,merchant_number,pr_classification,federal_classification,updated_at) VALUES('h','Patrono FICTICIO','individual','','','','','now')");
 db.prepare("INSERT INTO business_payroll_employees(id,holder_id,code,record_json,updated_at) VALUES('e','h','E-001',?,'now')").run(JSON.stringify({name:'Persona FICTICIA',last4:'SECRETOIDENTIFICADOR',dependents:77}));
 const items=await loadSearchItems(store);expect(searchItems(items,'Persona FICTICIA')).toHaveLength(1);expect(searchItems(items,'E-001')).toHaveLength(1);expect(searchItems(items,'SECRETOIDENTIFICADOR')).toHaveLength(0);
 }finally{db.close();}});

it('abre la revisión comercial existente en Negocio y conserva su titular',async()=>{const {db,store}=await setup();try{
 db.exec("INSERT INTO business_holders(id,legal_name,legal_form,municipality,merchant_number,pr_classification,federal_classification,updated_at) VALUES('h','Patrono FICTICIO','individual','','','','','now'); INSERT INTO movements(id,idempotency_key,kind,amount_cents,date,description,use_kind,created_at,updated_at) VALUES('m','m','income',20000,'2026-11-25','Venta FICTICIA','business','now','now'); INSERT INTO business_entries(id,holder_id,movement_id,kind,movement_version,use_kind,justification,cpa_status,updated_at) VALUES('e','h','m','income',1,'business','','pending','now')");
 const row=(await loadSearchItems(store)).find(i=>i.id==='movement:m')!;expect(row.edit).toEqual({path:'/business-ledger',params:{holderId:'h',entryId:'e'}});expect(row.account).toBe('business');
 }finally{db.close();}});
