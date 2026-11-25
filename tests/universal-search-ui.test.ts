import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {UniversalSearchButton} from '../src/modules/search/UniversalSearch';
import {MeaningHelp} from '../src/ui/MeaningHelp';
import {getAccountScope,setAccountScope} from '../src/modules/money/accountScope';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,effects:[] as (()=>unknown)[],theme:'dark',path:'/decisions',push:vi.fn(),close:vi.fn()}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [h.values[i],(v:unknown)=>{h.values[i]=typeof v==='function'?(v as (old:unknown)=>unknown)(h.values[i]):v;}];};return {...actual,useState:slot,useMemo:(f:()=>unknown)=>f(),useSyncExternalStore:(_s:unknown,get:()=>unknown)=>get(),useEffect:(f:()=>unknown,deps:unknown[])=>{const i=h.cursor++,old=h.values[i] as unknown[]|undefined;if(!old||deps.some((d,j)=>d!==old[j])){h.values[i]=deps;h.effects.push(f);}}};});
vi.mock('react-native',()=>({View:()=>null,Pressable:()=>null,Text:()=>null,TextInput:()=>null,Modal:()=>null,ScrollView:()=>null,ActivityIndicator:()=>null,KeyboardAvoidingView:()=>null,Keyboard:{dismiss:vi.fn()},Platform:{OS:'web'}}));
vi.mock('react-native-safe-area-context',()=>({SafeAreaView:()=>null}));
vi.mock('@expo/vector-icons/Ionicons',()=>({default:()=>null}));
vi.mock('expo-router',()=>({router:{push:h.push},usePathname:()=>h.path}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:h.theme})}));
vi.mock('../src/ui/useSheetViewport',()=>({useSheetViewport:()=>({top:0,height:480})}));
vi.mock('../src/modules/money/localStore',()=>({getMoneyStore:async()=>({})}));
vi.mock('../src/modules/search/load',()=>({loadSearchItems:async()=>[{id:'m',title:'Reparación del balcón',section:'Transacciones',detail:'Gasto · Comercial · $40.25',words:'reparacion balcon',account:'business',target:{path:'/charts',params:{month:'2026-11'}},edit:{path:'/money',params:{movementId:'m'}}}]}));
type N=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):N[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return [];const n=x as N;return [n,...nodes(n.props.children)];}
function draw(f:()=>unknown){h.cursor=0;const result=nodes(f());const effects=h.effects.splice(0);for(const e of effects)e();return result;}
function reset(){h.values=[];h.cursor=0;h.effects=[];h.push.mockClear();h.close.mockClear();}
it('la lupa abre una ventana, busca y ofrece editar el registro en su cuenta',async()=>{reset();setAccountScope('personal');
 let t=draw(()=>UniversalSearchButton({color:'#fff'}));(t.find(n=>n.props.testID==='universal-search-open')!.props.onPress as ()=>void)();t=draw(()=>UniversalSearchButton({color:'#fff'}));
 const component=t.find(n=>typeof n.type==='function'&&n.type.name==='SearchWindow')!.type as (p:{close():void})=>unknown;reset();const render=()=>draw(()=>component({close:h.close}));
 t=render();await Promise.resolve();await Promise.resolve();t=render();(t.find(n=>n.props.testID==='universal-search-query')!.props.onChangeText as (s:string)=>void)('balcón');render();
 await vi.waitFor(()=>{const t=render();expect(t.some(n=>n.props.accessibilityLabel==='Reparación del balcón. Gasto · Comercial · $40.25')).toBe(true);});
 t=render();(t.find(n=>n.props.accessibilityLabel==='Reparación del balcón. Gasto · Comercial · $40.25')!.props.onPress as ()=>void)();t=render();(t.find(n=>n.props.testID==='search-edit-result')!.props.onPress as ()=>void)();
 expect(getAccountScope()).toBe('business');expect(h.push).toHaveBeenCalledWith({pathname:'/money',params:{movementId:'m'}});expect(h.close).toHaveBeenCalledOnce();
});
it('la explicación se abre con contraste en ambos temas sin cambiar valores financieros',()=>{for(const theme of ['dark','light']){reset();h.theme=theme;h.path='/decisions';const render=()=>draw(()=>MeaningHelp({label:'Tasa nominal anual fija (%)'}));let t=render();(t.find(n=>n.props.accessibilityRole==='button')!.props.onPress as ()=>void)();t=render();const text=t.find(n=>n.props.accessibilityLiveRegion==='polite')!;expect(text.props.children).toContain('Para 12 %, escribe 12');expect((text.props.style as {color:string}).color).toBe(theme==='dark'?'#F6F9FA':'#102F42');}});
it('la ayuda nueva no se añade a Negocio',()=>{reset();h.path='/business-payroll';expect(draw(()=>MeaningHelp({label:'Tasa nominal anual fija (%)'}))).toHaveLength(0);});
