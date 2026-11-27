const assert=require('node:assert/strict'),vm=require('node:vm'),React=require('react');
const g=require('../funds-trial/host-graph.cjs')(process.argv[2]),values=[];let cursor=0;
const slot=initial=>{const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return[values[i],v=>{values[i]=v;}];};
function Component(){return null;}
function Choices(){return null;}
function Field(){return null;}
function ActionButton(){return null;}
const mocks={7:require('react/jsx-runtime'),13:{...React,useState:slot,useRef:v=>slot({current:v})[0]},20014:{MeaningHelp:Component},21020:{FundSheet:Component,FundBody:Component,FundError:Component},803:{newId:()=> 'FICTICIO'},796:{ActionButton},797:{Choices,Field},853:{DateField:Component}};
const cache=new Map();function load(id){if(id in mocks)return mocks[id];if(cache.has(id))return cache.get(id).exports;const d=g.defs.get(id);assert(d);const m={exports:{}};cache.set(id,m);vm.runInThisContext('('+d.factory+')')(globalThis,load,x=>load(x).default,load,m,m.exports,d.deps);return m.exports;}
function nodes(x){if(Array.isArray(x))return x.flatMap(nodes);if(!React.isValidElement(x))return[];return[x,...nodes(x.props.children)];}
const {TransferEditor}=load(21025),calls=[];let saved=0,closed=0;
const funds=[{id:'s',name:'Ahorros',goalId:null,balanceCents:0},{id:'goal:viaje',name:'Viaje FICTICIO',goalId:'viaje',balanceCents:2500}];
const props={store:{transfer:async(...args)=>{calls.push(args);}},scope:'personal',funds,availableCents:10000,close:()=>closed++,saved:async()=>{saved++;}};
function draw(){cursor=0;return nodes(TransferEditor(props));}
(async()=>{let tree=draw();const choice=label=>tree.find(n=>n.type===Choices&&n.props.label===label);assert.deepEqual(choice('Destino').props.options.find(([id])=>id==='goal:viaje'),['goal:viaje','Mis metas · Viaje FICTICIO · $25.00']);assert.equal(choice('Origen').props.options.find(([id])=>id==='goal:viaje')[1],'Viaje FICTICIO · $25.00');choice('Destino').props.onChange('goal:viaje');tree.find(n=>n.type===Field&&n.props.label==='Cantidad (USD)').props.onChangeText('25.00');choice('Confirmación').props.onChange('yes');tree=draw();assert.equal(choice('Destino').props.value,'goal:viaje');const press=tree.find(n=>n.type===ActionButton).props.onPress;press();press();await new Promise(setImmediate);assert.equal(calls.length,1);assert.equal(saved,1);assert.equal(closed,1);assert.equal(calls[0][0].toId,'goal:viaje');assert.equal(calls[0][0].amountCents,2500);assert.equal(calls[0][0].fromId,null);console.log(JSON.stringify({cases:1,passed:1,destination:'Mis metas · Viaje FICTICIO',transfer:'linked goal id; once'}));})().catch(e=>{console.error(e);process.exitCode=1;});
