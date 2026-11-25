import {FundSheet,FundBody,FundError} from './FundSheet';
import {TransactionLink} from '../money/TransactionFormUI';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,View} from 'react-native';
import {ActionButton,Body,Card,SectionHeading} from '../../ui/components';
import {MeaningHelp} from '../../ui/MeaningHelp';
import {ErrorNotice} from '../money/fields';
import {userMessage} from '../../core/errors';
import {formatMoney,localToday} from '../money/domain';
import type {AccountScope} from '../money/accountScope';
import {fundSummary} from './domain';
import {transferHistory,transferEndpoint} from './history';
import type {FundKind,FundTransfer} from './types';
import {TransferEditor} from './TransferEditor';
import {useFunds} from './useFunds';
export function FundTransfers({scope,kind,fundId,month,allowTransfer=false,openTransfer=false,transferId}:{scope:AccountScope;kind?:FundKind;fundId?:string;month?:string;allowTransfer?:boolean;openTransfer?:boolean;transferId?:string}){
 const {data,store,error:loadError,reload}=useFunds(),[editing,setEditing]=useState(false),[editor,setEditor]=useState<{initial?:FundTransfer}|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busyId,setBusyId]=useState(''),[limit,setLimit]=useState(30);const deleting=useRef(false),opened=useRef('');
 const calculation=useMemo(()=>{try{return {summary:data?fundSummary(data,scope,localToday()):null,error:''};}catch(e){return {summary:null,error:userMessage(e)};}},[data,scope]);
 const rows=useMemo(()=>data?transferHistory(data.transfers,data.funds,scope,{kind,fundId,month}):[],[data,scope,kind,fundId,month]);
 useEffect(()=>{if(!data||!store)return;const key=transferId??(openTransfer?'new':'');if(!key||opened.current===key)return;opened.current=key;Promise.resolve().then(()=>{if(transferId){const row=data.transfers.find(t=>t.scope===scope&&t.id===transferId);if(row){setEditor({initial:row});setEditing(false);}}else setEditor({});});},[data,store,scope,openTransfer,transferId]);
 async function saved(){await reload();setNotice('Transferencia guardada. Tus ingresos y gastos no cambian.');}
 async function remove(t:FundTransfer){if(!store||deleting.current)return;deleting.current=true;setBusyId(t.id);setError('');setNotice('');try{await store.reverse(t.id,t.version,'Eliminada desde Editar historiales');await reload();setNotice('Transferencia eliminada de los balances. Se conserva su historial.');}catch(e){setError(userMessage(e));}finally{deleting.current=false;setBusyId('');}}
 return <View style={{gap:12}}>
 <ErrorNotice message={loadError||calculation.error||error}/>{notice?<View accessibilityLiveRegion="polite"><Body canvas>{notice}</Body></View>:null}
 {allowTransfer?<ActionButton title="Transferir fondos" icon="swap-horizontal" testID="funds-new-transfer" onPress={()=>setEditor({})}/>:null}
 <SectionHeading title="Historial de transferencias"/><MeaningHelp canvas label="Historial de transferencias"/>
 {!data&&!loadError?<ActivityIndicator accessibilityLabel="Cargando historial de transferencias"/>:null}
 {data&&!rows.length?<Body canvas>No hay transferencias registradas en esta sección{month?' para este mes':''}.</Body>:null}
 {rows.slice(0,limit).map(t=><Card key={t.id}><Body style={{fontWeight:'700'}}>{transferEndpoint(t.fromId,data?.funds??[])} → {transferEndpoint(t.toId,data?.funds??[])}</Body><Body>{t.date} · {formatMoney(t.amountCents)} · {t.reversedAt?'Eliminada / revertida':'Confirmada'}</Body>{t.description?<Body>{t.description}</Body>:null}{t.reversedAt?<Body muted>{t.reversalReason}</Body>:null}</Card>)}
 {rows.length>limit?<ActionButton title="Ver más transferencias" secondary onPress={()=>setLimit(v=>v+30)}/>:null}
 <View style={{alignItems:'flex-end'}}><TransactionLink title="Editar historiales" testID="fund-history-edit" disabled={!data} onPress={()=>setEditing(true)}/></View>
 {editing?<FundSheet title="Editar historiales" close={()=>setEditing(false)} busy={!!busyId}>
 <FundError message={error}/>{notice?<FundBody>{notice}</FundBody>:null}
 {!rows.length?<FundBody>No hay transferencias en este historial.</FundBody>:null}
 {rows.slice(0,limit).map(t=><View key={t.id} style={{gap:6,paddingVertical:10}}><FundBody style={{fontWeight:'700'}}>{transferEndpoint(t.fromId,data?.funds??[])} → {transferEndpoint(t.toId,data?.funds??[])} · {formatMoney(t.amountCents)}</FundBody><FundBody muted>{t.date} · {t.reversedAt?'Eliminada / revertida':'Confirmada'}</FundBody>{t.description?<FundBody>{t.description}</FundBody>:null}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><TransactionLink title="Editar" testID={`fund-transfer-edit-${t.id}`} onPress={()=>{setEditing(false);setEditor({initial:t});}}/>{!t.reversedAt?<ActionButton title={busyId===t.id?'Eliminando…':'Eliminar'} icon="trash-outline" testID={`fund-transfer-delete-${t.id}`} secondary onPress={()=>void remove(t)}/>:null}</View></View>)}
 {rows.length>limit?<TransactionLink title="Ver más transferencias" onPress={()=>setLimit(v=>v+30)}/>:null}
 </FundSheet>:null}
 {editor&&store&&calculation.summary?<TransferEditor key={editor.initial?.id??'new'} store={store} scope={scope} funds={calculation.summary.funds} availableCents={calculation.summary.available} {...editor} close={()=>setEditor(null)} saved={saved}/>:null}
 </View>;
}
