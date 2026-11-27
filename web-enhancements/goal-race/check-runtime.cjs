// Exercise the deployed Metro factory, including its actual default-export ABI.
const assert=require('node:assert/strict'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const graph=require('../funds-trial/host-graph.cjs')(process.argv[2]);
const values=[];let cursor=0;
const effects=[],component=({children})=>React.createElement('div',null,children);
const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return[values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v;}];},useRef:v=>({current:v}),useCallback:f=>f,useEffect:f=>effects.push(f)};
let subscribed=0;
const mocks={7:require('react/jsx-runtime'),13:hooks,790:{router:{push(){}},useIsFocused:()=>true,useLocalSearchParams:()=>({})},812:{NavigationRail:component},799:{userMessage:String},796:Object.fromEntries(['Screen','ActionButton','Body','Card','ProgressBar','SectionHeading'].map(k=>[k,component])),797:Object.fromEntries(['Field','Sheet','ErrorNotice'].map(k=>[k,component])),806:{getGoalStore:async()=>({snapshot:async()=>({goals:[],contributions:[],movements:[],events:[]})})},871:{onDataCommitted:()=>()=>{}},813:{formatMoney:c=>'$'+(c/100).toFixed(2),localToday:()=> '2026-11-27'},21007:{goalFundId:id=>'goal:'+id},810:{GoalForm:component},792:{useTheme:()=>({name:'light',colors:{text:'#18313F',surface:'#FFFFFF',muted:'#52636D',line:'#CCD6DC'}})}};
const nativeIds=JSON.parse(require('node:fs').readFileSync('/workspace/edumoney/docs/stages/evidence/goal-race/package.json')).report.find(r=>r.id===805).imports['react-native'];
for(const[idKey,id]of Object.entries(nativeIds)){
 assert.match(graph.defs.get(id).factory,/default/,'Production native module has a default export: '+idKey);
 mocks[id]={__esModule:true,default:idKey==='AppState'?{addEventListener(){subscribed++;return{remove(){}};}}:component};
}
delete mocks[813]; // Use the real published date, money and calendar dependencies.
const cache=new Map();
function load(id){if(id in mocks)return mocks[id];if(cache.has(id))return cache.get(id).exports;const def=graph.defs.get(id);assert(def,'Missing module '+id);const m={exports:{}};cache.set(id,m);vm.runInThisContext('('+def.factory+')')(globalThis,load,x=>load(x).default,load,m,m.exports,def.deps);return m.exports;}
let failure;
try{const Screen=load(805).default;const markup=renderToStaticMarkup(Screen());assert(markup.includes('Todavía no has creado metas'));for(const effect of effects)effect();assert.equal(subscribed,1);const Journey=load(37000).GoalJourney;const goal={id:'ficticia',name:'Meta FICTICIA',targetCents:100000,savedCents:100000,openingCents:0,cadence:'weekly',trackStartDate:'2026-11-01',desiredDate:'2026-11-30'};values[0]={};values[1]={goals:[goal],contributions:[],movements:[],events:[]};values[6]=goal.id;cursor=0;const selected=renderToStaticMarkup(Screen());assert(selected.includes('Pista de la meta Meta FICTICIA'));const journey=renderToStaticMarkup(React.createElement(Journey,{goal,animate:true}));assert(journey.includes('Finish'));assert(journey.includes('¡Lo lograste!'));assert(journey.includes('edumoney-firework'));}catch(e){failure=e;}
if(process.argv.includes('--expect-broken')){assert(failure,'Expected v142 native import failure');assert.match(failure.message,/Element type is invalid|addEventListener/);console.log(JSON.stringify({cases:1,reproduced:true,error:failure.message.split('\n')[0]}));}
else{if(failure)throw failure;console.log(JSON.stringify({cases:1,passed:1,screen:'rendered',appState:'subscribed',completedJourney:'rendered'}));}
