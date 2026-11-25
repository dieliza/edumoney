import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {FundTransfers} from '../src/modules/funds/FundTransfers';
import type {FundData} from '../src/modules/funds/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,data:null as unknown,reload:vi.fn(async()=>{}),reverse:vi.fn(async()=>{})}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>{h.values[i]=typeof v==='function'?(v as (x:unknown)=>unknown)(h.values[i]):v;}];},useRef:(initial:unknown)=>{const i=h.cursor++;return h.values[i]??(h.values[i]={current:initial});},useMemo:(f:()=>unknown)=>f(),useEffect:()=>{}}));
vi.mock('react-native',()=>({View:()=>null,ActivityIndicator:()=>null}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null,Body:()=>null,Card:()=>null,SectionHeading:()=>null}));
vi.mock('../src/ui/MeaningHelp',()=>({MeaningHelp:()=>null}));
vi.mock('../src/modules/money/fields',()=>({ErrorNotice:()=>null}));
vi.mock('../src/modules/funds/TransferEditor',()=>({TransferEditor:()=>null}));
vi.mock('../src/modules/funds/useFunds',()=>({useFunds:()=>({store:{reverse:h.reverse},data:h.data,error:'',reload:h.reload})}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function start(){h.values=[];h.cursor=0;h.reverse.mockClear();h.reload.mockClear();h.data={funds:[{id:'s',scope:'personal',kind:'savings',name:'Ahorros',openingCents:0}],legacy:[],movements:[],locations:[],events:[],transfers:[{id:'t',scope:'personal',fromId:null,toId:'s',amountCents:10000,date:'2026-11-25',description:'Prueba',sequence:1,version:1,reversedAt:null}]} as unknown as FundData;}
function draw(){h.cursor=0;return nodes(FundTransfers({scope:'personal',kind:'savings',allowTransfer:true}));}
it('abre Editar historiales y permite corregir la transferencia original sin crear fondos',()=>{start();let t=draw();expect(t.some(n=>n.props.title==='Crear fondo')).toBe(false);expect(t.some(n=>n.props.testID==='funds-new-transfer')).toBe(true);expect(t.some(n=>n.props.testID==='fund-transfer-edit-t')).toBe(false);(t.find(n=>n.props.testID==='fund-history-edit')!.props.onPress as ()=>void)();t=draw();(t.find(n=>n.props.testID==='fund-transfer-edit-t')!.props.onPress as ()=>void)();t=draw();expect(t.find(n=>n.props.initial)?.props.initial).toMatchObject({id:'t',amountCents:10000,date:'2026-11-25'});expect(h.reverse).not.toHaveBeenCalled();});
it('elimina desde el historial con versión y evita duplicar dos pulsaciones',async()=>{start();(draw().find(n=>n.props.testID==='fund-history-edit')!.props.onPress as ()=>void)();const remove=draw().find(n=>n.props.testID==='fund-transfer-delete-t')!.props.onPress as ()=>void;remove();remove();await vi.waitFor(()=>expect(h.reload).toHaveBeenCalledOnce());expect(h.reverse).toHaveBeenCalledExactlyOnceWith('t',1,'Eliminada desde Editar historiales');});
