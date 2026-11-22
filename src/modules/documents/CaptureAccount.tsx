import {useEffect,useState} from 'react';
import {UserInputError} from '../../core/errors';
import {Choices} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
export type CaptureAccount='personal'|'business';
export function useCaptureAccount(initial:CaptureAccount|''=''){
 const [account,setAccount]=useState<CaptureAccount|''>(initial),[holder,setHolder]=useState(''),[holders,setHolders]=useState<{id:string;name:string}[]>([]);
 useEffect(()=>{if(account!=='business')return;let live=true;void getMoneyStore().then(store=>store.read(db=>db.getAllAsync<{id:string;name:string}>("SELECT id,legal_name AS name FROM business_holders WHERE legal_form IN ('individual','llc') ORDER BY rowid"))).then(rows=>{if(live){setHolders(rows);setHolder(previous=>rows.some(h=>h.id===previous)?previous:rows.length===1?rows[0].id:'');}}).catch(()=>{if(live){setHolders([]);setHolder('');}});return()=>{live=false;};},[account]);
 function confirmed(){if(!account)throw new UserInputError('Elige Personal o Comercial.');if(account==='business'&&!holder)throw new UserInputError('Selecciona tu DBA o LLC en Negocio.');return{context:account,...(account==='business'?{businessHolderId:holder}:{})};}
 const selector=<><Choices<CaptureAccount|''> compact label="Cuenta" presentation="tabs" required value={account} options={[[ 'personal','Personal'],['business','Comercial']]} onChange={setAccount}/>{account==='business'&&holders.length>1?<Choices label="DBA / LLC" value={holder} options={[[ '', 'Seleccionar'],...holders.map(h=>[h.id,h.name] as const)]} onChange={setHolder}/>:null}</>;
 return {account,selector,confirmed};
}
