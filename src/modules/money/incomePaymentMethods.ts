import {UserInputError} from '../../core/errors';
import {paymentLabels,type PaymentMethod} from './types';
import {entryMethods} from './entryContext';
import type {MoneyStore} from './store';
export type CustomIncomePayment=`custom:${string}`;
export type IncomePaymentMethod=PaymentMethod|CustomIncomePayment;
export type IncomeMethod={value:CustomIncomePayment;label:string};
type Ledger=Pick<MoneyStore,'read'|'transaction'>;
export function incomeMethodName(name:string){const clean=name.normalize('NFC').trim().replace(/\s+/g,' ');if(!clean||[...clean].length>60||/[\p{Cc}\p{Cf}]/u.test(clean))throw new UserInputError('Escribe un nombre de método de pago de 1 a 60 caracteres.');return clean;}
export function isCustomIncomePayment(value:unknown):value is CustomIncomePayment{if(typeof value!=='string'||!value.startsWith('custom:'))return false;try{return incomeMethodName(value.slice(7))===value.slice(7);}catch{return false;}}
export function paymentMethodLabel(value:string|null|undefined){return isCustomIncomePayment(value)?value.slice(7):paymentLabels[value as PaymentMethod]??value??'Sin especificar';}
export async function customIncomeMethods(store:Ledger):Promise<IncomeMethod[]>{return store.read(async db=>{const table=await db.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='income_payment_methods'");if(!table)return [];const rows=await db.getAllAsync<IncomeMethod>('SELECT value,label FROM income_payment_methods ORDER BY label');return rows.filter(row=>isCustomIncomePayment(row.value)&&row.value.slice(7)===row.label);});}
export async function createIncomeMethod(store:Ledger,name:string):Promise<IncomeMethod>{const label=incomeMethodName(name),fold=(v:string)=>v.toLocaleLowerCase('es');if([...Object.values(paymentLabels),...entryMethods('income').map(([,text])=>text)].some(text=>fold(text)===fold(label)))throw new UserInputError('Ese método de pago ya está disponible.');
return store.transaction(async db=>{await db.execAsync('CREATE TABLE IF NOT EXISTS income_payment_methods(value TEXT PRIMARY KEY NOT NULL,label TEXT NOT NULL,created_at TEXT NOT NULL);');const rows=await db.getAllAsync<IncomeMethod>('SELECT value,label FROM income_payment_methods');const existing=rows.find(row=>fold(row.label)===fold(label));if(existing)return existing;const created:IncomeMethod={value:`custom:${label}`,label};await db.runAsync('INSERT INTO income_payment_methods(value,label,created_at) VALUES(?,?,?)',created.value,label,new Date().toISOString());return created;});}
