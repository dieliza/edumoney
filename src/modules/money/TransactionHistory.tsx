import Ionicons from '@expo/vector-icons/Ionicons';
import {userMessage} from '../../core/errors';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,View} from 'react-native';
import {Body} from '../../ui/components';
import {useTheme} from '../../design/ThemeProvider';
import {VoiceDraftList} from '../documents/VoiceDraftList';
import {getDocumentStore} from '../documents/localStore';
import type {DocumentStore} from '../documents/store';
import type {DocumentsSnapshot} from '../documents/types';
import type {MoneyStore} from './store';
import type {LedgerMovement,Snapshot} from './types';
import {formatMoney} from './domain';
import {ErrorNotice} from './fields';
export type TransactionHistoryKind='expense'|'income'|'voice';
export function TransactionHistory({kind,store,onEdit,saved}:{kind:TransactionHistoryKind;store:MoneyStore;onEdit(m:LedgerMovement):void;saved():Promise<void>}){
 const deleting=useRef(false);
 const [busyId,setBusyId]=useState<string|null>(null),[notice,setNotice]=useState('');
 const {colors}=useTheme(),[data,setData]=useState<Snapshot|null>(null),[documents,setDocuments]=useState<{store:DocumentStore;data:DocumentsSnapshot}|null>(null),[error,setError]=useState(''),[limit,setLimit]=useState(50);
 const fetch=useCallback(async()=>{if(kind==='voice'){const s=await getDocumentStore();return {documents:{store:s,data:await s.snapshot()},data:null};}return {documents:null,data:await store.snapshot(true)};},[kind,store]);
 const reload=async()=>{await saved();const result=await fetch();setData(result.data);setDocuments(result.documents);};
 useEffect(()=>{let live=true;void fetch().then(result=>{if(live){setData(result.data);setDocuments(result.documents);}}).catch(()=>{if(live)setError('No pudimos cargar este historial. Vuelve a abrirlo.');});return()=>{live=false;};},[fetch]);
 async function remove(m:LedgerMovement){if(deleting.current)return;deleting.current=true;setBusyId(m.id);setError('');setNotice('');try{await store.deleteFromHistory(m);setData(current=>current?{...current,movements:current.movements.filter(row=>row.id!==m.id)}:current);setNotice('Transacción borrada. Puedes restaurarla desde Eliminados.');try{await reload();}catch{setError('La transacción se borró. Vuelve a abrir el historial para actualizarlo.');}}catch(e){setError(userMessage(e));}finally{deleting.current=false;setBusyId(null);}}
 if(error&&!data&&!documents)return <ErrorNotice message={error}/>;
 if(kind==='voice')return documents?<VoiceDraftList store={documents.store} data={documents.data} reload={reload}/>:<ActivityIndicator accessibilityLabel="Cargando Mis dictados"/>;
 if(!data)return <ActivityIndicator accessibilityLabel="Cargando historial"/>;
 const rows=data.movements.filter(m=>!m.deletedAt&&m.kind===kind);
 return <View style={{gap:12}}><ErrorNotice message={error}/>{notice?<View accessibilityLiveRegion="polite"><Body>{notice}</Body></View>:null}<Body style={{fontWeight:'800',fontSize:18}}>Historial de {kind==='expense'?'gastos':'ingresos'}</Body>{!rows.length?<Body>No hay {kind==='expense'?'gastos':'ingresos'} registrados.</Body>:null}
 {rows.slice(0,limit).map(m=><View key={m.id} style={{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderColor:colors.line}}><View style={{flex:1,gap:4}}><Body style={{fontWeight:'700'}}>{m.description||data.categories.find(c=>c.id===m.categoryId)?.name||'Sin descripción'} · {formatMoney(m.amountCents)}</Body><Body muted style={{fontSize:13}}>{m.date} · {data.categories.find(c=>c.id===m.categoryId)?.name??'Sin categoría'}</Body></View>{kind==='expense'?<Pressable testID={`history-delete-${m.id}`} accessibilityRole="button" accessibilityLabel={`Borrar gasto: ${m.description||'Sin descripción'} de ${formatMoney(m.amountCents)}`} accessibilityState={{disabled:busyId!==null,busy:busyId===m.id}} disabled={busyId!==null} onPress={()=>void remove(m)} style={{width:44,minHeight:44,alignItems:'center',justifyContent:'center'}}>{busyId===m.id?<ActivityIndicator accessibilityLabel="Borrando gasto"/>:<Ionicons name="trash-outline" size={23} color="#B52C48"/>}</Pressable>:null}<Pressable accessibilityRole="button" accessibilityLabel={`Editar ${m.description||'transacción'} de ${formatMoney(m.amountCents)}`} onPress={()=>onEdit(m)} style={{minHeight:44,paddingHorizontal:10,justifyContent:'center'}}><Body style={{color:colors.primary,fontWeight:'700'}}>Editar</Body></Pressable></View>)}
 {rows.length>limit?<Pressable accessibilityRole="button" onPress={()=>setLimit(limit+50)} style={{minHeight:44,justifyContent:'center'}}><Body>Ver más ({Math.min(limit,rows.length)} de {rows.length})</Body></Pressable>:null}</View>;
}
