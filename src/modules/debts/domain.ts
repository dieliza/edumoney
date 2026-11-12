import { UserInputError } from '../../core/errors';
import { addAmounts, cents, parseAmount, type Cents } from '../../core/money';
import { validDate, validMonth } from '../money/domain';
import type { Debt, DebtInput, DebtPaymentInput, Method, Projection } from './types';
export function parseRate(text:string):number {const rate=parseAmount(text.trim());if(rate<0||rate>100000)throw new UserInputError('La tasa anual debe estar entre 0 y 1000%, con hasta dos decimales.');return rate;}
export function validateDebt(d:DebtInput,today:string){
 if(!d.id||!d.name.trim()||d.name.length>100||!['credit_card','personal_loan','auto_loan','other','unknown'].includes(d.kind))throw new UserInputError('Revisa el nombre y tipo de deuda.');
 if(cents(d.balanceCents)<0 || d.balanceAsOf!==null&&(!validDate(d.balanceAsOf)||d.balanceAsOf>today))throw new UserInputError('Revisa saldo y fecha de su estado (no futura).');
 for(const v of [d.minimumCents,d.feesCents])if(v!==null&&cents(v)<0)throw new UserInputError('Mínimo y cargos no pueden ser negativos.');
 for(const v of [d.annualRateBps,d.futureRateBps])if(v!==null&&(!Number.isSafeInteger(v)||v<0||v>100000))throw new UserInputError('Tasa anual fuera de rango (0 a 1000%).');
 for(const date of [d.dueDate,d.closingDate,d.rateChangeDate])if(date!==null&&!validDate(date))throw new UserInputError('Usa fechas válidas AAAA-MM-DD o deja el campo vacío.');
 if((d.futureRateBps!==null)!==(d.rateChangeDate!==null))throw new UserInputError('La nueva tasa necesita su fecha efectiva, y viceversa.');
 if(d.rateChangeDate && (!d.balanceAsOf||d.rateChangeDate<=d.balanceAsOf))throw new UserInputError('La tasa futura debe entrar en vigor después de la fecha del saldo base.');
}
export function validateDebtPayment(p:DebtPaymentInput,today:string){
 if(!p.id||!validDate(p.date)||p.date>today||cents(p.amountCents)<=0||!['cash','check','debit','bank','other'].includes(p.paymentMethod)||typeof p.applyToBalance!=='boolean')throw new UserInputError('Revisa importe, fecha y método del pago. Un pago de deuda no usa crédito como compra.');
 if(p.cycleDueDate!==null&&!validDate(p.cycleDueDate))throw new UserInputError('Vencimiento del pago no válido.');
 const values=[p.principalCents,p.interestCents,p.feesCents];for(const v of values)if(v!==null&&cents(v)<0)throw new UserInputError('El desglose no puede ser negativo.');
 const known=values.reduce((n,v)=>n+BigInt(v??0),0n);
 if(known>BigInt(p.amountCents)||values.every(v=>v!==null)&&known!==BigInt(p.amountCents))throw new UserInputError('El desglose conocido no puede superar el pago; si está completo debe sumar el importe pagado.');
}
export function minimumRemaining(d:Debt){return d.minimumCents===null?null:cents(Math.min(d.balanceCents,Math.max(0,d.minimumCents-d.cyclePaidCents)));}
export function applicableRate(d:Debt,day:string){return d.rateChangeDate&&d.rateChangeDate<=day?d.futureRateBps:d.annualRateBps;}
export function debtWarnings(d:Debt,today:string){
 if(!d.balanceCents)return ['Saldo registrado liquidado. Confirma el cierre con tu entidad.'];
 const messages:string[]=[];if(d.annualRateBps===null)messages.push('Falta la tasa anual; no se estiman intereses.');
 if(d.minimumCents===null)messages.push('Falta el pago mínimo.');
 if(!d.dueDate)messages.push('Falta el vencimiento.');else if(d.dueDate<today && minimumRemaining(d)!==0)messages.push('Vencimiento registrado atrasado. Confirma el estado; la fecha no se ha movido.');else if(d.dueDate===today&&minimumRemaining(d)!==0)messages.push('Vence hoy.');
 const rate=applicableRate(d,today);
 if(d.rateChangeDate&&d.rateChangeDate<=today)messages.push('La fecha del cambio de APR conocido ya llegó. Confirma la tasa en el nuevo estado y actualiza las condiciones.');
 if(d.minimumCents!==null&&rate!==null&&d.minimumCents<=monthlyInterest(d.balanceCents,rate))messages.push('El mínimo registrado puede no reducir el saldo con la tasa conocida aplicable a esta fecha.');
 return messages;
}
/** Redondeo de medio centavo hacia arriba, APR en puntos básicos; aritmética entera. */
export function monthlyInterest(balance:number,rateBps:number){
 if(cents(balance)<0||!Number.isInteger(rateBps)||rateBps<0||rateBps>100000)throw new UserInputError('Saldo o tasa no válidos.');
 return cents(Number((BigInt(balance)*BigInt(rateBps)+60000n)/120000n));
}
export function addMonths(month:string,count:number):string{
 if(!validMonth(month)||!Number.isInteger(count)||count<0)throw new UserInputError('Mes de simulación no válido.');
 const d=new Date(`${month}-01T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+count);const result=d.toISOString().slice(0,7);
 if(!validMonth(result))throw new UserInputError('La proyección supera el rango de fechas.');return result;
}
/** Escenario mensual: APR/12, mínimos fijos y presupuesto constante con reinversión de mínimos liberados. */
export function project(debts:Debt[],method:Method,extra:Cents,firstMonth:string,maxMonths=600):Projection{
 if(!['snowball','avalanche'].includes(method)||cents(extra)<0||!validMonth(firstMonth)||!Number.isInteger(maxMonths)||maxMonths<1||maxMonths>600)throw new UserInputError('Revisa método, aporte adicional y primer mes.');
 const active=debts.filter(d=>!d.archived&&d.balanceCents>0);
 if(!active.length)throw new UserInputError('Registra una deuda con saldo pendiente para comparar.');
 for(const d of active){
  validateDebt(d,'9999-12-31');
  if(d.annualRateBps===null||d.minimumCents===null)throw new UserInputError(`Completa tasa y mínimo de ${d.name}; los campos desconocidos no se convierten en cero.`);
  if(!d.balanceAsOf||firstMonth<d.balanceAsOf.slice(0,7))throw new UserInputError(`Confirma la fecha del saldo de ${d.name} y elige un mes igual o posterior.`);
 }
 const budget=addAmounts(extra,...active.map(d=>d.minimumCents!));if(!budget)throw new UserInputError('El presupuesto mensual debe ser positivo.');
 const rows:Projection['rows']=[];const balances=new Map(active.map(d=>[d.id,d.balanceCents]));const order:string[]=[];
 let totalInterest=0n,totalPaid=0n,nonReducingMonths=0;
 for(let month=0;month<maxMonths;month++){
  const label=addMonths(firstMonth,month);let interests=0n;const rates=new Map<string,number>();
  for(const d of active){const balance=balances.get(d.id)!;const rate=d.rateChangeDate&&label>=d.rateChangeDate.slice(0,7)?d.futureRateBps!:d.annualRateBps!;rates.set(d.id,rate);const interest=monthlyInterest(balance,rate);interests+=BigInt(interest);balances.set(d.id,addAmounts(balance,interest));}
  let remaining=BigInt(budget),paid=0n;
  for(const d of active){const balance=balances.get(d.id)!;const amount=Math.min(balance,d.minimumCents!);balances.set(d.id,cents(balance-amount));paid+=BigInt(amount);remaining-=BigInt(amount);}
  const sorted=active.filter(d=>balances.get(d.id)!>0).sort((a,b)=>method==='avalanche'?(rates.get(b.id)!-rates.get(a.id)!||a.id.localeCompare(b.id)):(balances.get(a.id)!-balances.get(b.id)!||a.id.localeCompare(b.id)));
  for(const d of sorted){const amount=remaining<BigInt(balances.get(d.id)!)?remaining:BigInt(balances.get(d.id)!);balances.set(d.id,cents(balances.get(d.id)!-Number(amount)));paid+=amount;remaining-=amount;if(!order.includes(d.id)&&amount>0n)order.push(d.id);}
  const outstanding=addAmounts(...balances.values());totalInterest+=interests;totalPaid+=paid;if(paid<=interests&&outstanding>0)nonReducingMonths++;
  rows.push({month:month+1,label,interestCents:cents(Number(interests)),paymentCents:cents(Number(paid)),remainingCents:outstanding});
  if(!outstanding)return {status:'paid',months:month+1,lastMonth:active.every(d=>d.dueDate)?label:null,interestCents:cents(Number(totalInterest)),paidCents:cents(Number(totalPaid)),remainingCents:outstanding,monthlyBudgetCents:budget,nonReducingMonths,order,rows};
 }
 return {status:'limit',months:maxMonths,lastMonth:null,interestCents:cents(Number(totalInterest)),paidCents:cents(Number(totalPaid)),remainingCents:addAmounts(...balances.values()),monthlyBudgetCents:budget,nonReducingMonths,order,rows};
}
export const planSteps=[
 {key:'statements',day:1,title:'Revisar saldos y estados de cuenta'},
 {key:'missing',day:3,title:'Revisar tasas, mínimos y vencimientos faltantes'},
 {key:'compare',day:7,title:'Comparar métodos y evaluar un aporte adicional'},
 {key:'payments',day:14,title:'Revisar el calendario y registrar los pagos realizados'},
 {key:'charges',day:21,title:'Revisar cargos y cambios de tasa'},
 {key:'review',day:30,title:'Comparar saldos y confirmar las próximas fechas'},
] as const;
