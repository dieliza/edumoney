import {isVoicePlaceholder} from './categoryLabels';
import {paymentLabels,type Category,type PaymentMethod} from './types';
export type EntryDirection='income'|'expense';
export function entryCategories(categories:Category[],direction:EntryDirection,current=''){return categories.filter(c=>c.kind===direction&&(!c.archived||c.id===current)&&(!isVoicePlaceholder(c.name)||c.id===current));}
export function entryMethods(direction:EntryDirection):[PaymentMethod,string][]{return direction==='income'?[['cash','Efectivo recibido'],['check','Cheque recibido'],['debit','Cobro con tarjeta de débito'],['bank','Transferencia o depósito recibido'],['other','Otro medio de cobro']]:Object.entries(paymentLabels) as [PaymentMethod,string][];}
export function methodForDirection(value:string,direction:EntryDirection):PaymentMethod|''{return entryMethods(direction).some(([key])=>key===value)?value as PaymentMethod:'';}
