import type { LedgerMovement } from '../money/types';
import type { StoredDocument } from '../documents/types';
export type ReviewStatus='received'|'pending'|'corrected'|'not_applicable';
export type Classification='salary'|'other_income'|'expense_review'|'transfer'|'loan'|'debt_payment'|'savings'|'pending';
export type Use='personal'|'business'|'mixed'|'unknown';
export interface TaxProfile {year:number;residence:'full_year_pr'|'partial_pr'|'other'|'unknown';filingStatus:'single'|'married'|'other'|'unknown';incomeSources:string;notes:string;version:number}
export interface TaxEntry {id:string;year:number;movementId:string|null;documentId:string|null;classification:Classification;useKind:Use;businessBps:number|null;status:ReviewStatus;notes:string;sourceVersion:number|null;version:number}
export interface Statement {id:string;year:number;formType:string;payer:string;reference:string;grossCents:number|null;withheldCents:number|null;netCents:number|null;status:ReviewStatus;documentId:string|null;documentVersion:number|null;supersedesId:string|null;notes:string;version:number}
export interface StatementLink {statementId:string;movementId:string;movementVersion:number}
export interface TaxSnapshot {year:number;profile:TaxProfile|null;entries:TaxEntry[];statements:Statement[];links:StatementLink[];movements:LedgerMovement[];documents:StoredDocument[]}
export const statusOptions=[['pending','Pendiente'],['received','Recibido'],['corrected','Corregido'],['not_applicable','No aplica']] as const;
export const classificationOptions=[['pending','Por clasificar'],['salary','Ingreso salarial'],['other_income','Otro ingreso'],['expense_review','Gasto para revisión'],['transfer','Transferencia propia'],['loan','Préstamo'],['debt_payment','Pago de deuda'],['savings','Aportación a meta']] as const;
export const useOptions=[['unknown','Uso pendiente'],['personal','Personal'],['business','Comercial'],['mixed','Mixto']] as const;
