import {requestGoalReminders} from './reminders';
import {validateGoal} from './domain';
import {announceSaved} from '../../ui/saveFeedback';
import { useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { userMessage,UserInputError } from '../../core/errors';
import { Body,ActionButton } from '../../ui/components';
import { Choices,Field,Sheet,ErrorNotice } from '../money/fields';
import { inputAmount,validDate } from '../money/domain';
import {goalCadences,type GoalCadence,type Goal,type GoalInput} from './types';
import {DateField} from '../../ui/DateField';
import type { GoalStore } from './store';
export function GoalForm({initial,store,saved,close}:{initial?:Goal;store:GoalStore;saved():Promise<unknown>;close():void}){
 const [id]=useState(()=>initial?.id??newId());const [name,setName]=useState(initial?.name??'');
 const [target,setTarget]=useState(initial?inputAmount(initial.targetCents):'');const [date,setDate]=useState(initial?.desiredDate??'');
 const [cadence,setCadence]=useState<GoalCadence>(initial?.cadence??'monthly');const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(){if(busy)return;setBusy(true);setError('');try{if(!validDate(date))throw new UserInputError('Selecciona la fecha final para alcanzar la meta.');const g:GoalInput={id,name,kind:initial?.kind??'savings',targetCents:parseAmount(target),openingCents:initial?.openingCents??0,desiredDate:date.trim()||null,cadence};validateGoal(g);void requestGoalReminders().catch(()=>undefined);if(initial)await store.edit(g,initial.version,reason,initial.archived);else await store.create(g);announceSaved();await saved();close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title={initial?'Editar meta':'Nueva meta'} close={close} busy={busy}>
 <Field label="Nombre de la meta" testID="goal-name" value={name} onChangeText={setName}/>
 <Field label="Cantidad objetivo" testID="goal-target" decimal value={target} onChangeText={setTarget}/>
 <Body muted>Define el objetivo sin añadir dinero. Para financiarlo elige esta meta como destino en Transferir fondos. El dinero registrado anteriormente se conserva y no se modifica desde este formulario.</Body>
 <DateField label="Fecha final para alcanzar la meta" required testID="goal-date" value={date} onChangeText={setDate}/>
 <Body muted>Las fechas de aportación se anotan en Calendario. Al guardar se solicita activar los recordatorios de este dispositivo; permite las notificaciones si te lo pregunta. Las fechas no mueven dinero.</Body>
 <Choices<GoalCadence> label="Frecuencia de aportación sugerida" options={goalCadences} value={cadence} onChange={setCadence}/>
 {initial?<Field testID="goal-reason" label="Motivo del cambio" value={reason} onChangeText={setReason} multiline/>:null}<ErrorNotice message={error}/>
 {!busy?<ActionButton title="Guardar meta" testID="goal-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
