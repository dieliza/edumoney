import {useRef,useState} from 'react';
import {ActionButton,Body,Card,SectionHeading} from '../../ui/components';
import {ErrorNotice} from '../money/fields';
import {localToday,formatMoney} from '../money/domain';
import {newId} from '../../core/id';
import {userMessage} from '../../core/errors';
import type {IncomeSchedule} from '../money/types';
import type {MoneyStore} from '../money/store';
/** Existing recurring-income operations, now accessible from Mis deudas. */
export function ScheduledCollections({store,schedules,saved}:{store:MoneyStore;schedules:IncomeSchedule[];saved():Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');const working=useRef(false);
 async function action(task:()=>Promise<unknown>,message:string){if(working.current)return;working.current=true;setBusy(true);setError('');setNotice('');try{await task();setNotice(message);try{await saved();}catch{setError('La operación quedó guardada. Vuelve a abrir esta sección para actualizar la lista.');}}catch(e){setError(userMessage(e));}finally{working.current=false;setBusy(false);}}
 return <><SectionHeading title="Administrar cobros programados"/><ErrorNotice message={error}/>{notice?<Card row><Body>{notice}</Body></Card>:null}<Card row><Body muted>Las fechas previstas no son dinero recibido. Confirma cada cobro una sola vez; editar un cobro pasado no cambia su programación.</Body></Card>
 {!schedules.length?<Card row><Body>Añade un ingreso y elige Recurrente para preparar tus siguientes cobros.</Body></Card>:schedules.map(s=><Card row key={s.id}><Body style={{fontWeight:'700'}}>{s.description}</Body><Body>{formatMoney(s.amountCents)} · {s.active?'Próximo previsto':'En pausa'}: {s.nextDate}</Body><Body muted>Cada {s.intervalCount} {s.cadence==='weekly'?'semana(s)':'mes(es)'}</Body>
 {s.active&&s.nextDate<=localToday()&&!busy?<ActionButton title={`Confirmar cobro: ${s.description}`} onPress={()=>void action(()=>store.confirmSchedule(s.id,s.nextDate,newId(),localToday()),'Cobro registrado. Los siguientes permanecen previstos.')}/>:null}
 {!busy?<ActionButton title={s.active?`Pausar: ${s.description}`:`Reanudar: ${s.description}`} secondary onPress={()=>void action(()=>store.toggleSchedule(s.id,!s.active),'Programación actualizada. Los movimientos anteriores se conservan.')}/>:null}
 </Card>)}{busy?<Body>Guardando programación…</Body>:null}</>;
}
