export const iraTypes=[['traditional','Tradicional federal'],['roth','Roth federal'],['pr_deductible','IRA deducible de Puerto Rico'],['pr_nondeductible','IRA no deducible de Puerto Rico']] as const;
export type IraType=typeof iraTypes[number][0];
export interface IraAccount{id:string;institution:string;type:IraType;opened:string;initialCents:number;version:number}
export interface IraEvent{id:string;accountId:string;kind:'yield'|'correction';amountCents:number;date:string;reason:string;reversesId:string|null;createdAt:string}
export interface IraSchedule{id:string;accountId:string;amountCents:number;cadence:'weekly'|'biweekly'|'monthly'|'yearly';nextDate:string;active:number}
export const restrictedMeaning='Este dinero está destinado principalmente a tu retiro y no forma parte del dinero disponible para gastos cotidianos. Los retiros anticipados pueden estar sujetos a restricciones, penalidades y obligaciones contributivas, según el tipo de IRA, la legislación aplicable y las condiciones de tu institución financiera. Consulta con tu institución antes de realizar un retiro.';
