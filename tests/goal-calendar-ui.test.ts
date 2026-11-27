import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {GoalCalendar} from '../src/modules/goals/GoalCalendar';
import {GoalForm} from '../src/modules/goals/GoalForm';
import type {Goal} from '../src/modules/goals/types';
import type {GoalStore} from '../src/modules/goals/store';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,deps:new Map<number,unknown[]>(),effects:[] as (()=>unknown)[],listener:null as null|(()=>void),goals:[] as Goal[],push:vi.fn(),activate:vi.fn(async()=>({enabled:true,message:'FICTICIO'}))}));
vi.mock('react',async original=>{const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=typeof v==='function'?(v as (old:unknown)=>unknown)(h.values[i]):v];};return{...await original<typeof import('react')>(),useState:slot,useRef:(v:unknown)=>({current:v}),useEffect:(f:()=>unknown,d:unknown[])=>{const i=h.cursor++,old=h.deps.get(i);if(!old||old.length!==d.length||d.some((v,j)=>!Object.is(v,old[j]))){h.deps.set(i,d);h.effects.push(f);}}};});
vi.mock('expo-router',()=>({router:{push:h.push}}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null,Body:()=>null,Card:()=>null,SectionHeading:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Field:()=>null,Choices:()=>null,Sheet:()=>null,ErrorNotice:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
vi.mock('../src/core/id',()=>({newId:()=> 'FICTICIO'}));
vi.mock('../src/modules/goals/reminders',()=>({requestGoalReminders:h.activate}));
vi.mock('../src/modules/goals/localStore',()=>({getGoalStore:async()=>({snapshot:async()=>({goals:structuredClone(h.goals)})})}));
vi.mock('../src/storage/changeEvents',()=>({onDataCommitted:(f:()=>void)=>{h.listener=f;return()=>{};}}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function reset(){h.values=[];h.cursor=0;h.deps.clear();h.effects=[];h.listener=null;}
function draw(render:()=>unknown){h.cursor=0;const tree=nodes(render());for(const effect of h.effects.splice(0))effect();return tree;}
it('el calendario muestra la meta, abre su ficha y se actualiza al aportar o eliminar',async()=>{reset();h.goals=[{id:'g',name:'FICTICIA',kind:'savings',targetCents:520000,openingCents:0,savedCents:0,trackStartDate:'2026-11-27',desiredDate:'2027-11-27',cadence:'weekly',archived:false,version:1}];const render=()=>GoalCalendar({month:'2026-12'});draw(render);await vi.waitFor(()=>expect(draw(render).some(n=>String(n.props.children).includes('FICTICIA'))).toBe(true));(draw(render).find(n=>n.props.title==='Ver meta')!.props.onPress as ()=>void)();expect(h.push).toHaveBeenCalledWith({pathname:'/goals',params:{goalId:'g'}});h.goals[0].savedCents=10000;h.listener!();await vi.waitFor(()=>expect(draw(render).some(n=>String(n.props.children).includes('Cubierta'))).toBe(true));expect(draw(()=>GoalCalendar({upcoming:true})).filter(n=>n.props.title==='Ver meta')).toHaveLength(1);h.goals=[];h.listener!();await vi.waitFor(()=>expect(draw(render).some(n=>n.props.children==='No hay aportaciones programadas para este período.')).toBe(true));});
it('guardar conserva frecuencia y fecha; la activación de avisos es una opción explícita',async()=>{reset();h.activate.mockClear();const create=vi.fn(async()=>{}),saved=vi.fn(async()=>{});const render=()=>GoalForm({store:{createWithInitial:create,availableBalance:async()=>100000} as unknown as GoalStore,saved,close:()=>{}});let tree=draw(render);for(const [id,value]of [['goal-name','FICTICIA'],['goal-target','1000.00'],['goal-date','2027-11-27']])(tree.find(n=>n.props.testID===id)!.props.onChangeText as (v:string)=>void)(value);(tree.find(n=>n.props.label==='Frecuencia de aportación sugerida')!.props.onChange as (v:string)=>void)('weekly');tree=draw(render);(tree.find(n=>n.props.testID==='goal-save')!.props.onPress as ()=>void)();expect(h.activate).not.toHaveBeenCalled();await vi.waitFor(()=>expect(saved).toHaveBeenCalledOnce());expect(create).toHaveBeenCalledWith(expect.objectContaining({targetCents:100000,openingCents:0,cadence:'weekly',desiredDate:'2027-11-27'}),0);});
