import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {FundEditor} from '../src/modules/funds/FundEditor';
import type {FundsStore} from '../src/modules/funds/store';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,create:vi.fn(async()=>{}),saved:vi.fn(async()=>{})}));
vi.mock('react',async original=>{const slot=(v:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof v==='function'?(v as ()=>unknown)():v;return[h.values[i],(x:unknown)=>h.values[i]=x];};return{...await original<typeof import('react')>(),useState:slot,useRef:(v:unknown)=>slot({current:v})[0]};});
vi.mock('../src/core/id',()=>({newId:()=> 'g'}));
vi.mock('../src/modules/funds/FundSheet',()=>({FundSheet:()=>null,FundBody:()=>null,FundError:()=>null}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Field:()=>null,Choices:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function draw(){h.cursor=0;return nodes(FundEditor({store:{createPlan:h.create} as unknown as FundsStore,scope:'personal',kind:'savings',locations:[],plan:{target:10000,contribution:1000},close:()=>{},saved:h.saved}));}
it('convertir el simulador exige seleccionar una fecha final y la conserva como objetivo',async()=>{let t=draw();expect(t.find(n=>n.props.label==='Fecha final para alcanzar la meta')!.props.required).toBe(true);(t.find(n=>n.props.testID==='fund-save')!.props.onPress as ()=>void)();await Promise.resolve();expect(h.create).not.toHaveBeenCalled();t=draw();expect(t.some(n=>String(n.props.message).includes('fecha final'))).toBe(true);(t.find(n=>n.props.testID==='fund-name')!.props.onChangeText as (s:string)=>void)('Viaje');(t.find(n=>n.props.label==='Fecha final para alcanzar la meta')!.props.onChangeText as (s:string)=>void)('2027-01-31');t=draw();(t.find(n=>n.props.testID==='fund-save')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(h.saved).toHaveBeenCalledOnce());expect(h.create).toHaveBeenCalledWith(expect.objectContaining({name:'Viaje',targetDate:'2027-01-31',targetCents:10000}));});
