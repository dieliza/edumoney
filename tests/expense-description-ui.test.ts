import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';

import {CategoryPicker} from '../src/modules/money/CategoryPicker';
import {MovementForm} from '../src/modules/money/MovementForm';




import {MoneyStore,type SqlDb} from '../src/modules/money/store';
import {DatabaseSync} from 'node:sqlite';
import {migrate} from '../src/storage/migrate';
import {setAccountScope} from '../src/modules/money/accountScope';
import {loadSearchItems} from '../src/modules/search/load';
import {searchItems} from '../src/modules/search/model';
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:'light',colors:{}})}));
const hooks=vi.hoisted(()=>({values:[] as unknown[],cursor:0}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const slot=(initial:unknown)=>{const i=hooks.cursor++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [hooks.values[i],(value:unknown)=>{hooks.values[i]=typeof value==='function'?(value as (old:unknown)=>unknown)(hooks.values[i]):value;}];};return {...actual,useSyncExternalStore:(_subscribe:unknown,get:()=>unknown)=>get(),useEffect:()=>{},useState:slot,useRef:(initial:unknown)=>slot({current:initial})[0]};});
vi.mock('react-native',()=>({Text:()=>null,Image:()=>null,View:()=>null,Pressable:()=>null,ActivityIndicator:()=>null}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('../src/ui/components',()=>({Body:()=>null,ActionButton:()=>null}));
vi.mock('../src/ui/PhotoAnalysis',()=>({PhotoAnalysis:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Choices:()=>null,Field:()=>null,Sheet:()=>null,ErrorNotice:()=>null}));
vi.mock('../src/modules/money/TransactionFormUI',()=>({TransactionSheet:()=>null,TransactionSegments:()=>null,TransactionLink:()=>null,TransactionSaveButton:()=>null,TransactionError:()=>null,useTransactionStyles:()=>({})}));
vi.mock('../src/modules/money/CategoryPicker',()=>({CategoryPicker:()=>null}));
vi.mock('../src/modules/money/TransactionHistory',()=>({TransactionHistory:()=>null}));
vi.mock('../src/modules/documents/ReceiptPhotoButtons',()=>({ReceiptPhotoButtons:()=>null}));
vi.mock('../src/modules/documents/ReadingDetailsForm',()=>({ReadingDetailsForm:()=>null}));
vi.mock('../src/core/id',()=>({newId:()=> 'FICTICIO'}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(tree:unknown):Node[]{if(Array.isArray(tree))return tree.flatMap(nodes);if(!isValidElement(tree))return [];const node=tree as Node;return [node,...nodes(node.props.headerAction),...nodes(node.props.children)];}
function render(component:()=>unknown){hooks.cursor=0;return nodes(component());}
function field(tree:Node[],label:string){const node=tree.find(n=>n.props.label===label);expect(node,`field ${label}`).toBeTruthy();return node!;}

const categories=[{id:'salary',name:'Salario FICTICIO',kind:'income' as const,archived:false},{id:'house',name:'Vivienda FICTICIA',kind:'expense' as const,archived:false}];
function adapter(db:DatabaseSync):SqlDb{return{execAsync:async sql=>{db.exec(sql);},runAsync:async(sql,...p)=>({changes:Number(db.prepare(sql).run(...p).changes)}),getAllAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).all(...p) as T[],getFirstAsync:async<T>(sql:string,...p:(string|number|null)[])=>db.prepare(sql).get(...p) as T??null};}
async function setup(){hooks.values=[];setAccountScope('personal');const db=new DatabaseSync(':memory:');await migrate(adapter(db));db.exec("INSERT INTO categories(id,name,kind) VALUES('house','Vivienda FICTICIA','expense'),('salary','Salario FICTICIO','income')");return {db,store:new MoneyStore(adapter(db))};}
function enter(n:Node,value:string){(n.props.onChangeText as (value:string)=>void)(value);}
function press(tree:Node[],id:string){const n=tree.find(n=>n.props.title===id);expect(n,id).toBeTruthy();(n!.props.onPress as ()=>void)();}
it('guarda la descripción personal y dos pulsaciones no duplican el gasto; la lupa lo encuentra',async()=>{const {db,store}=await setup();try{
 const close=vi.fn(),props={kind:'expense' as const,categories,store,close,saved:async()=>{}},draw=()=>render(()=>MovementForm(props));
 let t=draw();expect(t.filter(n=>n.props.testID==='movement-description')).toHaveLength(1);enter(field(t,'Descripción (opcional)'),'Reparación del balcón');enter(field(t,'Importe (USD)'),'40.25');
 (t.find(n=>n.type===CategoryPicker)!.props.onChange as (id:string,name:string)=>void)('house','Vivienda FICTICIA');t=draw();press(t,'Guardar gasto');press(t,'Guardar gasto');
 await vi.waitFor(()=>expect(close).toHaveBeenCalledOnce());const snap=await store.snapshot();expect(snap.movements).toHaveLength(1);expect(snap.movements[0]).toMatchObject({description:'Reparación del balcón',amountCents:4025,useKind:'personal',categoryId:'house'});expect(searchItems(await loadSearchItems(store),'balcon')).toHaveLength(1);
 }finally{db.close();}});
it('si la descripción queda vacía conserva el nombre de categoría como texto',async()=>{const {db,store}=await setup();try{const close=vi.fn(),props={kind:'expense' as const,categories,store,close,saved:async()=>{}},draw=()=>render(()=>MovementForm(props));const t=draw();enter(field(t,'Importe (USD)'),'1.00');(t.find(n=>n.type===CategoryPicker)!.props.onChange as (id:string,name:string)=>void)('house','Vivienda FICTICIA');press(draw(),'Guardar gasto');await vi.waitFor(()=>expect(close).toHaveBeenCalled());expect((await store.snapshot()).movements[0].description).toBe('Vivienda FICTICIA');}finally{db.close();}});
it('editar puede cambiar la descripción existente sin crear otro gasto',async()=>{const {db,store}=await setup();try{
 db.exec("INSERT INTO movements(id,idempotency_key,kind,amount_cents,date,description,category_id,payment_method,use_kind,created_at,updated_at) VALUES('m','m','expense',1000,'2026-11-25','Antes','house','cash','personal','now','now')");
 const initial=(await store.snapshot()).movements[0],close=vi.fn(),props={initial,kind:'expense' as const,categories,store,close,saved:async()=>{}},draw=()=>render(()=>MovementForm(props));
 enter(field(draw(),'Descripción (opcional)'),'Después de corregir');press(draw(),'Guardar gasto');await vi.waitFor(()=>expect(close).toHaveBeenCalled());const snap=await store.snapshot();expect(snap.movements).toHaveLength(1);expect(snap.movements[0]).toMatchObject({id:'m',description:'Después de corregir',amountCents:1000});
 }finally{db.close();}});
