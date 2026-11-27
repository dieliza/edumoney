import {useState} from 'react';
import {Body,ActionButton} from '../../ui/components';
import {parseAmount} from '../../core/money';
import {localToday,validDate,formatMoney} from '../money/domain';
import {goalCalendarEntries} from './calendar';
import {GoalReminderStatus} from './GoalCalendarTools';
import type {Goal,GoalCadence} from './types';
export function GoalSchedulePreview({name,target,date,cadence,deposit,initial}:{name:string;target:string;date:string;cadence:GoalCadence;deposit:string;initial?:Goal}){
 const[expanded,setExpanded]=useState(false),today=localToday();let rows:ReturnType<typeof goalCalendarEntries>=[];
 try{const targetCents=parseAmount(target||'0'),savedCents=initial?.savedCents??parseAmount(deposit||'0');if(targetCents>0&&savedCents>=0&&validDate(date)&&date>=today){const start=initial&&initial.targetCents===targetCents&&initial.desiredDate===date&&initial.cadence===cadence?initial.trackStartDate:today;rows=goalCalendarEntries([{id:initial?.id??'preview',name:name||'Mi meta',kind:initial?.kind??'savings',targetCents,openingCents:0,savedCents,desiredDate:date,cadence,trackStartDate:start??today,version:initial?.version??1,archived:false}],today,date);}}catch{/* An incomplete draft never changes financial records. */}
 return <><Body style={{fontWeight:'700'}}>Fechas de aportación</Body>{rows.length?<>{rows.slice(0,expanded?rows.length:6).map(row=><Body key={row.id}>{row.date} · {row.complete?'Cubierta':formatMoney(row.remainingCents)+' pendiente'}</Body>)}{rows.length>6?<ActionButton title={expanded?'Ver menos fechas':'Ver todas las fechas'} secondary onPress={()=>setExpanded(v=>!v)}/>:null}</>:<Body muted>Indica el objetivo y una fecha final para ver la distribución.</Body>}<Body muted>Vista previa: las fechas se registran al guardar la meta y no mueven dinero. Los avisos de la app cubren los próximos 90 días y se renuevan al abrir EduMoney.</Body><GoalReminderStatus title="Activar notificaciones para estas fechas"/></>;
}
