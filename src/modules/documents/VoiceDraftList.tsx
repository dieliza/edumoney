import {paymentLabels,type PaymentMethod} from '../money/types';
import {useRef,useState} from 'react';
import {View} from 'react-native';
import {ActionButton,Body} from '../../ui/components';
import {Field,ErrorNotice,Choices} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
import {localToday,formatMoney} from '../money/domain';
import {classifyVoiceEntry} from './voiceEntry';
import {saveVoiceEntry} from './saveVoiceEntry';
import type {DocumentStore} from './store';
import type {DocumentsSnapshot,StoredDocument} from './types';
import {newId} from '../../core/id';
import {userMessage} from '../../core/errors';
export function VoiceDraftList({store,data,reload}:{store:DocumentStore;data:DocumentsSnapshot;reload():Promise<void>}){
 const [edit,setEdit]=useState<{document:StoredDocument;text:string;saveId:string}|null>(null),[remove,setRemove]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[limit,setLimit]=useState(30),[payment,setPayment]=useState<PaymentMethod|''>('');const working=useRef(false);
 const rows=data.documents.filter(d=>d.source==='voice'&&d.kind==='note'&&!d.deletedAt&&d.status!=='corrected'&&!d.supersedesId);
 async function task(fn:()=>Promise<void>){if(working.current)return;working.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(userMessage(e));}finally{working.current=false;setBusy(false);}}
 async function open(d:StoredDocument){await task(async()=>{const detail=await store.detail(d.id);setPayment('');setEdit({document:d,text:detail.rawText?.text??d.notes,saveId:newId()});setRemove(null);});}
 async function save(){if(!edit)return;if(proposal?.needsPayment&&!proposal.method){setError('Selecciona el método para registrar este gasto o ingreso.');return;}await task(async()=>{const ledger=await getMoneyStore();const p=await saveVoiceEntry({documents:store,ledger},edit.text,edit.saveId,localToday(),newId,{id:edit.document.id,version:edit.document.version},payment||undefined);setEdit(null);setNotice(p.ready?'Movimiento guardado. El dictado salió de pendientes.':'Cambios guardados. El dictado sigue pendiente.');await reload();});}
 const proposal=edit?classifyVoiceEntry(edit.text,data.categories,localToday(),payment||undefined):null;
 return <View style={{gap:16}}><Body>Aquí están los dictados pendientes. Los ingresos y gastos confirmados quedan en Historial.</Body><ErrorNotice message={error}/>{notice?<Body>{notice}</Body>:null}
 {!rows.length?<Body>No tienes dictados pendientes.</Body>:null}
 {rows.slice(0,limit).map(d=><View key={d.id} style={{gap:8,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#699B9B'}}><Body style={{fontWeight:'700',fontSize:17}}>{d.description}</Body>
 {edit?.document.id===d.id?<><Field label="Editar dictado" multiline maxLength={20000} value={edit.text} onChangeText={text=>{if(!busy){setPayment('');setEdit({...edit,text,saveId:newId()});}}}/>{proposal?.needsPayment?<Choices label="Cómo pagaste o recibiste el dinero" value={payment} options={[['','Seleccionar método'],...Object.entries(paymentLabels).filter(([key])=>proposal.kind==='expense'||key!=='credit') as [PaymentMethod,string][]]} onChange={value=>{setPayment(value as PaymentMethod|'');setError('');}}/>:null}<Body>{proposal?.ready?`${proposal.kind==='income'?'Ingreso':'Gasto'} · ${formatMoney(proposal.amountCents!)} · ${proposal.category?.name??'Dictado por voz'} · ${proposal.date}`:`Pendiente: ${proposal?.reasons.join(' ')}`}</Body><ActionButton title={busy?'Guardando…':'Guardar'} onPress={()=>void save()}/>{!busy?<ActionButton secondary title="Cancelar edición" onPress={()=>setEdit(null)}/>:null}</>:<View style={{flexDirection:'row',gap:12,flexWrap:'wrap'}}><ActionButton secondary title="Editar" onPress={()=>void open(d)}/><ActionButton secondary title="Borrar" onPress={()=>{if(!busy)setRemove(d.id);}}/></View>}
 {remove===d.id?<><Body>¿Borrar este dictado pendiente? No cambia tus movimientos.</Body><ActionButton title="Borrar dictado" onPress={()=>void task(async()=>{await store.deleteVoiceNote(d.id,d.version);setRemove(null);if(edit?.document.id===d.id)setEdit(null);await reload();setNotice('Dictado retirado de pendientes.');})}/><ActionButton secondary title="Cancelar" onPress={()=>setRemove(null)}/></>:null}</View>)}
 {rows.length>limit?<ActionButton secondary title="Ver más dictados" onPress={()=>setLimit(limit+30)}/>:null}</View>;
}
