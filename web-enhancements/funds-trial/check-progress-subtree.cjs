// Exact hosted Progress/Education/UI functions, with only device/navigation/storage boundaries replaced.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),graph=require('./host-graph.cjs');
const g=graph(process.argv[2]);
const palette={text:'#102F42',muted:'#526675',line:'#CCD7DD',surface:'#fff',primary:'#00664B',mint:'#DDF3E9',progressTrack:'#ddd',gradient:['#003542','#087F7D']};
let data={movements:[],budgets:[],goals:[],bills:[],debtPayments:[],plans:[]},theme='light';
const coldAssets=new Set([...g.entryAssets,g.defs.get(856).asset,...[...g.active].filter(a=>/\/_layout-/.test(a))]);
const coldModules=new Set([...coldAssets].flatMap(a=>g.byAsset.get(a)));
function registry(){
 const modules=new Map(),context=vm.createContext({console,setTimeout,clearTimeout,Map,Set,Symbol,Promise,Reflect,JSON,Date,Proxy,Object,Error,Buffer,BigInt});
 let seededStore=false;
 const actualReact={...React,useState:initial=>{if(initial===null&&!seededStore){seededStore=true;return[{snapshot:async()=>data},()=>{}];}if(initial&&initial.movements)return[data,()=>{}];if(initial&&initial.progress)return[{progress:[],awards:[],learned:0,animations:true},()=>{}];return React.useState(initial);}};
 modules.set(13,{__esModule:true,...actualReact,default:actualReact});modules.set(7,require('react/jsx-runtime'));
 const native=tag=>function({children,...p}){return React.createElement(tag,{'data-role':p.accessibilityRole,'aria-label':p.accessibilityLabel},children);};
 for(const id of [110,189,246,229,239,134,256,238,179])modules.set(id,{__esModule:true,default:native('div')});
 modules.set(29,{__esModule:true,default:{create:v=>v}});modules.set(270,{__esModule:true,default:()=>({width:390})});modules.set(219,{__esModule:true,default:{dismiss(){}}});modules.set(105,{__esModule:true,default:{OS:'web'}});modules.set(101,{__esModule:true,default:{isReduceMotionEnabled:async()=>false,addEventListener:()=>({remove(){}})}});modules.set(103,{__esModule:true,default:{}});modules.set(222,{__esModule:true,default:{openURL:async()=>{}}});modules.set(214,{__esModule:true,default:{addEventListener:()=>({remove(){}})}});
 modules.set(790,{useIsFocused:()=>true,router:{canGoBack:()=>true},usePathname:()=>'/progress'});
 const surface=({children})=>React.createElement(React.Fragment,null,children);
 modules.set(792,{useTheme:()=>({name:theme,colors:palette}),NativeSurfaceTheme:surface,NativeChartTheme:surface});
 modules.set(272,{SafeAreaView:native('div')});modules.set(836,{LinearGradient:native('div')});modules.set(552,{StatusBar:()=>null});modules.set(791,{__esModule:true,default:native('span')});modules.set(937,{__esModule:true,default:native('svg'),Path:native('path')});modules.set(1108,{HeaderActions:()=>null});modules.set(881,{Brand:()=>null});modules.set(1114,{CloseButton:()=>null});
 modules.set(797,{Field:({label})=>React.createElement('label',null,label),ErrorNotice:({message})=>message?React.createElement('p',null,message):null});
 modules.set(20014,{SectionMeaning:()=>null});modules.set(858,{getProgressStore:async()=>({snapshot:async()=>data})});modules.set(1136,{getEducationStore:async()=>({})});modules.set(871,{onDataCommitted:()=>()=>{}});
 const req=id=>{if(modules.has(id))return modules.get(id);assert(coldModules.has(id),'Unavailable cold-route module '+id);const d=g.defs.get(id);assert(d,'Unavailable actual module '+id);const m={exports:{}};modules.set(id,m.exports);vm.runInContext('('+d.factory+')',context)(context,req,i=>{const v=req(i);return v.__esModule?v.default:v;},req,m,m.exports,d.deps);modules.set(id,m.exports);return m.exports;};
 return req;
}
if(process.argv.includes('--expect-broken')){assert.throws(()=>registry()(856),/Unavailable cold-route module 808/);console.log('PASS: reproduced the actual unloaded808 exception before Progress renders, with no prior visit to Goals');process.exit(0);}
for(const mode of ['light','dark']){
 theme=mode;const req=registry(),html=renderToStaticMarkup(React.createElement(req(856).default));
 assert(html.includes('Mi progreso'));assert(html.includes('Mis logros'));assert(html.includes('Primer paso'));assert(!html.includes('Mi plan de90días'));assert(!/90 d[ií]as|Iniciar mi plan/.test(html));
 console.log('PASS: real Progress, Education awards and UI subtree render in '+mode+' with no90dayplan');
}
data={...data,goals:[{id:'g',name:'Viaje',savedCents:2500,targetCents:10000,desiredDate:'2027-01-31',archived:false}],plans:[{id:'legacy',startDate:'2026-01-01',actions:[]}]};
const req=registry(),html=renderToStaticMarkup(React.createElement(req(856).default));assert(html.includes('25%'));assert(html.includes('2027-01-31'));assert(!html.includes('legacy'));assert(!html.includes('revisiones confirmadas'));
console.log('PASS: real goal25percent and final date remain while a stored legacy plan stays hidden');
const expenses=renderToStaticMarkup(React.createElement(req(826).ExpenseTopThree,{month:'2026-11',onOpen(){},items:[{id:'a',name:'Comida',spent:12000},{id:'b',name:'Transporte',spent:3000},{id:'c',name:'Servicios',spent:6000},{id:'d',name:'Otros',spent:1000}]}));
assert(expenses.includes('¿En qué gastaste más?'));assert(expenses.indexOf('$120.00')<expenses.indexOf('$60.00'));assert(expenses.indexOf('$60.00')<expenses.indexOf('$30.00'));assert(!expenses.includes('$10.00'));
console.log('PASS: actual shared Home expense summary renders top3 categories in descending accumulated amount');
