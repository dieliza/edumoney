import type {AccountScope} from '../money/accountScope';
import type {LedgerMovement} from '../money/types';
export type FundKind='savings'|'emergency'|'budget';
export const fundLabels={savings:'Ahorros',emergency:'Fondo de emergencia',budget:'Presupuesto mensual'} as const;
export const locationKinds=[['bank','Banco'],['cooperative','Cooperativa'],['cash','Efectivo en casa'],['digital','Cuenta digital'],['other','Otra ubicación']] as const;
export type LocationKind=typeof locationKinds[number][0];
export type Cadence='weekly'|'biweekly'|'monthly';
export interface MoneyLocation {id:string;name:string;kind:LocationKind;version:number}
export interface Fund {id:string;scope:AccountScope;kind:FundKind;name:string;goalId:string|null;goalVersion?:number;targetCents:number;contributionCents:number;cadence:Cadence;targetDate:string|null;locationId:string|null;budgetMonth:string|null;categoryId:string|null;archived:boolean;version:number;createdAt:string;openingCents:number;legacyCents:number;balanceCents:number}
export type FundInput=Pick<Fund,'id'|'scope'|'kind'|'name'|'goalId'|'targetCents'|'contributionCents'|'cadence'|'targetDate'|'locationId'|'budgetMonth'|'categoryId'>;
export interface FundTransfer {id:string;scope:AccountScope;fromId:string|null;toId:string|null;amountCents:number;date:string;description:string;version:number;sequence:number;createdAt:string;reversedAt:string|null;reversalReason:string|null}
export type TransferInput=Pick<FundTransfer,'id'|'scope'|'fromId'|'toId'|'amountCents'|'date'|'description'>;
export interface FundEvent {entityId:string;action:string;beforeJson:string;reason:string;recordedAt:string}
export interface FundData {funds:Fund[];transfers:FundTransfer[];locations:MoneyLocation[];movements:LedgerMovement[];legacy:LegacyAllocation[];events:FundEvent[]}
export interface LegacyAllocation {movementId:string;fundId:string;amountCents:number;date:string}
export interface FundsSummary {available:number;total:number;savings:number;emergency:number;budget:number;funds:Fund[];asOf:string;scope:AccountScope}
