import {isValidElement,type ReactElement} from 'react';
import {expect,it,vi} from 'vitest';
import {GoalJourney} from '../src/modules/goals/GoalJourney.web';
import type {Goal} from '../src/modules/goals/types';
const h=vi.hoisted(()=>({values:[] as unknown[],cursor:0}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;return[h.values[i],(v:unknown)=>h.values[i]=v];}}));
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({name:'light',colors:{text:'#102F42',muted:'#455E6C',surface:'#FFFFFF',line:'#9BAFB8'}})}));
type Node=ReactElement<Record<string,unknown>>;
function nodes(x:unknown):Node[]{if(Array.isArray(x))return x.flatMap(nodes);if(!isValidElement(x))return[];const n=x as Node;return[n,...nodes(n.props.children)];}
it('navega etapas largas y vuelve al avance actual cuando se confirma una aportación',()=>{let goal:Goal={id:'g',name:'Viaje FICTICIO',kind:'savings',targetCents:100000,openingCents:0,savedCents:0,desiredDate:'2027-11-01',cadence:'weekly',trackStartDate:'2026-11-01',archived:false,version:1};const draw=()=>{h.cursor=0;return nodes(GoalJourney({goal}));};let t=draw();expect(t.some(n=>n.type==='span'&&JSON.stringify(n.props.children).includes('12'))).toBe(true);const next=t.find(n=>n.type==='button'&&n.props.children==='Siguientes')!;(next.props.onClick as ()=>void)();t=draw();expect(t.some(n=>n.type==='span'&&JSON.stringify(n.props.children).includes('13'))).toBe(true);goal={...goal,savedCents:100000};t=draw();expect(t.find(n=>n.type==='button'&&n.props.children==='Siguientes')!.props.disabled).toBe(true);expect(t.some(n=>n.type==='text'&&n.props.children==='Finish')).toBe(true);});
