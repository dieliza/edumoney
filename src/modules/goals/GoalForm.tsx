import {GoalSchedulePreview} from './GoalSchedulePreview';
import {validateGoal} from './domain';
import {announceSaved} from '../../ui/saveFeedback';
import { useEffect,useRef,useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { userMessage,UserInputError } from '../../core/errors';
import { Body,ActionButton } from '../../ui/components';
import { Choices,Field,Sheet,ErrorNotice } from '../money/fields';
import { inputAmount,validDate,formatMoney } from '../money/domain';
import {goalCadences,type GoalCadence,type Goal,type GoalInput} from './types';
import {DateField} from '../../ui/DateField';
import type { GoalStore } from './store';
export function GoalForm({initial,store,saved,close}:{initial?:Goal;store:GoalStore;saved():Promise<unknown>;close():void}){
 const [id]=useState(()=>initial?.id??newId());const [name,setName]=useState(initial?.name??'');
 const [target,setTarget]=useState(initial?inputAmount(initial.targetCents):'');const [date,setDate]=useState(initial?.desiredDate??'');
 const [deposit,setDeposit]=useState(''),[available,setAvailable]=useState<number|null>(null);const saving=useRef(false);
 useEffect(()=>{if(initial)return;let live=true;void store.availableBalance().then(value=>{if(live)setAvailable(value);}).catch(()=>{});return()=>{live=false;};},[store,initial]);
 const [cadence,setCadence]=useState<GoalCadence>(initial?.cadence??'monthly');const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{if(!validDate(date))throw new UserInputError('Selecciona la fecha final para alcanzar la meta.');const g:GoalInput={id,name,kind:initial?.kind??'savings',targetCents:parseAmount(target),openingCents:initial?.openingCents??0,desiredDate:date.trim()||null,cadence};validateGoal(g);const firstDeposit=initial?0:parseAmount(deposit||'0');if(firstDeposit<0)throw new UserInputError('El depósito inicial debe ser de cero o mayor.');if(initial)await store.edit(g,initial.version,reason,initial.archived);else await store.createWithInitial(g,firstDeposit);announceSaved();await saved();close();}catch(e){setError(userMessage(e));}finally{saving.current=false;setBusy(false);}}
 return <Sheet title={initial?'Editar meta':'Nueva meta'} close={close} busy={busy}>
 <Field label="Nombre de la meta" testID="goal-name" value={name} onChangeText={setName}/>
 <Field label="Cantidad objetivo" testID="goal-target" decimal value={target} onChangeText={setTarget}/>
 {!initial?<><Field label="Depósito inicial (USD)" testID="goal-initial-deposit" money decimal value={deposit} onChangeText={setDeposit}/><Body muted>Se transferirá hoy desde el Balance disponible al guardar. {available!==null?'Disponible: '+formatMoney(available):'El balance se validará al confirmar.'} Deja 0.00 para comenzar sin depósito.</Body></>:<Body muted>Editar el objetivo no modifica el dinero registrado. Las aportaciones se realizan mediante transferencias.</Body>}
 <DateField label="Fecha final para alcanzar la meta" required testID="goal-date" value={date} onChangeText={setDate}/>

 <Choices<GoalCadence> label="Frecuencia de aportación sugerida" options={goalCadences} value={cadence} onChange={setCadence}/>
 <GoalSchedulePreview name={name} target={target} date={date} cadence={cadence} deposit={deposit} initial={initial}/>
 {initial?<Field testID="goal-reason" label="Motivo del cambio" value={reason} onChangeText={setReason} multiline/>:null}<ErrorNotice message={error}/>
 {!busy?<ActionButton title={!initial&&deposit&&deposit!=='0.00'?"Guardar meta y transferir depósito inicial":"Guardar meta"} testID="goal-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
