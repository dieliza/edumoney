import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,AppState,Pressable,View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { userMessage } from '../../core/errors';
import { ActionButton,Body,Card,IconBadge,ProgressBar,Screen,SectionHeading,ui } from '../../ui/components';
import { formatMoney,localToday } from '../money/domain';
import { Field,Sheet,ErrorNotice } from '../money/fields';
import { getGoalStore } from './localStore';
import type { GoalStore } from './store';
import type { Goal,GoalSnapshot } from './types';
import { goalPercent,suggestedContribution } from './domain';
import { GoalForm } from './GoalForm';
import { ContributionForm } from './ContributionForm';
const empty:GoalSnapshot={goals:[],contributions:[],movements:[],events:[]};
export default function GoalsScreen(){
 const focused=useIsFocused();const [store,setStore]=useState<GoalStore|null>(null);const [data,setData]=useState(empty);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [form,setForm]=useState<Goal|true|null>(null);const [detailId,setDetailId]=useState<string|null>(null);const [contribute,setContribute]=useState<Goal|null>(null);const [reason,setReason]=useState('');const [archived,setArchived]=useState(false);const [limit,setLimit]=useState(30);
 const load=useCallback(async()=>{const s=await getGoalStore();const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;const refresh=()=>{void load().catch(()=>setError('No pudimos cargar las metas cifradas. Vuelve a abrir esta pestaña.'));};refresh();const sub=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return()=>sub.remove();},[focused,load]);
 async function action(task:()=>Promise<unknown>){if(busy)return;setBusy(true);setError('');try{await task();await load();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 const detail=data.goals.find(g=>g.id===detailId);const today=localToday();
 return <Screen title="Mis metas" demo={false} subtitle="Dale un propósito a cada paso que das.">
 <ErrorNotice message={error}/><ActionButton title="Crear nueva meta" testID="goal-create" icon="add-circle-outline" onPress={()=>{setForm(true);setError('');}}/>
 {!store?<ActivityIndicator accessibilityLabel="Cargando metas cifradas"/>:null}
 <ActionButton title={archived?'Ver metas actuales':'Ver metas archivadas'} secondary onPress={()=>setArchived(!archived)}/>
 {!data.goals.filter(g=>g.archived===archived).length?<Card><Body>{archived?'No hay metas archivadas.':'Todavía no has creado metas. Tus cantidades empiezan en blanco.'}</Body></Card>:null}
 {data.goals.filter(g=>g.archived===archived).map(g=>{const percent=goalPercent(g.savedCents,g.targetCents);const suggestion=suggestedContribution(g.savedCents,g.targetCents,g.desiredDate,today,g.cadence);return <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`Meta ${g.name}, ahorro ${formatMoney(g.savedCents)}, objetivo ${formatMoney(g.targetCents)}, progreso ${percent}%`} onPress={()=>{setDetailId(g.id);setReason('');setLimit(30);setError('');}}><Card><View style={ui.row}><IconBadge icon={g.kind==='home'?'home-outline':g.kind==='vehicle'?'car-outline':g.kind==='emergency'?'shield-checkmark-outline':'flag-outline'}/><View style={{flex:1,gap:10}}><Body style={{fontSize:19,fontWeight:'700'}}>{g.name}</Body><ProgressBar value={Math.min(100,percent)} label={`Progreso de ${g.name}: ${percent}%`}/><Body>{formatMoney(g.savedCents)} / {formatMoney(g.targetCents)} · {percent}%</Body></View></View><Body>{g.savedCents>=g.targetCents?'¡Objetivo alcanzado! Puedes seguir ahorrando o ajustar tu meta.':suggestion.status==='missing'?'Añade una fecha deseada para estimar aportaciones.':suggestion.status==='due'?'Fecha deseada alcanzada o vencida. Puedes revisarla a tu ritmo.':`Sugerencia ${g.cadence==='weekly'?'semanal':'mensual'}: ${formatMoney(suggestion.amountCents!)} durante ${suggestion.periods} períodos.`}</Body><Body muted>Fecha deseada: {g.desiredDate??'Sin definir'}</Body></Card></Pressable>;})}
 <Card><Body muted>Las sugerencias reparten lo pendiente en períodos de 7 o 30 días y redondean hacia arriba al centavo. No incluyen rendimientos ni débitos automáticos. El ahorro registrado no confirma un saldo bancario.</Body></Card>
 {form&&store?<GoalForm initial={form===true?undefined:form} store={store} saved={load} close={()=>setForm(null)}/>:null}
 {contribute&&store?<ContributionForm goal={contribute} data={data} store={store} saved={load} close={()=>setContribute(null)}/>:null}
 {detail&&store?<Sheet title="Detalle de meta" close={()=>setDetailId(null)} busy={busy}>
 <Body style={{fontWeight:'700'}}>{detail.name}</Body><Body>Ahorro registrado: {formatMoney(detail.savedCents)} · Objetivo: {formatMoney(detail.targetCents)}</Body><Body>Ahorro previo: {formatMoney(detail.openingCents)}. Las aportaciones vinculadas se suman por separado.</Body>
 {!busy?<><ActionButton title="Editar meta" testID="goal-edit" secondary onPress={()=>{setForm(detail);setDetailId(null);}}/>{!detail.archived?<ActionButton title="Registrar aportación" testID="goal-contribute" onPress={()=>{setContribute(detail);setDetailId(null);}}/>:null}</>:null}
 <SectionHeading title="Historial de aportaciones" onSurface/>
 {data.contributions.filter(c=>c.goalId===detail.id).slice(0,limit).map(c=><Card key={c.id}><Body>{c.date} · {formatMoney(c.amountCents)} · {c.reversedAt?'Revertida':'Vigente'}</Body>{c.reversedAt?<Body>{c.reversalReason}</Body>:!busy?<ActionButton title={`Revertir aportación de ${formatMoney(c.amountCents)}`} secondary onPress={()=>void action(()=>store.reverse(c.id,reason))}/>:null}</Card>)}
 {data.contributions.filter(c=>c.goalId===detail.id).length>limit?<ActionButton title="Ver más aportaciones" secondary onPress={()=>setLimit(limit+30)}/>:null}
 <SectionHeading title="Cambios de la meta" onSurface/>{data.events.filter(e=>e.goalId===detail.id).slice(0,limit).map((e,i)=><Body key={i}>{e.recordedAt.slice(0,10)} · {e.reason}</Body>)}
 <Field label="Motivo para revertir o archivar" value={reason} onChangeText={setReason} multiline/><Body muted>Revertir conserva el historial. Si se creó el movimiento aquí, retira ese flujo; si ya existía, solo quita su vínculo. Para corregir importe o fecha, revierte y vuelve a registrar.</Body><ErrorNotice message={error}/>
 {!busy?<ActionButton title={detail.archived?'Reactivar meta':'Archivar meta'} secondary onPress={()=>void action(async()=>{await store.edit(detail,detail.version,reason,!detail.archived);setDetailId(null);})}/>:null}
 </Sheet>:null}
 </Screen>;
}
