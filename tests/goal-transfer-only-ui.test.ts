import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {GoalForm} from '../src/modules/goals/GoalForm';
import type {GoalStore} from '../src/modules/goals/store';
import type {Goal} from '../src/modules/goals/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,create:vi.fn(async()=>{}),edit:vi.fn(async()=>{}),saved:vi.fn(async()=>{}),close:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=v];}}));
vi.mock('../src/core/id',()=>({newId:()=> 'g-new'}));
vi.mock('../src/ui/saveFeedback',()=>({announceSaved:()=>{}}));
vi.mock('../src/ui/components',()=>({Body:()=>null,ActionButton:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Choices:()=>null,Field:()=>null,Sheet:()=>null,ErrorNotice:()=>null}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function draw(initial?:Goal){h.cursor=0;return nodes(GoalForm({initial,store:{create:h.create,edit:h.edit} as unknown as GoalStore,saved:h.saved,close:h.close}));}
function reset(){h.values=[];h.cursor=0;h.create.mockClear();h.edit.mockClear();h.saved.mockClear();h.close.mockClear();}
it('una meta nueva solo define un objetivo y nunca incorpora ahorro inicial',async()=>{reset();let t=draw();expect(t.some(n=>n.props.testID==='goal-opening')).toBe(false);(t.find(n=>n.props.testID==='goal-name')!.props.onChangeText as (s:string)=>void)('Viaje');(t.find(n=>n.props.testID==='goal-target')!.props.onChangeText as (s:string)=>void)('100.00');t=draw();(t.find(n=>n.props.testID==='goal-save')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(h.saved).toHaveBeenCalledOnce());expect(h.create).toHaveBeenCalledWith(expect.objectContaining({name:'Viaje',targetCents:10000,openingCents:0}));});
it('editar el objetivo conserva el dinero y su clasificación anteriores',async()=>{reset();const initial={id:'g',name:'Previo',kind:'emergency',targetCents:20000,openingCents:5000,desiredDate:null,cadence:'monthly',version:3,archived:false,savedCents:5000} as Goal;let t=draw(initial);expect(t.some(n=>n.props.testID==='goal-opening'||n.props.label==='Tipo de meta')).toBe(false);(t.find(n=>n.props.testID==='goal-name')!.props.onChangeText as (s:string)=>void)('Objetivo corregido');t=draw(initial);(t.find(n=>n.props.testID==='goal-save')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(h.saved).toHaveBeenCalledOnce());expect(h.edit).toHaveBeenCalledWith(expect.objectContaining({openingCents:5000,kind:'emergency',name:'Objetivo corregido'}),3,'',false);});
