import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {NotificationBell} from '../src/ui/NotificationBell';
const hooks=vi.hoisted(()=>({state:[] as unknown[],cursor:0,update:vi.fn()}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useEffect:()=>{},useCallback:(f:unknown)=>f,useRef:()=>({current:null}),useState:(value:unknown)=>{const i=hooks.cursor++;if(!(i in hooks.state))hooks.state[i]=value;return[hooks.state[i],(v:unknown)=>{hooks.state[i]=v;}];}};});
vi.mock('react-native',()=>({View:'View',Text:'Text',Pressable:'Pressable',Modal:'Modal',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator',AppState:{}}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('@expo/vector-icons/Ionicons',()=>({default:()=>null}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({colors:{}})}));
vi.mock('../src/ui/CloseButton',()=>({CloseButton:()=>null}));
vi.mock('../src/modules/notifications/service',()=>({loadInbox:vi.fn(),inboxPreferences:async()=>({update:hooks.update})}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(value:unknown):Node[]{if(Array.isArray(value))return value.flatMap(nodes);if(!isValidElement(value))return[];const n=value as Node;return[n,...nodes(n.props.children)];}
function render(){hooks.cursor=0;return nodes(NotificationBell({color:'#000'}));}
function text(tree:Node[],value:string){return tree.some(n=>n.props.children===value);}
it('no ofrece pausar o desactivar la bandeja ya aceptada',()=>{hooks.state=[];const tree=render();expect(text(tree,'Pausar bandeja')).toBe(false);expect(text(tree,'Activar bandeja')).toBe(false);expect(tree.some(n=>typeof n.props.children==='string'&&/Desactivar/.test(n.props.children))).toBe(false);});
it('conserva la aceptación inicial, activa una sola dirección y mantiene las marcas leídas',async()=>{hooks.state=[];render();hooks.state[2]={enabled:false,read:['read-1']};let tree=render();expect(text(tree,'Activar bandeja')).toBe(true);hooks.update.mockImplementation(async change=>change({enabled:false,read:['read-1']}));const target=tree.find(n=>n.type==='Pressable'&&nodes(n.props.children).some(child=>child.props.children==='Activar bandeja'));expect(target).toBeTruthy();(target!.props.onPress as ()=>void)();await vi.waitFor(()=>expect(hooks.state[2]).toEqual({enabled:true,read:['read-1']}));tree=render();expect(text(tree,'Activar bandeja')).toBe(false);expect(text(tree,'Pausar bandeja')).toBe(false);});
