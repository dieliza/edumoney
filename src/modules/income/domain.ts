import {UserInputError} from '../../core/errors';
import {cents,addAmounts} from '../../core/money';
export const deductionCategories = [
 {id:'pr-tax',name:'Contribución sobre ingresos de Puerto Rico',kind:'pr_tax'},
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
export type DeductionCategory={id:string;name:string;kind:string};
export type DeductionLine={id:string;categoryId:string;label:string;amountCents:number|null};
export type IncomeStatement={version:1;kind:'paystub'|'check';issuer:string;reference:string;periodStart:string|null;periodEnd:string|null;grossCents:number|null;netCents:number;deductions:DeductionLine[];complete:boolean};
export function statementTotals(p:IncomeStatement){
 const net=cents(p.netCents);if(net<=0)throw new UserInputError('Confirma el importe neto positivo del cheque o talonario.');
 if(p.version!==1||!['paystub','check'].includes(p.kind)||p.issuer.length>240||p.reference.length>100||p.deductions.length>100)throw new UserInputError('Revisa el comprobante de ingreso.');
 if(new Set(p.deductions.map(d=>d.id)).size!==p.deductions.length)throw new UserInputError('Cada deducción debe tener un identificador distinto.');
 for(const d of p.deductions)if(!d.id||!d.categoryId||d.label.length>240||(d.amountCents!==null&&cents(d.amountCents)<0))throw new UserInputError('Revisa cada deducción y su importe no negativo.');
 if(p.grossCents!==null&&cents(p.grossCents)<net)throw new UserInputError('El neto supera el bruto. Revisa si hay reembolsos u otros conceptos; no se adivinan.');
 const known=addAmounts(...p.deductions.map(d=>cents(d.amountCents??0))); // Subtotal conocido, no reemplaza campos desconocidos.
 const allKnown=p.deductions.every(d=>d.amountCents!==null);
 const difference=p.grossCents===null?null:cents(p.grossCents-net-known);
 if(p.complete&&(p.grossCents===null||!allKnown||difference!==0))throw new UserInputError('El desglose completo debe cuadrar: bruto menos todas las deducciones = neto. Revisa campos vacíos y cifras.');
 const pr=p.deductions.filter(d=>d.categoryId==='pr-tax');
 const withholding=pr.length&&pr.every(d=>d.amountCents!==null)?addAmounts(...pr.map(d=>cents(d.amountCents!))):p.complete?cents(0):null;
 return {known,allKnown,difference,withholding};
}
