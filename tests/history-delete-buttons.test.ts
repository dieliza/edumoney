import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {TransactionHistory} from '../src/modules/money/TransactionHistory';
import type {MoneyStore} from '../src/modules/money/store';
import type {Snapshot} from '../src/modules/money/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,effects:[] as (()=>unknown)[],used:new Set<number>(),data:null as unknown,remove:vi.fn(async()=>{}),saved:vi.fn(async()=>{})}));
vi.mock('react',async original=>{const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=typeof v==='function'?(v as (s:unknown)=>unknown)(h.values[i]):v];};return{...await original<typeof import('react')>(),useState:slot,useRef:(v:unknown)=>slot({current:v})[0],useCallback:(f:unknown)=>f,useEffect:(f:()=>unknown)=>{const i=h.cursor++;if(!h.used.has(i)){h.used.add(i);h.effects.push(f);}}};});
vi.mock('react-native',()=>({View:()=>null,Pressable:()=>null,ActivityIndicator:()=>null}));
vi.mock('@expo/vector-icons/Ionicons',()=>({default:()=>null}));
vi.mock('../src/ui/components',()=>({Body:()=>null}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({colors:{line:'#ccc',primary:'#070'}})}));
vi.mock('../src/modules/money/fields',()=>({ErrorNotice:()=>null}));
vi.mock('../src/modules/documents/VoiceDraftList',()=>({VoiceDraftList:()=>null}));
vi.mock('../src/modules/documents/localStore',()=>({getDocumentStore:vi.fn()}));
vi.mock('../src/modules/money/accountScope',()=>({useAccountScope:()=> 'personal'}));
vi.mock('../src/modules/money/accountScopeData',()=>({accountSnapshot:async()=>h.data,originalScopeMovement:(m:unknown)=>m}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
for(const kind of ['income','expense'] as const)it(`el historial de ${kind} muestra el mismo zafacón y elimina una sola vez`,async()=>{h.values=[];h.cursor=0;h.used.clear();h.effects=[];h.remove.mockClear();h.saved.mockClear();const movement={id:'m',kind,amountCents:1000,date:'2026-11-25',description:'FICTICIO',deletedAt:null,version:1};h.data={movements:[movement],categories:[]} as unknown as Snapshot;const draw=()=>{h.cursor=0;const t=nodes(TransactionHistory({kind,store:{deleteFromHistory:h.remove} as unknown as MoneyStore,onEdit:()=>{},saved:h.saved}));for(const f of h.effects.splice(0))f();return t;};draw();await vi.waitFor(()=>expect(draw().some(n=>n.props.testID==='history-delete-m')).toBe(true));const remove=draw().find(n=>n.props.testID==='history-delete-m')!;expect(remove.props.accessibilityLabel).toContain(kind==='income'?'Borrar ingreso':'Borrar gasto');(remove.props.onPress as ()=>void)();(remove.props.onPress as ()=>void)();await vi.waitFor(()=>expect(h.saved).toHaveBeenCalledOnce());expect(h.remove).toHaveBeenCalledExactlyOnceWith(movement);});
