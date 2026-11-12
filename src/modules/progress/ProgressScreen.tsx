import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import { newId } from '../../core/id';
import { useTheme } from '../../design/ThemeProvider';
import { userMessage } from '../../core/errors';
import { ActionButton,Body,Card,ProgressBar,Screen,SectionHeading } from '../../ui/components';
import { Field,ErrorNotice } from '../money/fields';
import { formatMoney,localToday } from '../money/domain';
import { shiftDays } from '../bills/domain';
import { progressSteps,progressSummary,type ProgressData } from './domain';
import { getProgressStore } from './localStore';
import type { ProgressStore } from './store';
const empty:ProgressData={movements:[],budgets:[],goals:[],bills:[],debtPayments:[],plans:[]};
export default function ProgressScreen(){
 const {colors}=useTheme();
 const focused=useIsFocused();const [store,setStore]=useState<ProgressStore|null>(null);const [data,setData]=useState(empty);const [month,setMonth]=useState(()=>localToday().slice(0,7));const [error,setError]=useState('');const [busy,setBusy]=useState(false);const today=localToday();
 const load=useCallback(async()=>{const s=await getProgressStore();const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;const refresh=()=>{void load().catch(()=>setError('No pudimos cargar el progreso cifrado. Vuelve a abrir la pestaña.'));};refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>sub.remove();},[focused,load]);
 async function action(task:()=>Promise<unknown>){if(busy)return;setBusy(true);setError('');try{await task();await load();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 const result=useMemo(()=>{try{return {summary:progressSummary(data,month,today),error:''};}catch(e){return {summary:null,error:userMessage(e)};}},[data,month,today]);const s=result.summary;const plan=data.plans[0];const done=plan?.actions.filter(a=>a.completedAt).length??0;const percent=Math.floor(done/progressSteps.length*100);
 return <Screen title="Mi progreso" demo={false} subtitle="Los pequeños hábitos hacen grandes cambios.">
 <ErrorNotice message={error||result.error}/>{!store?<ActivityIndicator accessibilityLabel="Cargando progreso cifrado"/>:null}
 <Field label="Mes para revisar AAAA-MM" testID="progress-month" value={month} onChangeText={setMonth}/>
 {store&&s?<>
 <Card style={{backgroundColor:colors.mint}}><Body style={{fontSize:22,fontWeight:'700'}}>{s.movements?'Cada registro te ayuda a tomar decisiones.':'Tu punto de partida, a tu ritmo.'}</Body><Body>{s.movements?`Has registrado ${s.movements} movimiento(s) en el mes consultado hasta hoy.`:'Cuando registres movimientos, aquí verás tus avances. No necesitas compararte con nadie.'}</Body></Card>
 <Card><SectionHeading title="Gastos frente al presupuesto" onSurface/><Body>Gastos registrados: {formatMoney(s.expenses)}</Body>{s.budget===null?<Body>No hay presupuesto registrado para este mes.</Body>:<><Body>Presupuesto por categorías: {formatMoney(s.budget)} · Gastado en ellas: {formatMoney(s.spent)}</Body><Body>{s.spent<=s.budget?`Margen en categorías presupuestadas: ${formatMoney(s.budget-s.spent)}.`:`Diferencia sobre categorías presupuestadas: ${formatMoney(s.spent-s.budget)}. Puedes revisar y ajustar tu plan.`}</Body></>}<Body>Gastos sin presupuesto de categoría: {formatMoney(s.uncovered)}</Body><Body muted>Incluye compras a crédito; sus pagos posteriores no se cuentan como gastos nuevos. Un margen no confirma ahorro ni saldo bancario.</Body></Card>
 <Card><SectionHeading title="Facturas atendidas" onSurface/><Body>{s.billsPaid} de {s.billsDue} facturas con vencimiento del mes hasta hoy están completamente atendidas.</Body><Body muted>Los pagos parciales siguen pendientes. Las facturas futuras y anuladas no se cuentan aquí.</Body></Card>
 <Card><SectionHeading title="Deudas reducidas por pagos" onSurface/><Body>{formatMoney(s.reduction)} en pagos vigentes que indicaste que reducen el saldo durante el mes.</Body><Body muted>No incluye conciliaciones ni pagos ya reflejados en un estado. No equivale a principal amortizado cuando falta el desglose.</Body></Card>
 <Card><SectionHeading title="Metas alcanzadas" onSurface/><Body>{s.goalsCompleted} de {s.goalsTotal} metas registradas alcanzan actualmente su objetivo, incluidas las archivadas.</Body><Body muted>Se recalcula si corriges aportaciones o cambias el objetivo; conserva tu historial.</Body></Card>
 </>:null}
 <SectionHeading title="Mi plan de 90 días"/>
 <Card><Body>Ocho revisiones sugeridas para organizarte. «Ya lo hice» confirma una revisión personal; no registra pagos ni movimientos. Puedes revisarlas a tu ritmo, incluso antes de la fecha sugerida.</Body>{store&&!busy?<ActionButton title="Iniciar mi plan de 90 días" testID="progress-start-plan" onPress={()=>void action(()=>store.createPlan(newId(),today))}/>:null}</Card>
 {plan?<><Card><Body>Inicio: {plan.startDate}</Body><Body>{done} de {progressSteps.length} revisiones confirmadas · {percent}%</Body><ProgressBar value={percent} label={`Avance confirmado del plan: ${percent}%`}/><Body muted>Porcentaje de revisiones confirmadas; no es porcentaje de días transcurridos ni una calificación financiera.</Body></Card>{progressSteps.map(([key,day,title])=>{const completed=plan.actions.find(a=>a.key===key)?.completedAt;return <Card key={key}><Body style={{fontWeight:'700'}}>Día {day} · {title}</Body><Body>Fecha sugerida: {shiftDays(plan.startDate,day-1)} · {completed?'Revisada':'Por revisar'}</Body>{!busy&&store?<ActionButton title={completed?`Volver a pendiente: ${title}`:`Ya lo hice: ${title}`} testID={`progress-step-${key}`} secondary onPress={()=>void action(()=>store.check(plan.id,key,!completed))}/>:null}</Card>;})}</>:null}
 {data.plans.length>1?<Card><Body>Planes anteriores conservados: {data.plans.slice(1).map(p=>`${p.startDate} (${p.actions.filter(a=>a.completedAt).length}/${progressSteps.length})`).join(' · ')}</Body></Card>:null}
 </Screen>;
}
