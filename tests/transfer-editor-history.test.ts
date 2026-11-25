import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {TransferEditor} from '../src/modules/funds/TransferEditor';
import type {FundsStore} from '../src/modules/funds/store';
import type {FundTransfer} from '../src/modules/funds/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,transfer:vi.fn(async()=>{}),editReversed:vi.fn(async()=>{}),saved:vi.fn(async()=>{}),close:vi.fn()}));
vi.mock('react',async original=>{const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=v];};return{...await original<typeof import('react')>(),useState:slot,useRef:(v:unknown)=>slot({current:v})[0]};});
vi.mock('../src/core/id',()=>({newId:()=> 'new'}));
vi.mock('../src/ui/MeaningHelp',()=>({MeaningHelp:()=>null}));
vi.mock('../src/modules/funds/FundSheet',()=>({FundSheet:()=>null,FundBody:()=>null,FundError:()=>null}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Field:()=>null,Choices:()=>null}));
vi.mock('../src/ui/DateField',()=>({DateField:()=>null}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
for(const deleted of [false,true])it(`guardar corrección ${deleted?'eliminada':'vigente'} usa la operación correcta y conserva su identidad`,async()=>{h.values=[];h.cursor=0;h.transfer.mockClear();h.editReversed.mockClear();h.saved.mockClear();const initial={id:'t',scope:'personal',fromId:null,toId:'s',amountCents:10000,date:'2026-11-25',description:'Anterior',version:2,reversedAt:deleted?'2026-11-25':null} as FundTransfer;const draw=()=>{h.cursor=0;return nodes(TransferEditor({initial,scope:'personal',funds:[],availableCents:12500,store:{transfer:h.transfer,editReversed:h.editReversed} as unknown as FundsStore,close:h.close,saved:h.saved}));};let t=draw();expect(t.some(n=>n.props.label==='Confirmación')).toBe(false);if(!deleted){expect((t.find(n=>n.props.label==='Origen')!.props.options as [string,string][])[0]).toEqual(['','Balance disponible · $125.00']);expect((t.find(n=>n.props.label==='Destino')!.props.options as [string,string][])[0]).toEqual(['','Balance disponible · $125.00']);}if(deleted)expect(t.some(n=>n.props.label==='Origen'||n.props.label==='Destino')).toBe(false);(t.find(n=>n.props.testID==='transfer-amount')!.props.onChangeText as (v:string)=>void)('50.00');t=draw();(t.find(n=>n.props.testID==='fund-transfer-save')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(h.saved).toHaveBeenCalledOnce());expect(deleted?h.editReversed:h.transfer).toHaveBeenCalledWith(expect.objectContaining({id:'t',amountCents:5000,fromId:null,toId:'s'}),2);expect(deleted?h.transfer:h.editReversed).not.toHaveBeenCalled();});
