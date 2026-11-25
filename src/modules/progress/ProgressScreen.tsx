import {goalPercent} from '../goals/domain';
import {onDataCommitted} from '../../storage/changeEvents';
import { EducationPanel } from '../education/EducationPanel';
import { useCallback,useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useTheme } from '../../design/ThemeProvider';
import { userMessage } from '../../core/errors';
import { Body,Card,ProgressBar,Screen,SectionHeading } from '../../ui/components';
import { Field,ErrorNotice } from '../money/fields';
import { formatMoney,localToday } from '../money/domain';
import { progressSummary,type ProgressData } from './domain';
import { getProgressStore } from './localStore';
import type { ProgressStore } from './store';
const empty:ProgressData={movements:[],budgets:[],goals:[],bills:[],debtPayments:[],plans:[]};
export default function ProgressScreen(){
 const {colors}=useTheme();
 const focused=useIsFocused();const [store,setStore]=useState<ProgressStore|null>(null);const [data,setData]=useState(empty);const [month,setMonth]=useState(()=>localToday().slice(0,7));const [error,setError]=useState('');const today=localToday();
 const load=useCallback(async()=>{const s=await getProgressStore();const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;const refresh=()=>{void load().catch(()=>setError('No pudimos cargar el progreso cifrado. Vuelve a abrir la pestaña.'));};refresh();const stop=onDataCommitted(refresh),sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>{stop();sub.remove();};},[focused,load]);
 const result=useMemo(()=>{try{return {summary:progressSummary(data,month,today),error:''};}catch(e){return {summary:null,error:userMessage(e)};}},[data,month,today]);const s=result.summary;
 return <Screen title="Mi progreso" demo={false} subtitle="Los pequeños hábitos hacen grandes cambios.">
 <ErrorNotice message={error||result.error}/>{!store?<ActivityIndicator accessibilityLabel="Cargando progreso cifrado"/>:null}
 <Field label="Mes para revisar AAAA-MM" testID="progress-month" value={month} onChangeText={setMonth}/>
 {store&&s?<>
 <Card row style={{backgroundColor:colors.mint}}><Body style={{fontSize:22,fontWeight:'700'}}>{s.movements?'Cada registro te ayuda a tomar decisiones.':'Tu punto de partida, a tu ritmo.'}</Body><Body>{s.movements?`Has registrado ${s.movements} transacción(es) en el mes consultado hasta hoy.`:'Cuando registres transacciones, aquí verás tus avances. No necesitas compararte con nadie.'}</Body></Card>
 <Card row><SectionHeading title="Gastos frente al presupuesto" onSurface/><Body>Gastos registrados: {formatMoney(s.expenses)}</Body>{s.budget===null?<Body>No hay presupuesto registrado para este mes.</Body>:<><Body>Presupuesto por categorías: {formatMoney(s.budget)} · Gastado en ellas: {formatMoney(s.spent)}</Body><Body>{s.spent<=s.budget?`Margen en categorías presupuestadas: ${formatMoney(s.budget-s.spent)}.`:`Diferencia sobre categorías presupuestadas: ${formatMoney(s.spent-s.budget)}. Puedes revisar y ajustar tu plan.`}</Body></>}<Body>Gastos sin presupuesto de categoría: {formatMoney(s.uncovered)}</Body><Body muted>Incluye compras a crédito; sus pagos posteriores no se cuentan como gastos nuevos. Un margen no confirma ahorro ni saldo bancario.</Body></Card>
 <Card row><SectionHeading title="Facturas atendidas" onSurface/><Body>{s.billsPaid} de {s.billsDue} facturas con vencimiento del mes hasta hoy están completamente atendidas.</Body><Body muted>Los pagos parciales siguen pendientes. Las facturas futuras y anuladas no se cuentan aquí.</Body></Card>
 <Card row><SectionHeading title="Deudas reducidas por pagos" onSurface/><Body>{formatMoney(s.reduction)} en pagos vigentes que indicaste que reducen el saldo durante el mes.</Body><Body muted>No incluye conciliaciones ni pagos ya reflejados en un estado. No equivale a principal amortizado cuando falta el desglose.</Body></Card>
 <Card row><SectionHeading title="Metas alcanzadas" onSurface/><Body>{s.goalsCompleted} de {s.goalsTotal} metas registradas alcanzan actualmente su objetivo, incluidas las archivadas.</Body><Body muted>Se recalcula si corriges aportaciones o cambias el objetivo; conserva tu historial.</Body>{data.goals.map(g=>{const percentage=goalPercent(g.savedCents,g.targetCents);return <Card key={g.id} row><Body style={{fontWeight:'700'}}>{g.name}{g.archived?' · Archivada':''}</Body><Body>{formatMoney(g.savedCents)} de {formatMoney(g.targetCents)} · {percentage}%</Body><ProgressBar value={Math.min(100,percentage)} label={`Progreso de ${g.name}: ${percentage}%`}/><Body>Fecha final: {g.desiredDate??'Pendiente de definir'}</Body></Card>;})}</Card>
 </>:null}
 <EducationPanel achievementsOnly/>
 </Screen>;
}
