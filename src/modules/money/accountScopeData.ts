import {scopedMovements} from './scopedMovements';
import {useEffect,useState} from 'react';
import {onDataCommitted} from '../../storage/changeEvents';
import {BusinessLedgerStore} from '../business/ledgerStore';
import type {MoneyStore} from './store';
import type {LedgerMovement,Snapshot} from './types';
import type {AccountScope} from './accountScope';
export type ScopedMovement=LedgerMovement&{scopeOriginal?:LedgerMovement};
export function originalScopeMovement(m:LedgerMovement):LedgerMovement{return (m as ScopedMovement).scopeOriginal??m;}
export async function accountSnapshot(store:MoneyStore,scope:AccountScope):Promise<Snapshot>{
 if(scope==='personal')return store.snapshot(true);
 const [raw,business]=await Promise.all([store.snapshot(),new BusinessLedgerStore(store).snapshot()]);
 return{...raw,movements:scopedMovements(raw.movements,business.entries).filter(m=>m.useKind==='business'&&!m.deletedAt)};
}
export function useAccountHistory(store:MoneyStore|null,scope:AccountScope,enabled:boolean){
 const [result,setResult]=useState<{store:MoneyStore;scope:AccountScope;data:Snapshot}|null>(null);
 useEffect(()=>{if(!store||!enabled)return;let live=true,request=0;const refresh=()=>{const ticket=++request;void accountSnapshot(store,scope).then(data=>{if(live&&ticket===request)setResult({store,scope,data});}).catch(()=>{if(live&&ticket===request)setResult(null);});};const unsubscribe=onDataCommitted(refresh);refresh();return()=>{live=false;unsubscribe();};},[store,scope,enabled]);
 return enabled&&result?.store===store&&result.scope===scope?result.data:null;
}
