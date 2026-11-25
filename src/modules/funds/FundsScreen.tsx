import {useLocalSearchParams} from 'expo-router';
import {Screen} from '../../ui/components';
import {useAccountScope,type AccountScope} from '../money/accountScope';
import {fundLabels,type FundKind} from './types';
import {FundTransfers} from './FundTransfers';
export default function FundsScreen(){
 const params=useLocalSearchParams<{scope?:string;kind?:string;mode?:string;fundId?:string;transferId?:string}>(),activeScope=useAccountScope(),scope:AccountScope=params.scope==='business'?'business':params.scope==='personal'?'personal':activeScope;
 const kind:FundKind|undefined=params.kind==='savings'||params.kind==='emergency'||params.kind==='budget'?params.kind:undefined;
 return <Screen title={kind?fundLabels[kind]:'Transferencias'} demo={false} subtitle={scope==='personal'?'Cuenta personal':'Cuenta comercial'}>
 <FundTransfers key={scope+':'+(kind??params.fundId??'all')} scope={scope} kind={kind} fundId={params.fundId} allowTransfer openTransfer={params.mode==='transfer'} transferId={params.transferId}/>
 </Screen>;
}
