import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
export const kinds=[['vehicle','Vehículo'],['home','Vivienda'],['loan','Préstamo'],['recurring','Gasto recurrente'],['saving','Ahorro'],['emergency','Fondo de emergencia']] as const;
export type SimulationKind=typeof kinds[number][0];
export interface ScenarioInput {kind:SimulationKind;amount:number;down:number;financedFees:number;upfront:number;extra:number;rateBps:number;months:number;cadence:'monthly'|'weekly'|'annual';opening:number;contribution:number;coverage:number;margin:number|null}
export interface SimulationResult {monthly:number;total:number;interest:number;financed:number|null;lastPayment:number|null;loanPayment:number|null;paidMonths:number|null;capital:number|null;target:number|null;gap:number|null;monthsToTarget:number|null;marginAfter:number|null;assumptions:string[];totalLabel:string}
const fail=(message:string):never=>{throw new UserInputError(message);};
const integer=(n:number,min:number,max:number,label:string)=>{if(!Number.isInteger(n)||n<min||n>max)fail(`Revisa ${label}: entre ${min} y ${max}.`);};
const positive=(n:number,label:string,zero=true)=>{cents(n);if(n<0||!zero&&n===0)fail(`Revisa ${label}: ${zero?'cero o mayor':'mayor que cero'}.`);};
const safe=(n:bigint)=>cents(Number(n));
const sum=(...n:number[])=>safe(n.reduce((a,b)=>a+BigInt(b),0n));
export function interestForMonth(balance:number,bps:number){positive(balance,'saldo');integer(bps,0,10000,'tasa nominal anual en puntos básicos');return safe((BigInt(balance)*BigInt(bps)+60000n)/120000n);}
export function parseRate(value:string){if(!/^\d+(?:\.\d{1,2})?$/.test(value))fail('Confirma la tasa anual con hasta dos decimales; escribe 0 si es cero.');const [w,f='']=value.split('.');const n=Number(BigInt(w)*100n+BigInt(f.padEnd(2,'0')));integer(n,0,10000,'tasa anual (0 a 100%)');return n;}
/** Cuota fija mínima en centavos que amortiza en el plazo. Interés mensual redondeado medio centavo hacia arriba. */
export function amortize(principal:number,bps:number,months:number){
 positive(principal,'principal',false);integer(bps,0,10000,'tasa nominal anual en puntos básicos');integer(months,1,600,'plazo en meses');
 const firstInterest=interestForMonth(principal,bps);
 const remaining=(payment:number)=>{if(payment<=firstInterest)return principal;let balance=principal;for(let i=0;i<months&&balance>0;i++){const due=sum(balance,interestForMonth(balance,bps));if(payment>=due)return 0;balance=due-payment;}return balance;};
 let low=1;let high:number=sum(principal,interestForMonth(principal,bps));
 while(low<high){const mid=low+Math.floor((high-low)/2);if(remaining(mid)===0)high=mid;else low=mid+1;}
 let balance=principal,paid=0,interest=0,last=0,paidMonths=0;
 for(let i=0;i<months&&balance>0;i++){const charge=interestForMonth(balance,bps);interest=sum(interest,charge);const due=sum(balance,charge);last=Math.min(low,due);paid=sum(paid,last);paidMonths++;balance=due-last;}
 return {monthly:low,lastPayment:last,interest,total:paid,paidMonths};
}
export function simulate(p:ScenarioInput):SimulationResult {
 if(!kinds.some(([k])=>k===p.kind))fail('Simulador no válido.');
 if(p.margin!==null)cents(p.margin);
 const r:SimulationResult={monthly:0,total:0,interest:0,financed:null,lastPayment:null,loanPayment:null,paidMonths:null,capital:null,target:null,gap:null,monthsToTarget:null,marginAfter:null,assumptions:[],totalLabel:'Total estimado del escenario'};
 if(['vehicle','home','loan'].includes(p.kind)){
 positive(p.amount,'precio o principal',false);for(const v of [p.down,p.financedFees,p.upfront,p.extra])positive(v,'costos y pronto');
 if(p.kind==='loan'&&p.down!==0)fail('Un préstamo directo no utiliza pronto en este cálculo.');
 if(p.down>p.amount)fail('El pronto no puede superar el precio.');
 r.financed=sum(p.amount,-p.down,p.financedFees);
 const a=r.financed===0?{monthly:0,lastPayment:0,interest:0,total:0,paidMonths:0}:amortize(r.financed,p.rateBps,p.months);
 integer(p.months,1,600,'plazo en meses');integer(p.rateBps,0,10000,'tasa nominal anual en puntos básicos');
 r.loanPayment=a.monthly;r.paidMonths=a.paidMonths;r.monthly=sum(a.monthly,p.extra);r.interest=a.interest;r.lastPayment=a.lastPayment;r.total=sum(a.total,p.down,p.upfront,safe(BigInt(p.extra)*BigInt(p.months)));
 r.assumptions=['Tasa nominal fija dividida entre 12; interés mensual redondeado al centavo, medio hacia arriba. No equivale a APR efectiva con comisiones.','Cuota fija en centavos; la última cuota puede ser menor. Sin pagos anticipados, tasas variables ni pago global final.',`El total incluye pronto, cargos iniciales, cargos financiados e intereses, más costos adicionales mensuales durante ${p.months} meses. Solo incluye las partidas que introdujiste.`,'Los costos adicionales no amortizan el préstamo. El redondeo puede terminar préstamos muy pequeños antes del plazo elegido.'];
 }else if(p.kind==='recurring'){
 positive(p.amount,'importe recurrente',false);positive(p.upfront,'cargo inicial');integer(p.months,1,600,'meses de comparación');
 if(!['weekly','monthly','annual'].includes(p.cadence))fail('Frecuencia no válida.');
 r.monthly=p.cadence==='weekly'?safe((BigInt(p.amount)*52n+6n)/12n):p.cadence==='annual'?safe((BigInt(p.amount)+6n)/12n):p.amount;
 r.total=sum(safe(BigInt(r.monthly)*BigInt(p.months)),p.upfront);
 r.assumptions=['Equivalente mensual: semanal × 52 / 12; anual / 12. Redondeo al centavo, medio hacia arriba.','El total multiplica ese promedio mensual por los meses elegidos y añade el cargo inicial. No es un calendario de cobros reales; no supone cambios de precio.'];
 }else if(p.kind==='saving'){
 positive(p.opening,'ahorro inicial');positive(p.contribution,'aportación');integer(p.months,1,600,'meses');integer(p.rateBps,0,10000,'tasa nominal anual hipotética en puntos básicos');
 let balance=p.opening;for(let i=0;i<p.months;i++){const charge=interestForMonth(balance,p.rateBps);r.interest=sum(r.interest,charge);balance=sum(balance,charge,p.contribution);}
 r.monthly=p.contribution;r.total=balance;r.capital=sum(p.opening,safe(BigInt(p.contribution)*BigInt(p.months)));r.totalLabel='Ahorro final hipotético';
 r.assumptions=['Aportación al final de cada mes, sin retiros. Tasa nominal anual constante dividida entre 12; interés mensual al centavo.','La tasa la eliges como supuesto; no es oferta ni predicción. No incluye inflación, impuestos, comisiones o pérdidas. Si deseas calcular sin rendimiento, confirma 0%.'];
 }else{
 positive(p.amount,'gastos esenciales mensuales',false);positive(p.opening,'fondo actual');positive(p.contribution,'aportación');integer(p.coverage,1,36,'meses de cobertura');
 r.target=safe(BigInt(p.amount)*BigInt(p.coverage));r.gap=Math.max(0,r.target-p.opening);r.monthly=p.contribution;r.total=r.target;r.totalLabel='Meta de fondo elegida';
 r.monthsToTarget=r.gap===0?0:p.contribution===0?null:Number((BigInt(r.gap)+BigInt(p.contribution)-1n)/BigInt(p.contribution));
 r.assumptions=['Meta = gastos esenciales mensuales × meses de cobertura elegidos. Sin rendimientos, inflación, retiros ni cambios en gastos.','Meses para completar = pendiente / aportación mensual, redondeados hacia arriba. Es una meta elegida, no una garantía de cobertura suficiente.'];
 }
 if(p.margin!==null)r.marginAfter=sum(p.margin,-r.monthly);
 return r;
}
/** Solo preparación para una etapa posterior: las reglas con fuentes aún no validadas no se ejecutan. */
export interface FutureEconomicScenario {name:'favorable'|'intermediate'|'adverse';inflationBps:number|null;assumptions:string[];sources:{url:string;period:string;checkedAt:string}[];status:'pending_validation'}
