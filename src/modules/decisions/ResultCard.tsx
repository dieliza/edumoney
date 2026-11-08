import { Body,Card,SectionHeading } from '../../ui/components';
import { formatMoney } from '../money/domain';
import { simulate,type ScenarioInput } from './domain';
export function ResultCard({input,title='Resultado estimado'}:{input:ScenarioInput;title?:string}){
 const r=simulate(input);const loan=['vehicle','home','loan'].includes(input.kind);
 return <Card><SectionHeading title={title} onSurface/>
 <Body style={{fontWeight:'700',fontSize:20}}>Compromiso mensual estimado: {formatMoney(r.monthly)}</Body>
 {loan?<><Body>Precio o principal solicitado: {formatMoney(input.amount)} · Pronto: {formatMoney(input.down)}</Body><Body>Cargos financiados: {formatMoney(input.financedFees)} · Cargos iniciales aparte: {formatMoney(input.upfront)}</Body><Body>Costos adicionales mensuales: {formatMoney(input.extra)}</Body><Body>Principal financiado: {formatMoney(r.financed!)}</Body><Body>Plazo: {input.months} meses · Tasa nominal anual fija: {(input.rateBps/100).toFixed(2)}%</Body><Body>Cuota de principal e intereses: {formatMoney(r.loanPayment!)} · Pagos efectivos estimados: {r.paidMonths}</Body><Body>Última cuota del préstamo: {formatMoney(r.lastPayment!)}</Body></>:null}
 <Body>{input.kind==='saving'?'Rendimiento hipotético acumulado':'Intereses estimados'}: {formatMoney(r.interest)}{['recurring','emergency'].includes(input.kind)?' (este cálculo no incluye financiamiento ni rendimientos)':''}</Body>
 <Body style={{fontWeight:'700'}}>{r.totalLabel}: {formatMoney(r.total)}</Body>
 {r.capital!==null?<><Body>Ahorro inicial: {formatMoney(input.opening)} · Aportación mensual: {formatMoney(input.contribution)} · Tasa nominal anual hipotética: {(input.rateBps/100).toFixed(2)}%</Body><Body>Capital aportado: {formatMoney(r.capital)} · Horizonte: {input.months} meses</Body></>:null}
 {r.gap!==null?<><Body>Gastos esenciales: {formatMoney(input.amount)} por mes · Cobertura elegida: {input.coverage} meses.</Body><Body>Fondo actual: {formatMoney(input.opening)} · Pendiente de meta: {formatMoney(r.gap)}</Body><Body>{r.monthsToTarget===null?'Sin aportación positiva no hay un plazo de acumulación calculable.':`Meses estimados para completar: ${r.monthsToTarget}`}</Body></>:null}
 {input.kind==='recurring'?<Body>Importe por cobro: {formatMoney(input.amount)} · Cargo inicial: {formatMoney(input.upfront)} · Horizonte: {input.months} meses · Frecuencia introducida: {input.cadence==='weekly'?'semanal':input.cadence==='annual'?'anual':'mensual'}</Body>:null}
 <Body>{r.marginAfter===null?'Falta el margen mensual elegido para mostrar el efecto sobre tu presupuesto.':`Margen mensual elegido: ${formatMoney(input.margin!)} → después del compromiso: ${formatMoney(r.marginAfter)}.`}</Body>
 <Body muted>El margen mensual no descuenta los pagos iniciales: revísalos por separado. No consulta tu banco ni modifica tu presupuesto.</Body>
 {r.assumptions.map(a=><Body key={a} muted>{a}</Body>)}
 <Body muted>Es una comparación matemática bajo estos supuestos. No recomienda contratar, comprar ni invertir y no garantiza resultados.</Body>
 </Card>;
}
