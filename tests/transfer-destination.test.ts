import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {TransferEditor} from '../src/modules/funds/TransferEditor';
import {Choices,Field} from '../src/modules/money/fields';
import {ActionButton} from '../src/ui/components';
import type {FundsStore} from '../src/modules/funds/store';
import type {Fund} from '../src/modules/funds/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>{h.values[i]=typeof v==='function'?(v as (old:unknown)=>unknown)(h.values[i]):v;}];};return{...actual,useState:slot,useRef:(v:unknown)=>slot({current:v})[0]};});
vi.mock('../src/ui/MeaningHelp',()=>({MeaningHelp:()=>null}));
vi.mock('../src/modules/funds/FundSheet',()=>({FundSheet:()=>null,FundBody:()=>null,FundError:()=>null}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Choices:()=>null,Field:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
vi.mock('../src/core/id',()=>({newId:()=> 'FICTICIO'}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
const funds=['savings','emergency','budget'].map(kind=>({id:'fund:personal:'+kind,scope:'personal',name:kind,balanceCents:0} as Fund));
function setup(){h.values=[];const transfer=vi.fn(async()=>{}),saved=vi.fn(async()=>{}),close=vi.fn();const draw=()=>{h.cursor=0;return nodes(TransferEditor({store:{transfer} as unknown as FundsStore,scope:'personal',funds,availableCents:10000,to:funds[0].id,fromAvailableOnly:true,close,saved}));};return{transfer,saved,close,draw};}
it('ofrece todos los destinos y conserva el origen balance disponible',()=>{const s=setup(),tree=s.draw(),source=tree.find(n=>n.type===Choices&&n.props.label==='Origen')!,dest=tree.find(n=>n.type===Choices&&n.props.label==='Destino')!;expect(source.props.options).toEqual([['','Balance disponible · $100.00']]);expect((dest.props.options as [string,string][]).map(([id])=>id)).toEqual(funds.map(f=>f.id));expect(dest.props.value).toBe(funds[0].id);});
it('cambiar destino y confirmar guarda en el fondo elegido una sola vez',async()=>{const s=setup(),tree=s.draw();(tree.find(n=>n.type===Choices&&n.props.label==='Destino')!.props.onChange as (v:string)=>void)(funds[1].id);(tree.find(n=>n.type===Field&&n.props.label==='Cantidad (USD)')!.props.onChangeText as (v:string)=>void)('20.00');(tree.find(n=>n.type===Choices&&n.props.label==='Confirmación')!.props.onChange as (v:string)=>void)('yes');const action=s.draw().find(n=>n.type===ActionButton)!;(action.props.onPress as ()=>void)();await vi.waitFor(()=>expect(s.close).toHaveBeenCalledOnce());expect(s.transfer).toHaveBeenCalledOnce();expect(s.transfer).toHaveBeenCalledWith(expect.objectContaining({fromId:null,toId:funds[1].id,amountCents:2000}),undefined,undefined);expect(s.saved).toHaveBeenCalledWith(expect.objectContaining({toId:funds[1].id}));});
