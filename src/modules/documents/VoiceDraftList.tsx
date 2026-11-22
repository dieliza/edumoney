import {useCaptureAccount} from './CaptureAccount';
import {announceSaved} from '../../ui/saveFeedback';
import {notifyInboxChanged} from '../notifications/events';
import {paymentLabels,type PaymentMethod} from '../money/types';
import {useEffect,useRef,useState} from 'react';
import {Pressable,TextInput,View} from 'react-native';
import {useTheme} from '../../design/ThemeProvider';
import {VoicePendingSummary} from './VoicePendingSummary';
import {ActionButton,Body} from '../../ui/components';
import {ErrorNotice,Choices} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
import {localToday,formatMoney} from '../money/domain';
import {classifyVoiceEntry} from './voiceEntry';
import {saveVoiceEntry} from './saveVoiceEntry';
import type {DocumentStore} from './store';
import type {DocumentsSnapshot,StoredDocument} from './types';
import {newId} from '../../core/id';
import {userMessage} from '../../core/errors';
export function VoiceDraftList({store,data,reload,initialId}:{initialId?:string;store:DocumentStore;data:DocumentsSnapshot;reload():Promise<void>}){
 const captureAccount=useCaptureAccount();
 const {name,colors}=useTheme(),ink=name==='dark'?'#F4FAFC':colors.text,accent=name==='dark'?'#FFE18B':'#72500C';
 const pendingText=(d:StoredDocument)=>{const separator=d.notes.indexOf('\n\n');return separator>=0?d.notes.slice(separator+2).trim()||d.description:d.description;};
 const [edit,setEdit]=useState<{document:StoredDocument;text:string;saveId:string}|null>(null),[remove,setRemove]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[limit,setLimit]=useState(30),[payment,setPayment]=useState<PaymentMethod|''>('');const working=useRef(false);
 const rows=data.documents.filter(d=>d.source==='voice'&&d.kind==='note'&&!d.deletedAt&&d.status!=='corrected'&&!d.supersedesId).sort((a,b)=>Number(b.id===initialId)-Number(a.id===initialId));
 useEffect(()=>{if(!initialId)return;let live=true;void store.detail(initialId).then(detail=>{const d=detail.document;if(live&&d&&d.source==='voice'&&d.kind==='note'&&!d.deletedAt&&d.status!=='corrected'&&!d.supersedesId&&!d.movementId&&!d.billId){setEdit({document:d,text:detail.rawText?.text??d.notes,saveId:newId()});setPayment('');setRemove(null);}}).catch(()=>{if(live)setError('No pudimos abrir el dictado. Puedes elegirlo de la lista.');});return()=>{live=false;};},[initialId,store]);
 async function task(fn:()=>Promise<void>){if(working.current)return;working.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(userMessage(e));}finally{working.current=false;setBusy(false);}}
 async function open(d:StoredDocument){await task(async()=>{const detail=await store.detail(d.id);setPayment('');setEdit({document:d,text:detail.rawText?.text??d.notes,saveId:newId()});setRemove(null);});}
 async function save(){if(!edit)return;if(proposal?.needsPayment&&!proposal.method){setError('Selecciona el método para registrar este gasto o ingreso.');return;}await task(async()=>{const ledger=await getMoneyStore();const p=await saveVoiceEntry({documents:store,ledger},edit.text,edit.saveId,localToday(),newId,{id:edit.document.id,version:edit.document.version},payment||undefined,captureAccount.confirmed());announceSaved();setEdit(null);setNotice(p.ready?'Transacción guardada. El dictado salió de pendientes.':'Cambios guardados. El dictado sigue pendiente.');await reload();});}
 const proposal=edit?classifyVoiceEntry(edit.text,data.categories,localToday(),payment||undefined):null;
 return <View style={{gap:16}}><Body style={{color:ink}}>Aquí están los dictados pendientes. Los ingresos y gastos confirmados quedan en Historial.</Body><ErrorNotice message={error}/>{notice?<Body style={{color:ink}}>{notice}</Body>:null}
 {!rows.length?<Body style={{color:ink}}>No tienes dictados pendientes.</Body>:null}
 {rows.slice(0,limit).map(d=><View key={d.id} style={{gap:8,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#699B9B'}}><VoicePendingSummary text={edit?.document.id===d.id?edit.text:pendingText(d)} reasons={classifyVoiceEntry(edit?.document.id===d.id?edit.text:pendingText(d),data.categories,localToday(),edit?.document.id===d.id?payment||undefined:undefined).reasons} color={ink} warning={accent} disabled={busy||edit?.document.id===d.id} onEdit={()=>void open(d)}/>
 {edit?.document.id===d.id?<><View style={{gap:8}}><Body style={{color:ink,fontWeight:'700'}}>Editar dictado</Body><TextInput accessibilityLabel="Editar dictado" testID="pending-voice-editor" multiline maxLength={20000} editable={!busy} value={edit.text} onChangeText={text=>{if(!busy){setPayment('');setEdit({...edit,text,saveId:newId()});}}} style={{color:ink,backgroundColor:'transparent',fontSize:19,lineHeight:28,minHeight:96,padding:8,borderBottomWidth:2,borderColor:accent,textAlignVertical:'top'}}/></View>{proposal?.needsPayment?<Choices label="Cómo pagaste o recibiste el dinero" value={payment} options={[['','Seleccionar método'],...Object.entries(paymentLabels).filter(([key])=>proposal.kind==='expense'||key!=='credit') as [PaymentMethod,string][]]} onChange={value=>{setPayment(value as PaymentMethod|'');setError('');}}/>:null}{captureAccount.selector}<Body style={{color:ink}}>{proposal?.ready?`${proposal.kind==='income'?'Ingreso':'Gasto'} · ${formatMoney(proposal.amountCents!)} · ${proposal.category?.name??'Categoría por confirmar'} · ${proposal.date}`:`Pendiente: ${proposal?.reasons.join(' ')}`}</Body><ActionButton title={busy?'Guardando…':'Guardar'} onPress={()=>void save()}/>{!busy?<ActionButton secondary title="Cancelar edición" onPress={()=>setEdit(null)}/>:null}</>:<View style={{flexDirection:'row',gap:12,flexWrap:'wrap'}}><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void open(d)} style={{minHeight:44,justifyContent:'center',paddingHorizontal:8}}><Body style={{color:accent,fontWeight:'700'}}>Editar</Body></Pressable><ActionButton secondary title="Borrar" onPress={()=>{if(!busy)setRemove(d.id);}}/></View>}
 {remove===d.id?<><Body style={{color:ink}}>¿Borrar este dictado pendiente? No cambia tus transacciones.</Body><ActionButton title="Borrar dictado" onPress={()=>void task(async()=>{await store.deleteVoiceNote(d.id,d.version);notifyInboxChanged();setRemove(null);if(edit?.document.id===d.id)setEdit(null);await reload();setNotice('Dictado retirado de pendientes.');})}/><ActionButton secondary title="Cancelar" onPress={()=>setRemove(null)}/></>:null}</View>)}
 {rows.length>limit?<ActionButton secondary title="Ver más dictados" onPress={()=>setLimit(limit+30)}/>:null}</View>;
}
