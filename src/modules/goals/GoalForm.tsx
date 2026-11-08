import { useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { userMessage } from '../../core/errors';
import { Body,ActionButton } from '../../ui/components';
import { Choices,Field,Sheet,ErrorNotice } from '../money/fields';
import { inputAmount } from '../money/domain';
import { goalKinds,type Goal,type GoalKind } from './types';
import type { GoalStore } from './store';
export function GoalForm({initial,store,saved,close}:{initial?:Goal;store:GoalStore;saved():Promise<unknown>;close():void}){
 const [id]=useState(()=>initial?.id??newId());const [name,setName]=useState(initial?.name??'');const [kind,setKind]=useState<GoalKind>(initial?.kind??'savings');
 const [target,setTarget]=useState(initial?inputAmount(initial.targetCents):'');const [opening,setOpening]=useState(initial?inputAmount(initial.openingCents):'');const [date,setDate]=useState(initial?.desiredDate??'');
 const [cadence,setCadence]=useState<'weekly'|'monthly'>(initial?.cadence??'monthly');const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(){if(busy)return;setBusy(true);setError('');try{const g={id,name,kind,targetCents:parseAmount(target),openingCents:parseAmount(opening||'0'),desiredDate:date.trim()||null,cadence};if(initial)await store.edit(g,initial.version,reason,initial.archived);else await store.create(g);await saved();close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title={initial?'Editar meta':'Nueva meta'} close={close} busy={busy}>
 <Field label="Nombre de la meta" testID="goal-name" value={name} onChangeText={setName}/>
 <Choices<GoalKind> label="Tipo de meta" options={goalKinds} value={kind} onChange={setKind}/>
 <Field label="Cantidad objetivo" testID="goal-target" decimal value={target} onChangeText={setTarget}/>
 <Field label="Ahorro previo ya acumulado (opcional)" testID="goal-opening" decimal value={opening} onChangeText={setOpening}/><Body muted>Importe ya reservado antes de registrar aportaciones aquí. No crea ingresos ni movimientos. Al editar, cambia solo esa base previa; las aportaciones se conservan.</Body>
 <Field label="Fecha deseada AAAA-MM-DD (opcional)" testID="goal-date" value={date} onChangeText={setDate}/>
 <Choices<'weekly'|'monthly'> label="Frecuencia de aportación sugerida" options={[[ 'monthly','Mensual'],['weekly','Semanal']]} value={cadence} onChange={setCadence}/>
 {initial?<Field testID="goal-reason" label="Motivo del cambio" value={reason} onChangeText={setReason} multiline/>:null}<ErrorNotice message={error}/>
 {!busy?<ActionButton title="Guardar meta" testID="goal-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
