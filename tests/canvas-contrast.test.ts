import {createElement,type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {Body,IconBadge,DashboardAction} from '../src/ui/components';
import {MonthlyCharts} from '../src/ui/MonthlyCharts';
import {ChartBars} from '../src/ui/ChartBars';
import {TransactionChart} from '../src/ui/TransactionChart';
import {cents} from '../src/core/money';
import {monthlySummary} from '../src/modules/money/domain';
const theme=vi.hoisted(()=>({name:'dark',colors:{text:'#102F42',muted:'#455E6C',primary:'#006D50',mint:'rgba(0,150,120,.2)',coral:'rgba(200,40,60,.2)',line:'#ccc',surfaceAlt:'#EDF8F7',progressTrack:'#23656B'}}));
function flatten(style:unknown):object{return Array.isArray(style)?Object.assign({},...style.map(flatten)):style&&typeof style==='object'?style:{};}
vi.mock('react-native',()=>({View:({children,style}:{children:ReactNode;style:unknown})=>createElement('div',{style:flatten(style)},children),Text:({children,style}:{children:ReactNode;style:unknown})=>createElement('span',{style:flatten(style)},children),Pressable:({children,style,accessibilityLabel}:{children:ReactNode;style:unknown;accessibilityLabel:string})=>createElement('button',{'aria-label':accessibilityLabel,style:typeof style==='function'?undefined:flatten(style)},children),ScrollView:({children}:{children:ReactNode})=>createElement('div',null,children),StyleSheet:{create:(s:unknown)=>s},Platform:{OS:'web'},Keyboard:{},KeyboardAvoidingView:()=>null,useWindowDimensions:()=>({width:390,fontScale:1})}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>theme}));
vi.mock('expo-router',()=>({router:{},useIsFocused:()=>false}));
vi.mock('react-native-safe-area-context',()=>({SafeAreaView:()=>null}));
vi.mock('expo-linear-gradient',()=>({LinearGradient:({children}:{children:ReactNode})=>createElement('div',null,children)}));
vi.mock('expo-status-bar',()=>({StatusBar:()=>null}));
vi.mock('@expo/vector-icons/Ionicons',()=>({default:({color,name}:{color:string;name:string})=>createElement('i',{'data-color':color,'data-icon':name})}));
vi.mock('react-native-svg',()=>({default:({children}:{children:ReactNode})=>createElement('svg',null,children),Circle:()=>null,Path:()=>null}));
vi.mock('../src/ui/HeaderActions',()=>({HeaderActions:()=>null}));
vi.mock('../src/ui/Brand',()=>({Brand:()=>null}));
vi.mock('../src/ui/CloseButton',()=>({CloseButton:()=>null}));
vi.mock('../src/ui/ChartSurface',()=>({ChartSurface:()=>null}));
vi.mock('../src/ui/RecordSurface',()=>({RecordSurface:()=>null}));
const summary={...monthlySummary({movements:[],categories:[],budgets:[],schedules:[],commitments:[]},'2026-11'),income:cents(5000),expenses:cents(1386)};
it('los textos sobre el fondo nativo son claros, con un tono secundario legible',()=>{expect(renderToStaticMarkup(createElement(Body,{canvas:true},'Título'))).toContain('color:#F4FFFC');expect(renderToStaticMarkup(createElement(Body,{canvas:true,muted:true},'Nota'))).toContain('color:#D7F2EE');expect(renderToStaticMarkup(createElement(Body,null,'En tarjeta'))).toContain('color:#102F42');});
it('se conserva el texto oscuro explícito sobre el recuadro menta existente',()=>{const html=renderToStaticMarkup(createElement(Body,{canvas:true,style:{color:'#123B32'}},'Diferencia'));expect(html).toContain('color:#123B32');expect(html).not.toContain('color:#F4FFFC');});
it('Home muestra títulos, cifras centrales y leyendas claros sin añadir fondos blancos',()=>{const html=renderToStaticMarkup(createElement(MonthlyCharts,{summary,movements:[],month:'2026-11',compact:true,initialIndividual:false,canvas:true}));for(const value of ['Ingresos y gastos','Transacciones','$50.00','$13.86'])expect(html).toContain(value);expect(html).toMatch(/color:#F4FFFC[^>]*>Ingresos y gastos/);expect(html).toMatch(/color:#F4FFFC[^>]*>\$50.00/);expect(html).toContain('color:#123B32');expect(html).not.toContain('background-color:white');expect(html).not.toContain('background-color:#fff');expect(html).toContain('Cambiar formato');});
it('las barras horizontales y verticales conservan importes y usan texto claro',()=>{for(const vertical of [false,true]){const html=renderToStaticMarkup(createElement(ChartBars,{rows:[{id:'x',label:'Ingreso',amount:20000,color:'#38E795'}],vertical,canvas:true}));expect(html).toContain('$200.00');expect(html).toMatch(/color:#F4FFFC[^>]*>\$200.00/);expect(html).toContain('color:#F4FFFC');}});
it('los iconos de negocio admiten colores claros sin cambiar sus fondos o valores predeterminados',()=>{const current=renderToStaticMarkup(createElement(IconBadge,{icon:'briefcase',iconColor:'#D6FFF1'})),previous=renderToStaticMarkup(createElement(IconBadge,{icon:'briefcase'}));expect(current).toContain('data-color="#D6FFF1"');expect(current).toContain('background-color:rgba(0,150,120,.2)');expect(previous).toContain('data-color="#006B50"');const action=renderToStaticMarkup(createElement(DashboardAction,{title:'Nómina',icon:'people',tone:'coral',canvas:true,iconColor:'#FFD5E4',onPress(){}}));expect(action).toContain('data-color="#FFD5E4"');expect(action).toMatch(/color:#F4FFFC[^>]*>Nómina/);});
it('las transacciones individuales mantienen leyendas e iconos claros al cambiar de vista',()=>{const html=renderToStaticMarkup(createElement(TransactionChart,{rows:[],compact:true,canvas:true}));expect(html).toContain('data-color="#B7FFE8"');expect(html).toContain('color:#B7FFE8');expect(html).toContain('color:#FFE8F0');});
function luminance(hex:string){const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;}
function ratio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
it('la paleta de texto cumple contraste 4.5:1 y los iconos 3:1 en los tonos más claros del fondo',()=>{for(const bg of ['#042B3B','#064555','#087478']){for(const fg of ['#F4FFFC','#D7F2EE','#B7FFE8','#FFE8F0'])expect(ratio(fg,bg)).toBeGreaterThanOrEqual(4.5);for(const fg of ['#D6FFF1','#B7FFE8','#FFD5E4'])expect(ratio(fg,bg)).toBeGreaterThanOrEqual(3);}expect(ratio('#123B32','#DBF4E5')).toBeGreaterThanOrEqual(4.5);});
