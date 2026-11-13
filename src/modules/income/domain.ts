import {calculateDeduction,type AppliedCalculation} from './calculation';
import {UserInputError} from '../../core/errors';
import {cents,addAmounts} from '../../core/money';
export const deductionCategories = [
 {id:'pr-tax',name:'Contribución sobre ingresos de Puerto Rico',kind:'pr_tax'},
 {id:'pr-services',name:'Retención por servicios profesionales (PR)',kind:'pr_tax'},
 {id:'federal-tax',name:'Contribución federal sobre ingresos (si aparece)',kind:'federal_tax'},
 {id:'social-security',name:'Seguro Social',kind:'social_security'},
 {id:'medicare',name:'Medicare',kind:'medicare'},
 {id:'additional-medicare',name:'Medicare adicional (si aparece)',kind:'medicare'},
 {id:'sinot',name:'SINOT',kind:'other'},
 {id:'medical',name:'Plan médico',kind:'other'},
 {id:'dental',name:'Plan dental',kind:'other'},
 {id:'life',name:'Seguro de vida',kind:'other'},
 {id:'retirement',name:'Retiro / 401(k)',kind:'other'},
 {id:'asume',name:'ASUME / pensión alimentaria',kind:'other'},
 {id:'union',name:'Cuota de unión',kind:'other'},
 {id:'loan',name:'Descuento de préstamo',kind:'other'},
 {id:'other',name:'Otra deducción',kind:'other'},
] as const;
export type DeductionCategory={id:string;name:string;kind:string;rule?:import('./calculation').DeductionRule};
export type DeductionLine={id:string;categoryId:string;label:string;amountCents:number|null;calculation?:AppliedCalculation};
export type IncomeStatement={version:1;kind:'paystub'|'check';issuer:string;reference:string;periodStart:string|null;periodEnd:string|null;grossCents:number|null;netCents:number;earnings?:import('./paystubTable').RecognizedEarning[];deductions:DeductionLine[];totalDeductionsCents?:number|null;complete:boolean};
export function statementTotals(p:IncomeStatement){
 if(p.earnings){if(p.earnings.length>100)throw new UserInputError('Revisa las filas de ingresos.');for(const r of p.earnings){if(r.code.length>60||[r.rate,r.hours,r.amount].some(v=>v.length>30||v!==''&&!/^\d+(?:\.\d{1,6})?$/.test(v)))throw new UserInputError('Revisa códigos, tarifas, horas e importes del desglose.');}}
 const net=cents(p.netCents);if(net<=0)throw new UserInputError('Confirma el importe neto positivo del cheque o talonario.');
 if(p.version!==1||!['paystub','check'].includes(p.kind)||p.issuer.length>240||p.reference.length>100||p.deductions.length>100)throw new UserInputError('Revisa el comprobante de ingreso.');
 if(new Set(p.deductions.map(d=>d.id)).size!==p.deductions.length)throw new UserInputError('Cada deducción debe tener un identificador distinto.');
 for(const d of p.deductions)if(!d.id||!d.categoryId||d.label.length>240||(d.amountCents!==null&&cents(d.amountCents)<0))throw new UserInputError('Revisa cada deducción y su importe no negativo.');
 if(p.grossCents!==null&&cents(p.grossCents)<net)throw new UserInputError('El neto supera el bruto. Revisa si hay reembolsos u otros conceptos; no se adivinan.');
 const known=addAmounts(...p.deductions.map(d=>cents(d.amountCents??0))); // Subtotal conocido, no reemplaza campos desconocidos.
 const allKnown=p.deductions.every(d=>d.amountCents!==null);
 if(p.totalDeductionsCents!==undefined&&p.totalDeductionsCents!==(allKnown?known:null))throw new UserInputError('El total guardado de deducciones no coincide con el desglose.');
 const difference=p.grossCents===null?null:cents(p.grossCents-net-known);
 if(p.complete&&(p.grossCents===null||!allKnown||difference!==0))throw new UserInputError('El desglose completo debe cuadrar: bruto menos todas las deducciones = neto. Revisa campos vacíos y cifras.');
 for(const d of p.deductions)if(d.calculation){const c=d.calculation;const expected=calculateDeduction(c.rule,p.grossCents,c.rule.base==='threshold'?cents((c.priorCents??0)-(c.rule.openingCents??0)):0);if(expected.amountCents!==c.amountCents||expected.baseCents!==c.baseCents||expected.grossCents!==c.grossCents||expected.priorCents!==c.priorCents||d.amountCents!==c.amountCents)throw new UserInputError('La deducción calculada no coincide con su regla, base o importe.');}
 const pr=p.deductions.filter(d=>d.categoryId==='pr-tax'||d.categoryId==='pr-services');
 const withholding=pr.length&&pr.every(d=>d.amountCents!==null)?addAmounts(...pr.map(d=>cents(d.amountCents!))):p.complete?cents(0):null;
 return {known,allKnown,difference,withholding};
}
