import { useMemo, useState } from 'react';
import { userMessage } from '../../core/errors';
import { parseAmount, cents } from '../../core/money';
import { ActionButton, Body, Card, SectionHeading } from '../../ui/components';
import { formatMoney, localToday } from '../money/domain';
import { ErrorNotice, Field } from '../money/fields';
import { addMonths, project } from './domain';
import type { Debt, Method, Projection } from './types';
export function DebtSimulator({debts}:{debts:Debt[]}){
 const [extra,setExtra]=useState('0.00');const [first,setFirst]=useState(()=>addMonths(localToday().slice(0,7),1));const [request,setRequest]=useState<{extra:string;first:string}|null>(null);
 const result=useMemo(()=>{
  if(!request)return null;
  try{
   const amount=parseAmount(request.extra.trim());const snowball=project(debts,'snowball',amount,request.first.trim());const avalanche=project(debts,'avalanche',amount,request.first.trim());
   let baseSnow:Projection|null=null,baseAvalanche:Projection|null=null;
   try{baseSnow=project(debts,'snowball',cents(0),request.first.trim());baseAvalanche=project(debts,'avalanche',cents(0),request.first.trim());}catch{}
   return {snowball,avalanche,baseSnow,baseAvalanche,error:''};
  }catch(e){return {snowball:null,avalanche:null,baseSnow:null,baseAvalanche:null,error:userMessage(e)};}
 },[debts,request]);
 return <>
  <Card><Body style={{fontWeight:'700'}}>Dos maneras de ordenar tus pagos</Body><Body>Bola de nieve: tras cubrir los mínimos, dirige el dinero disponible al saldo más pequeño. Puede ayudar a ver avances tempranos.</Body><Body>Avalancha: tras cubrir los mínimos, prioriza la tasa más alta del mes. Puede reducir intereses bajo los supuestos de este cálculo.</Body><Body muted>El cálculo usa todas tus deudas activas con saldo pendiente. Ambas alternativas conservan el mismo presupuesto mensual y reutilizan los mínimos liberados. Tú eliges; no se recomienda un préstamo ni se garantizan resultados.</Body></Card>
  <Field label="Aporte adicional mensual (USD)" testID="debt-extra" value={extra} onChangeText={v=>{setExtra(v);setRequest(null);}} decimal/>
  <Field label="Primer mes del escenario (AAAA-MM)" value={first} onChangeText={v=>{setFirst(v);setRequest(null);}}/>
  <Card><Body style={{fontWeight:'700'}}>Supuestos del escenario</Body><Body>Un pago mensual, mínimos fijos, interés APR/12 con redondeo a centavos y presupuesto constante. Sin nuevas compras ni cargos futuros. Los cargos facturados ya forman parte del saldo; no se suman otra vez.</Body><Body muted>Una nueva APR conocida se aplica desde el mes de su fecha efectiva. No se modela interés diario, días de gracia, promociones ni cambios del mínimo. El escenario parte del saldo mostrado, con una cuota desde el mes que indiques. El mes inicial predeterminado es el siguiente; los pagos ya realizados no consumen ese presupuesto futuro. Las cifras son estimaciones, no un estado de la entidad.</Body></Card>
  <ActionButton title="Calcular con estos supuestos" testID="debt-calculate" onPress={()=>setRequest({extra,first})}/>
  <ErrorNotice message={result?.error??''}/>
  {result?.snowball&&result.avalanche?<>
   <ProjectionCard method="snowball" result={result.snowball} baseline={result.baseSnow} debts={debts}/>
   <ProjectionCard method="avalanche" result={result.avalanche} baseline={result.baseAvalanche} debts={debts}/>
  </>:null}
 </>;
}
function ProjectionCard({method,result:r,baseline,debts}:{method:Method;result:Projection;baseline:Projection|null;debts:Debt[]}){
 const [detail,setDetail]=useState(false);const name=method==='snowball'?'Bola de nieve':'Avalancha';
 return <Card><SectionHeading title={name}/><Body>Presupuesto mensual del escenario: {formatMoney(r.monthlyBudgetCents)}</Body>
  <Body>{r.status==='paid'?`Liquidación estimada: ${r.months} mes(es)${r.lastMonth?` · mes ${r.lastMonth}`:' · sin mes de liquidación: faltan vencimientos'}.`:`No se liquida dentro de ${r.months} meses con estos supuestos.`}</Body>
  <Body>Intereses estimados {r.status==='paid'?'totales':'dentro del plazo'}: {formatMoney(r.interestCents)}</Body><Body>Pagos estimados: {formatMoney(r.paidCents)} · Saldo al final: {formatMoney(r.remainingCents)}</Body>
  {baseline&&baseline.status==='paid'&&r.status==='paid'?<Body>Comparado con cero adicional: {baseline.months-r.months} mes(es) de diferencia y {formatMoney(baseline.interestCents-r.interestCents)} de diferencia en intereses.</Body>:<Body muted>No hay una comparación completa con cero adicional cuando ese escenario no se liquida o no tiene presupuesto.</Body>}
  {r.nonReducingMonths?<Body>En {r.nonReducingMonths} mes(es), los pagos no superan los intereses del conjunto. Revisa mínimos, tasas y presupuesto.</Body>:null}
  <Body muted>Prioridad para el aporte disponible: {r.order.length?r.order.map(id=>debts.find(d=>d.id===id)?.name??id).join(' → '):'Los mínimos liquidan el saldo; no sobra aporte para asignar.'}</Body>
  <ActionButton title={detail?`Ocultar cuotas de ${name}`:`Ver cuotas de ${name}`} secondary onPress={()=>setDetail(!detail)}/>
  {detail?r.rows.slice(0,24).map(row=><Body key={row.month}>Cuota {row.month}{r.lastMonth?` · ${row.label}`:''}: pago {formatMoney(row.paymentCents)}, interés {formatMoney(row.interestCents)}, saldo {formatMoney(row.remainingCents)}</Body>):null}
  {detail&&r.rows.length>24?<Body muted>Se muestran las primeras 24 cuotas; el resumen incluye todo el plazo calculado, hasta 600 meses.</Body>:null}
 </Card>;
}
