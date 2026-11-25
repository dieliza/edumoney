import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {ProfileName} from '../src/modules/profile/ProfileName';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,fail:false,write:vi.fn(),announce:vi.fn()}));
vi.mock('react',async original=>{const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=v];};return{...await original<typeof import('react')>(),useState:slot,useRef:(v:unknown)=>slot({current:v})[0],useEffect:()=>{}};});
vi.mock('react-native',()=>({AppState:{addEventListener:()=>({remove(){}})}}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null,Body:()=>null,Card:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Field:()=>null,ErrorNotice:()=>null}));
vi.mock('../src/ui/saveFeedback',()=>({announceSaved:()=>h.announce()}));
vi.mock('../src/storage/changeEvents',()=>({onDataCommitted:()=>()=>{}}));
vi.mock('../src/modules/money/localStore',()=>({getMoneyStore:async()=>({transaction:async(f:(db:unknown)=>unknown)=>f({runAsync:async(...p:unknown[])=>{h.write(...p);if(h.fail)throw Error('No se guardó');}})})}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function draw(){h.cursor=0;return nodes(ProfileName());}function reset(){h.values=[];h.cursor=0;h.fail=false;h.write.mockClear();h.announce.mockClear();}
it('Guardar nombre confirma Guardado exitosamente solo después de persistir y conserva el primer nombre',async()=>{reset();let t=draw();(t.find(n=>n.props.label==='Primer nombre')!.props.onChangeText as (s:string)=>void)('Diego Santos');t=draw();const save=t.find(n=>n.props.title==='Guardar nombre')!.props.onPress as ()=>void;save();save();await vi.waitFor(()=>expect(draw().some(n=>n.props.title==='Guardado exitosamente')).toBe(true));expect(h.write).toHaveBeenCalledOnce();expect(h.write.mock.calls[0][1]).toBe('Diego');expect(h.announce).toHaveBeenCalledOnce();(draw().find(n=>n.props.label==='Primer nombre')!.props.onChangeText as (s:string)=>void)('Otro');expect(draw().some(n=>n.props.title==='Guardar nombre')).toBe(true);});
it('un error de persistencia no anuncia éxito',async()=>{reset();h.fail=true;let t=draw();(t.find(n=>n.props.label==='Primer nombre')!.props.onChangeText as (s:string)=>void)('Diego');t=draw();(t.find(n=>n.props.title==='Guardar nombre')!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(draw().some(n=>String(n.props.message).includes('almacenamiento protegido'))).toBe(true));expect(h.announce).not.toHaveBeenCalled();expect(draw().some(n=>n.props.title==='Guardado exitosamente')).toBe(false);});
