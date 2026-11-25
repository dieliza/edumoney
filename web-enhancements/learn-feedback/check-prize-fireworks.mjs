import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bundle=fs.readFileSync(process.argv[2],'utf8');
const at=bundle.indexOf('_e.EducationPanel=function');
const begin=bundle.lastIndexOf('\n__d(',at);
const end=bundle.indexOf('\n__d(',at);
const tips=Array.from({length:11},(_,i)=>({id:'tip-'+i,title:'Tip '+i,question:'Question',options:['Right','Wrong'],explanation:'Explanation',sourceIds:[]}));
const catalog={current:tips,history:[],sources:[],nextAt:'2026-12-14'};
const jsx=(type,props,key)=>({type,props,key});
const state=[];
const progress=new Map();
const legacy={id:'learn-20',badgeId:'learn-20',title:'Legacy',symbol:'★',basis:'Legacy',earnedAt:'2026-11-15'};
let cursor=0, done, claims=0, stamps=1;
const a={
 useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],v=>{state[i]=v}]},
 useRef(){return {current:true}}, useCallback:f=>f, useEffect(){}
};
const types=(...names)=>Object.fromEntries(names.map(n=>[n,n]));
const store={
 async read(t){if(!progress.has(t.id))progress.set(t.id,{tipId:t.id,readAt:'now'})},
 async answer(t,answer){await this.read(t);if(answer===0&&!progress.get(t.id).learnedAt)progress.get(t.id).learnedAt=String(stamps++).padStart(4,'0');return answer===0},
 async snapshot(){
   const copy=[...progress.values()].map(x=>({...x})).reverse();
   done?.();
   return {progress:copy,awards:[legacy],learned:copy.filter(x=>x.learnedAt).length,animations:true};
 },
 async claimCelebration(){claims++;return null}
};
const modules=[{isDebtTip:()=>false},a,{},{},{},{},'Pressable','View',{useIsFocused:()=>true},
 types('Card','Body','ActionButton','ProgressBar','SectionHeading'),types('Sheet','Choices','ErrorNotice'),
 {useTheme:()=>({colors:{mint:'mint'}})},{getEducationStore:async()=>store},{initialCatalog:catalog},{},{jsx,jsxs:jsx,Fragment:'Fragment'}];
const exports={};
vm.runInNewContext(bundle.slice(begin,end),{__d:factory=>factory(null,n=>modules[n],null,null,{},exports,modules.map((_,i)=>i))});
const render=(achievementsOnly=false)=>{cursor=0;return exports.EducationPanel({achievementsOnly})};
function all(node,pred){
 if(!node)return [];if(Array.isArray(node))return node.flatMap(n=>all(n,pred));if(typeof node!=='object')return [];
 return [...(pred(node)?[node]:[]),...all(node.props?.children,pred)];
}
const sheet=(tree=render())=>all(tree,n=>n.type==='Sheet')[0];
const btn=title=>all(sheet(),n=>n.props?.title===title)[0];
const reward=(tree=render())=>all(sheet(tree),n=>typeof n.type==='function'&&n.props.inline)[0];
const status=(tree,text)=>all(tree,n=>n.props?.children===text).length;
function open(t){all(render(),n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith(t.title+':'))[0].props.onPress()}
function close(){sheet().props.close()}
function choose(value){all(sheet(),n=>n.type==='Choices')[0].props.onChange(value)}
async function press(title){
 const flush=new Promise(resolve=>{done=resolve});
 btn(title).props.onPress();
 await flush;
 for(let i=0;i<22;i++)await Promise.resolve();
 done=null;
 return render();
}
render();state[9]=false;
open(tips[0]);await press('Marcar como leído');assert(status(sheet(),'✓ Leído'));assert(!reward());
choose('1');await press('Comprobar lo aprendido');assert(!reward());assert(status(sheet(),'Puedes volver a intentarlo. Explanation'));close();
const expected=JSON.parse(fs.readFileSync(new URL('./tip-prizes.json',import.meta.url),'utf8'));
const order=[1,0,3,2,5,4,7,6,9,8,10];
for(let j=0;j<order.length;j++){
 open(tips[order[j]]);
 if (j===1)state[9]=true;
 choose('0');await press('Comprobar lo aprendido');
 assert(reward(), 'first correct shows acknowledgement');
 if(j<10){assert.equal(reward().props.award.title,expected[j][1]);assert.equal(reward().props.award.symbol,expected[j][0]);assert.equal(reward().props.animate,j!==1);}
 else assert.equal(reward().props.award,undefined);
 const node=reward();const presentation=node.type(node.props);if(j<10){assert(status(presentation,expected[j][2]));assert(status(presentation,expected[j][1]));}
 const bursts=all(presentation,n=>n.props?.dataSet?.eduBurst==='true');assert.equal(bursts.length,j===1?0:3);
 if(j===0){assert.equal(node.props.hasNext,true);node.props.onContinue();assert(sheet());assert.equal(reward(),undefined);}
 if(j===1)state[9]=false;
 close();
}
open(tips[1]);choose('0');await press('Comprobar lo aprendido');assert(!reward());close();
assert.equal(claims,0);
const panel=render(true);
assert(all(panel,n=>n.props?.title==='Premios por consejos').length);assert.equal(status(panel,'Obtenido'),10);
assert(all(panel,n=>n.props?.title==='Otros reconocimientos').length);
assert(all(panel,n=>Array.isArray(n.props?.children)&&n.props.children.includes('Legacy')).length);


const css=fs.readFileSync(new URL('./prize-fireworks.css',import.meta.url),'utf8');assert(css.includes('prefers-reduced-motion:reduce'));assert(css.includes('3.5s both'));assert(css.includes('var(--delay) 2 both'));console.log('Passed: ten prize titles/messages, read-only/wrong/repeat do not reward, next action clears reward, finite fireworks, reduced motion, eleventh cap, progress/legacy preservation.');
