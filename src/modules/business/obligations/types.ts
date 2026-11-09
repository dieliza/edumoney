import type { rateLabels,providerLabels,reliefLabels } from './catalog';
import type { BusinessSnapshot } from '../types';
export type Answer='yes'|'no'|'pending';
export interface SUTOffer {
 id:string;holderId:string;projectId:string|null;name:string;kind:'product'|'service'|'subscription'|'membership';
 nature:string;channel:'direct'|'website'|'marketplace'|'pending';customer:'consumer'|'business'|'mixed'|'pending';
 destination:'pr'|'outside'|'pending';municipality:string;collectorCertificate:Answer;
 classificationConfirmed:Answer;classificationReference:string;rate: keyof typeof rateLabels;
 marketplaceConfirmed:Answer;marketplaceWaiver:string;volumeReference:string;validFrom:string;validTo:string|null;
}
export interface SavedOffer {offer:SUTOffer;version:number;updatedAt:string}
export interface SUTCollection {
 id:string;holderId:string;offerId:string;date:string;baseCents:number|null;collectedCents:number|null;
 stateCents:number|null;municipalCents:number|null;actor:'merchant'|'marketplace'|'pending';
 entryId:string|null;reference:string;note:string;
}
export interface SavedCollection extends SUTCollection {offerSnapshot:SUTOffer;voidedAt:string|null;voidReason:string}
export interface Provider {id:string;name:string;reference:string;classification:keyof typeof providerLabels;notes:string;version:number}
export interface Relief {id:string;providerId:string;kind:keyof typeof reliefLabels;validFrom:string;validTo:string|null;reference:string;documentId:string|null}
export interface ContractorPayment {
 id:string;holderId:string;providerId:string;date:string;servicesCents:number|null;ivuCents:number|null;reimbursedCents:number|null;
 actualWithheldCents:number|null;actualNetCents:number|null;
 scope:'ordinary'|'statutory_exempt'|'excluded'|'pending'|'special';
 reliefStatus:'none'|'pending'|'document';reliefId:string|null;entryId:string|null;note:string;
}
export interface SavedPayment extends ContractorPayment {sequence:number;voidedAt:string|null;voidReason:string;calculationAtSave:string;providerAtSave:Provider}
export type ObligationForm='SC2915'|'4806SP1'|'4806SP'|'4806SP2'|'deposit'|'local_ivu';
export interface ObligationRecord {
 id:string;holderId:string;providerId:string|null;flow:'ivu'|'contractors';kind:'remittance'|'filing';
 form:ObligationForm;period:string;municipality:string;scope:'state'|'municipal'|'combined'|'services';
 amountCents:number|null;status:'pending'|'confirmed'|'not_applicable';date:string|null;reference:string;note:string;
 dueDate:string|null;dueSource:string;
}
export interface SavedObligation extends ObligationRecord {voidedAt:string|null;voidReason:string}
export interface ObligationsSnapshot extends BusinessSnapshot {
 offers:SavedOffer[];collections:SavedCollection[];providers:Provider[];reliefs:Relief[];payments:SavedPayment[];obligations:SavedObligation[];
 entries:{id:string;holderId:string;kind:string;date:string;grossCents:number|null;ivuCents:number|null;stale:boolean;deletedAt:string|null;description:string}[];
 documents:{id:string;description:string;deletedAt:string|null}[];
}
