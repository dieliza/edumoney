import type { LedgerMovement } from '../money/types';
export const goalKinds = [['savings','Ahorro'],['emergency','Fondo de emergencia'],['home','Vivienda'],['vehicle','Vehículo'],['travel','Vacaciones'],['education','Estudios'],['retirement','Retiro'],['other','Otra meta']] as const;
export type GoalKind = typeof goalKinds[number][0];
export interface GoalInput {id:string;name:string;kind:GoalKind;targetCents:number;openingCents:number;desiredDate:string|null;cadence:'weekly'|'monthly'}
export interface Goal extends GoalInput {version:number;archived:boolean;savedCents:number}
export interface Contribution {id:string;goalId:string;movementId:string;amountCents:number;date:string;createdMovement:boolean;reversedAt:string|null;reversalReason:string|null}
export interface GoalEvent {goalId:string;reason:string;recordedAt:string}
export interface GoalSnapshot {goals:Goal[];contributions:Contribution[];events:GoalEvent[];movements:LedgerMovement[]}
export interface ContributionInput {id:string;goalId:string;expectedVersion:number;amountCents:number;date:string;paymentMethod:string;existingMovementId:string|null;confirmSimilar:boolean}
