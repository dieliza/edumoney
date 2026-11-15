import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {ReviewForm,type ReviewDraft} from '../src/modules/documents/ReviewForm';
import {CategoryPicker} from '../src/modules/money/CategoryPicker';
import {MovementForm} from '../src/modules/money/MovementForm';
import {blankReadingDetails} from '../src/modules/documents/ai/details';
import type {DocumentsSnapshot} from '../src/modules/documents/types';
import type {DocumentStore} from '../src/modules/documents/store';
import type {MoneyStore} from '../src/modules/money/store';
const hooks=vi.hoisted(()=>({values:[] as unknown[],cursor:0}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const slot=(initial:unknown)=>{const i=hooks.cursor++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [hooks.values[i],(value:unknown)=>{hooks.values[i]=typeof value==='function'?(value as (old:unknown)=>unknown)(hooks.values[i]):value;}];};return {...actual,useState:slot,useRef:(initial:unknown)=>slot({current:initial})[0]};});
vi.mock('react-native',()=>({Image:()=>null,View:()=>null,Pressable:()=>null,ActivityIndicator:()=>null}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('../src/ui/components',()=>({Body:()=>null,ActionButton:()=>null}));
vi.mock('../src/ui/PhotoAnalysis',()=>({PhotoAnalysis:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Choices:()=>null,Field:()=>null,Sheet:()=>null,ErrorNotice:()=>null}));
vi.mock('../src/modules/money/CategoryPicker',()=>({CategoryPicker:()=>null}));
vi.mock('../src/modules/money/TransactionHistory',()=>({TransactionHistory:()=>null}));
vi.mock('../src/modules/documents/ReceiptPhotoButtons',()=>({ReceiptPhotoButtons:()=>null}));
vi.mock('../src/modules/documents/ReadingDetailsForm',()=>({ReadingDetailsForm:()=>null}));
vi.mock('../src/core/id',()=>({newId:()=> 'FICTICIO'}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(tree:unknown):Node[]{if(Array.isArray(tree))return tree.flatMap(nodes);if(!isValidElement(tree))return [];const node=tree as Node;return [node,...nodes(node.props.children)];}
function render(component:()=>unknown){hooks.cursor=0;return nodes(component());}
function field(tree:Node[],label:string){const node=tree.find(n=>n.props.label===label);expect(node,`field ${label}`).toBeTruthy();return node!;}
function change(node:Node,value:string){(node.props.onChange as (value:string)=>void)(value);}
const categories=[{id:'salary',name:'Salario',kind:'income' as const,archived:false},{id:'house',name:'Vivienda',kind:'expense' as const,archived:false}];
const data:DocumentsSnapshot={documents:[],movements:[],bills:[],categories};
const initial:ReviewDraft={source:'library',text:'',image:null,warning:'',structured:{document_type:'check',merchant:'Pagador FICTICIO',date:'2026-11-14',period_start:null,period_end:null,currency:'USD',total_paid_cents:null,gross_cents:null,net_cents:49732,deductions:[],earnings:[],warnings:[],details:{...blankReadingDetails(),payment_method:'check'}}};
it('check review opens income-only menus and saves an income with its income category',async()=>{hooks.values=[];const save=vi.fn(async(_value:unknown)=>{});const props={initial,data,store:{save} as unknown as DocumentStore,saved:async()=>{},close:()=>{},openExisting:()=>{}};let tree=render(()=>ReviewForm(props));expect(field(tree,'Cómo guardar este ingreso').props.options).not.toEqual(expect.arrayContaining([expect.arrayContaining(['paid_expense'])]));const category=tree.find(n=>n.type===CategoryPicker)!;expect(category.props.kind).toBe('income');change(category,'salary');tree=render(()=>ReviewForm(props));(tree.find(n=>n.props.testID==='document-save')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0]?.[0]).toMatchObject({kind:'paid_income',categoryId:'salary',paymentMethod:'check',amountCents:49732});});
it('switching expense to income clears its category, credit method and expense-only dropdown choices',()=>{hooks.values=[];const props={initial,data,store:{} as DocumentStore,saved:async()=>{},close:()=>{},openExisting:()=>{}};let tree=render(()=>ReviewForm(props));change(field(tree,'Tipo de transacción'),'expense');tree=render(()=>ReviewForm(props));change(tree.find(n=>n.type===CategoryPicker)!,'house');change(field(tree,'Método de pago del gasto'),'credit');tree=render(()=>ReviewForm(props));expect(tree.find(n=>n.type===CategoryPicker)!.props.value).toBe('house');change(field(tree,'Tipo de transacción'),'income');tree=render(()=>ReviewForm(props));expect(tree.find(n=>n.type===CategoryPicker)!.props).toMatchObject({kind:'income',value:''});expect(field(tree,'Cómo recibiste el ingreso').props.value).toBe('');expect((field(tree,'Cómo guardar este ingreso').props.options as [string,string][]).map(([key])=>key)).not.toContain('pending_bill');expect(tree.some(n=>n.props.label==='Método de pago del gasto')).toBe(false);});
it('manual entry switches its category, payment menu and fields without leaking expense accounting choices',()=>{hooks.values=[];const props={kind:'expense' as const,categories,store:{} as MoneyStore,close:()=>{},saved:async()=>{}};let tree=render(()=>MovementForm(props));change(tree.find(n=>n.type===CategoryPicker)!,'house');(tree.find(n=>n.type===CategoryPicker)!.props.onCreated as (c:unknown)=>void)({id:'custom-expense',name:'Patio',kind:'expense',archived:false});tree=render(()=>MovementForm(props));change(field(tree,'Método de pago'),'credit');change(field(tree,'Tipo de transacción'),'income');tree=render(()=>MovementForm(props));expect(tree.find(n=>n.type===CategoryPicker)!.props).toMatchObject({kind:'income',value:''});expect((field(tree,'Cómo recibiste el ingreso').props.options as [string,string][]).map(([key])=>key)).not.toContain('credit');expect(tree.some(n=>n.props.testID==='movement-gross')).toBe(true);expect(tree.some(n=>n.props.testID==='movement-amount')).toBe(false);change(field(tree,'Tipo de transacción'),'expense');tree=render(()=>MovementForm(props));expect(tree.find(n=>n.type===CategoryPicker)!.props.kind).toBe('expense');expect(tree.find(n=>n.type===CategoryPicker)!.props.categories).toEqual(expect.arrayContaining([expect.objectContaining({id:'custom-expense',kind:'expense'})]));expect(tree.some(n=>n.props.testID==='movement-gross')).toBe(false);expect(tree.some(n=>n.props.testID==='movement-amount')).toBe(true);});
