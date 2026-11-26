import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import MonthlyBudgetCenter from '../src/modules/budget/MonthlyBudgetCenter.web';
import {BudgetCard,MiniButton} from '../src/modules/budget/BudgetControls.web';
import {CategoryEditor} from '../src/modules/budget/CategoryEditor.web';
import {AnnualExpenses} from '../src/modules/budget/AnnualExpenses.web';
import {TransferEditor} from '../src/modules/funds/TransferEditor';
import {FundSheet} from '../src/modules/funds/FundSheet';
import {asAvailableBalance,defaultPlan} from '../src/modules/budget/domain';
import type {BudgetContext} from '../src/modules/budget/types';
import type {BudgetStore} from '../src/modules/budget/store';
import type {Fund} from '../src/modules/funds/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>{h.values[i]=typeof v==='function'?(v as (old:unknown)=>unknown)(h.values[i]):v;}];};return{...actual,useState:slot,useEffect:()=>{},useRef:(v:unknown)=>slot({current:v})[0]};});
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:'dark',colors:{text:'#102F42',surface:'#FFFFFF',surfaceAlt:'#F3F7FA',line:'#CFDFE2',muted:'#455E6C',primary:'#006D50'}})}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('../src/modules/money/localStore',()=>({getMoneyStore:vi.fn()}));
vi.mock('../src/core/id',()=>({newId:()=> 'FICTICIO'}));
vi.mock('../src/modules/funds/FundTransfers',()=>({FundTransfers:()=>null}));
vi.mock('../src/modules/funds/TransferEditor',()=>({TransferEditor:()=>null}));
vi.mock('../src/modules/funds/FundSheet',()=>({FundSheet:()=>null}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
const goal={id:'goal:g',scope:'personal',kind:'savings',name:'Meta FICTICIA',goalId:'g',targetCents:10000,contributionCents:0,cadence:'monthly',targetDate:null,locationId:null,budgetMonth:null,categoryId:null,archived:false,version:0,createdAt:'',openingCents:0,legacyCents:0,balanceCents:0} satisfies Fund;
const context:BudgetContext={today:'2026-11-26',money:{movements:[],categories:[],budgets:[],schedules:[],commitments:[]},funds:{funds:[goal],transfers:[],locations:[],legacy:[],events:[],movements:[{id:'income',kind:'income',amountCents:100000,date:'2026-11-01',useKind:'personal',deletedAt:null} as BudgetContext['funds']['movements'][number]]},bills:{bills:[],series:[],payments:[],categories:[],movements:[]},debts:{debts:[],payments:[],events:[],plans:[],movements:[],bills:[]}};
const plan=asAvailableBalance(defaultPlan('2026-11','personal',context));
function setup(){h.values=['2026-11',{plan,context,version:0,saved:null},{ledger:{}} as BudgetStore,[],false,false,null,'planned',true,false,'','',null,'',null,null,{current:{plan,context,version:0,saved:null}},{current:true}];}
function draw(){h.cursor=0;return nodes(MonthlyBudgetCenter({scope:'personal'}));}
function press(t:Node[],text:string){const n=t.find(n=>n.type===MiniButton&&n.props.children===text);expect(n,text).toBeTruthy();expect(n!.props.disabled).not.toBe(true);(n!.props.onClick as ()=>void)();}
it('abre la transferencia de emergencia aunque el presupuesto sea un borrador sin guardar',()=>{setup();press(draw(),'Transferir al fondo de emergencia');const editor=draw().find(n=>n.type===TransferEditor);expect(editor?.props.to).toBe('fund:personal:emergency');expect(editor?.props.availableCents).toBe(100000);});
it('permite elegir una meta y abre el editor existente sin exigir guardar el presupuesto',()=>{setup();press(draw(),'Aportar a una meta');const t=draw();expect(t.some(n=>n.type===FundSheet&&n.props.title==='Aportar a una meta')).toBe(true);const choice=t.find(n=>n.type===MiniButton&&Array.isArray(n.props.children));expect(choice).toBeTruthy();(choice!.props.onClick as ()=>void)();expect(draw().find(n=>n.type===TransferEditor)?.props.to).toBe(goal.id);});
it('muestra balance como salida de solo lectura y no crea un campo editable de ingresos',()=>{setup();const t=draw(),output=t.find(n=>n.type==='output');expect(output?.props.children).toBe('$1,000.00');expect(output?.props.onChange).toBeUndefined();expect(t.some(n=>n.props.label==='Ingresos netos mensuales proyectados')).toBe(false);});
it('gastos anuales aparece una sola vez dentro de Distribuye tu dinero y los paneles usan columnas',()=>{setup();const t=draw(),card=t.find(n=>n.type===BudgetCard&&nodes(n).some(v=>v.type==='h3'&&v.props.children==='Distribuye tu dinero'));expect(card).toBeTruthy();expect(nodes(card).filter(n=>n.type===AnnualExpenses)).toHaveLength(1);expect(t.filter(n=>n.type===AnnualExpenses)).toHaveLength(1);expect(t.some(n=>n.props.className==='edu-budget-columns')).toBe(true);expect(t.filter(n=>n.props.className==='edu-budget-column')).toHaveLength(2);});
it('el editor oscuro tiene etiquetas claras y campos con tinta oscura legible',()=>{h.values=[];h.cursor=0;const t=nodes(CategoryEditor({row:plan.rows[0],plan,context,save:()=>{},remove:()=>{},close:()=>{}}));const body=t.find(n=>n.props.className==='edu-budget-modal-content');expect(body?.props.style).toMatchObject({color:'#F6F9FA'});const input=t.find(n=>n.type==='input'&&n.props.value===plan.rows[0].name);expect(input?.props.style).toMatchObject({color:'#102F42',background:'#F8FAFB'});});
it('los enlaces del modal oscuro usan el azul claro de los formularios',()=>{const n=MiniButton({children:'Guardar categoría',sheet:true,onClick:()=>{}});expect(n.props.style['--edu-budget-link']).toBe('#A8CAFF');expect(n.props['data-edu-budget-link']).toBe('true');});
