import {useEffect,useState} from 'react';
import {router} from 'expo-router';
import {onDataCommitted} from '../../storage/changeEvents';
import {ActionButton,Body,Card,SectionHeading} from '../../ui/components';
import {userMessage} from '../../core/errors';
import {formatMoney,localToday,validMonth} from '../money/domain';
import {shiftDays} from '../bills/domain';
import {getGoalStore} from './localStore';
import {goalCalendarEntries} from './calendar';
import type {Goal} from './types';
export function GoalCalendar({month,upcoming=false}:{month?:string;upcoming?:boolean}){
 const[goals,setGoals]=useState<Goal[]>([]),[error,setError]=useState(''),[limit,setLimit]=useState(30);
 useEffect(()=>{let live=true,epoch=0;if(!month&&!upcoming)return;const refresh=()=>{const ticket=++epoch;void getGoalStore().then(s=>s.snapshot()).then(data=>{if(live&&ticket===epoch){setGoals(data.goals);setError('');}}).catch(e=>{if(live&&ticket===epoch)setError(userMessage(e));});};refresh();const off=onDataCommitted(refresh);return()=>{live=false;off();};},[month,upcoming]);
 if(!month&&!upcoming)return null;if(month&&!validMonth(month))return null;
 const today=localToday(),from=month?month+'-01':today;let to=today;
 if(month){const[y,m]=month.split('-').map(Number);to=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);}else to=today>'9999-10-01'?'9999-12-31':shiftDays(today,90);
 const planned=goalCalendarEntries(goals,from,to).filter(e=>!upcoming||!e.complete);const entries=upcoming?planned.filter((e,i)=>planned.findIndex(other=>other.goalId===e.goalId)===i):planned;
 return <Card><SectionHeading title="Aportaciones de Mis metas" onSurface/><Body muted>Fechas según tu plan. Los recordatorios no registran gastos ni aportaciones.</Body>{error?<Body>{error}</Body>:null}{!entries.length?<Body>No hay aportaciones programadas para este período.</Body>:null}{entries.slice(0,limit).map(e=><Card row key={e.id}><Body style={{fontWeight:'700'}}>{e.date} · {e.name}</Body><Body>{e.complete?'Cubierta':e.paidCents>0?'Aportación parcial':'Pendiente'} · {formatMoney(e.remainingCents)} pendiente de {formatMoney(e.amountCents)}</Body><ActionButton title="Ver meta" secondary onPress={()=>router.push({pathname:'/goals',params:{goalId:e.goalId}})}/></Card>)}{entries.length>limit?<ActionButton title="Ver más aportaciones" secondary onPress={()=>setLimit(v=>v+30)}/>:null}</Card>;
}
