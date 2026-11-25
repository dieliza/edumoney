import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import ProgressScreen from '../src/modules/progress/ProgressScreen';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0,effects:[] as (()=>unknown)[],used:new Set<number>(),listener:null as null|(()=>void),data:{movements:[],budgets:[],goals:[{id:'g',name:'Viaje',targetCents:10000,savedCents:2500,desiredDate:'2027-01-31',archived:false}],bills:[],debtPayments:[],plans:[]}}));
vi.mock('react',async original=>{const slot=(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=v];};return{...await original<typeof import('react')>(),useState:slot,useMemo:(f:()=>unknown)=>f(),useCallback:(f:unknown)=>f,useEffect:(f:()=>unknown)=>{const i=h.cursor++;if(!h.used.has(i)){h.used.add(i);h.effects.push(f);}}};});
vi.mock('react-native',()=>({ActivityIndicator:()=>null,AppState:{addEventListener:()=>({remove(){}})}}));
vi.mock('expo-router',()=>({useIsFocused:()=>true}));
vi.mock('../src/core/id',()=>({newId:()=> 'new'}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({colors:{mint:'#ddd'}})}));
vi.mock('../src/ui/components',()=>({ActionButton:()=>null,Body:()=>null,Card:()=>null,ProgressBar:()=>null,Screen:()=>null,SectionHeading:()=>null}));
vi.mock('../src/modules/money/fields',()=>({Field:()=>null,ErrorNotice:()=>null}));
vi.mock('../src/modules/education/EducationPanel',()=>({EducationPanel:()=>null}));
vi.mock('../src/modules/progress/localStore',()=>({getProgressStore:async()=>({snapshot:async()=>h.data})}));
vi.mock('../src/storage/changeEvents',()=>({onDataCommitted:(f:()=>void)=>{h.listener=f;return()=>{};}}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
function draw(){h.cursor=0;const t=nodes(ProgressScreen());for(const f of h.effects.splice(0))f();return t;}
it('Mi progreso muestra el avance real y la fecha final y se actualiza al guardar una aportación',async()=>{draw();await vi.waitFor(()=>expect(draw().some(n=>n.props.label==='Progreso de Viaje: 25%'&&n.props.value===25)).toBe(true));expect(draw().some(n=>Array.isArray(n.props.children)&&n.props.children.includes('2027-01-31'))).toBe(true);h.data={...h.data,goals:[{...h.data.goals[0],savedCents:6000}]};h.listener!();await vi.waitFor(()=>expect(draw().some(n=>n.props.label==='Progreso de Viaje: 60%'&&n.props.value===60)).toBe(true));});
