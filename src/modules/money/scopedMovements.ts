import {cents} from '../../core/money';
import {commercialAmount} from '../business/ledgerDomain';
import type {LedgerMovement} from './types';
export interface ScopeEntry {movementId:string;movementVersion:number;kind:'income'|'expense';useKind:'personal'|'business'|'mixed'|'pending';businessBps:number|null}
export type ScopeMovement=LedgerMovement&{scopeOriginal?:LedgerMovement};
/** Read-only shares; retain the original so an editor never saves a partial amount. */
export function scopedMovements(originals:LedgerMovement[],entries:ScopeEntry[]):ScopeMovement[]{
 const byId=new Map(entries.map(e=>[e.movementId,e]));
 return originals.flatMap<ScopeMovement>(m=>{const e=byId.get(m.id);
  if(e&&e.movementVersion===m.version&&e.kind===m.kind){const business=commercialAmount({...e,amountCents:m.amountCents});if(business!==null){const personal=m.amountCents-business;return [...(business?[{...m,useKind:'business' as const,amountCents:cents(business),scopeOriginal:m}]:[]),...(personal?[{...m,useKind:'personal' as const,amountCents:cents(personal),scopeOriginal:m}]:[])];}}
  if(m.useKind==='business'||e?.useKind==='business')return e?[]:[{...m,useKind:'business' as const}];
  return [{...m,useKind:'personal' as const,scopeOriginal:m}];
 });
}
