import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Platform,Pressable,View} from 'react-native';
import {Body,ActionButton} from './components';
import {VoiceActivity} from './VoiceActivity';
import {HoldToDictate} from './HoldToDictate';
import {Field,ErrorNotice,Choices} from '../modules/money/fields';
import {startDictation,type VoiceSession} from '../modules/documents/voice';
import {classifyVoiceEntry} from '../modules/documents/voiceEntry';
import {saveVoiceEntry} from '../modules/documents/saveVoiceEntry';
import {getDocumentStore} from '../modules/documents/localStore';
import {getMoneyStore} from '../modules/money/localStore';
import {formatMoney,localToday} from '../modules/money/domain';
import {paymentLabels,type Category,type PaymentMethod} from '../modules/money/types';
import {newId} from '../core/id';
import {userMessage} from '../core/errors';
export function HomeVoiceEntry({categories,saved}:{categories:Category[];saved(date?:string):Promise<void>}){
 const [text,setText]=useState(''),[phase,setPhase]=useState<'idle'|'starting'|'listening'|'stopping'>('idle'),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[privacy,setPrivacy]=useState(false),[payment,setPayment]=useState<PaymentMethod|''>('');
 const session=useRef<VoiceSession|null>(null),live=useRef(true),startupTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),running=useRef(false),saving=useRef(false),id=useRef<string|null>(null),generation=useRef(0);
 const proposal=useMemo(()=>classifyVoiceEntry(text,categories,localToday(),payment||undefined),[text,categories,payment]);
 const abortSession=useCallback(()=>{generation.current++;clearTimeout(startupTimer.current);session.current?.abort();session.current=null;running.current=false;},[]);
 useEffect(()=>{live.current=true;const sub=AppState.addEventListener('change',state=>{if(state==='background'){abortSession();setPhase('idle');}});return()=>{live.current=false;abortSession();sub.remove();};},[abortSession]);
 function stop(){if(!running.current)return;clearTimeout(startupTimer.current);if(!session.current){abortSession();setPhase('idle');return;}setPhase('stopping');session.current.stop();}
 async function start(){if(running.current||saving.current)return;running.current=true;setPhase('starting');setError('');setMessage('');const before=text.trim(),token=++generation.current;let ended=false,heard=false,failed=false;
 const current=()=>live.current&&generation.current===token;
 startupTimer.current=setTimeout(()=>{if(current()){abortSession();setPhase('idle');setError('El micrófono no inició. Permite el micrófono en Safari o Chrome y vuelve a tocarlo.');}},30000);
 const result=await startDictation(value=>{if(current()){heard=true;id.current=null;setPayment('');setText([before,value].filter(Boolean).join(' ').slice(0,20000));}},value=>{if(current()&&!value.startsWith('Dictado activo')&&!value.startsWith('Dictado terminado')){failed=true;setError(value);}},()=>{ended=true;clearTimeout(startupTimer.current);if(current()){running.current=false;session.current=null;setPhase('idle');if(!heard&&!failed)setError('No recibimos palabras. Toca el micrófono, espera a ver «Escuchando» y habla.');}},current,()=>{clearTimeout(startupTimer.current);if(current())setPhase('listening');});
 if(!current()){result?.abort();return;}if(!result||ended){clearTimeout(startupTimer.current);running.current=false;setPhase('idle');return;}session.current=result;
 }
 async function save(){if(saving.current||running.current||!text.trim())return;if(proposal.needsPayment&&!proposal.method){setError('Selecciona cómo pagaste o recibiste el dinero para registrarlo en tus gastos o ingresos.');return;}saving.current=true;setBusy(true);setError('');const draftId=id.current??=newId();let stored=false;
 try{const [documents,ledger]=await Promise.all([getDocumentStore(),getMoneyStore()]);const p=await saveVoiceEntry({documents,ledger},text,draftId,localToday(),newId,undefined,payment||undefined);stored=true;if(live.current){setText('');setPayment('');id.current=null;setMessage(p.ready?`${p.kind==='income'?'Ingreso':'Gasto'} guardado. Puedes verlo en Historial.`:'Guardado en Mis dictados como nota pendiente. No cambia tus totales.');}await saved(p.ready?p.date:undefined);}catch(e){if(live.current)setError(stored?'El dictado se guardó, pero no pudimos actualizar el resumen. Vuelve a abrir Home; no necesitas guardarlo otra vez.':userMessage(e));}finally{saving.current=false;if(live.current)setBusy(false);}
 }
 return <View style={{gap:12,paddingVertical:12}} testID="home-voice-entry"><View style={{flexDirection:'row',gap:16,alignItems:'center'}}><HoldToDictate start={()=>void start()} stop={stop} listening={phase!=='idle'} disabled={busy||phase==='stopping'}/><View style={{flex:1}}><Body style={{fontWeight:'800',fontSize:21}}>Dictado por voz</Body><Body style={{fontSize:16,lineHeight:23}}>Toca para hablar. Toca otra vez para terminar.</Body></View></View>
 <VoiceActivity phase={phase}/>
 {message?<View accessibilityLiveRegion="polite"><Body style={{fontSize:18,lineHeight:25,fontWeight:'700'}}>{message}</Body></View>:null}
 {text||phase!=='idle'||error?<><Field label="Tu dictado" value={text} onChangeText={value=>{if(!busy&&phase==='idle'){id.current=null;setPayment('');setText(value);}}} multiline maxLength={20000} testID="home-voice-text"/>
 {phase==='idle'?<>{proposal.needsPayment?<Choices label="Cómo pagaste o recibiste el dinero" value={payment} options={[[ '', 'Seleccionar método'],...Object.entries(paymentLabels).filter(([key])=>proposal.kind==='expense'||key!=='credit') as [PaymentMethod,string][]]} onChange={value=>{setPayment(value as PaymentMethod|'');setError('');}}/>:null}<Body style={{fontSize:15,lineHeight:22}}>{proposal.ready?`${proposal.kind==='income'?'Ingreso':'Gasto'} · ${formatMoney(proposal.amountCents!)} · ${proposal.category?.name??'Dictado por voz'} · ${proposal.date} · ${paymentLabels[proposal.method!]}`:`Se guardará como pendiente. ${proposal.reasons.join(' ')}`}</Body><ActionButton title={busy?'Guardando…':'Guardar'} onPress={()=>void save()} testID="home-voice-save"/></>:null}</>:null}
 <ErrorNotice message={error}/>
 {Platform.OS==='web'?<><Pressable accessibilityRole="button" accessibilityState={{expanded:privacy}} onPress={()=>setPrivacy(!privacy)} style={{minHeight:44,justifyContent:'center'}}><Body muted style={{fontSize:13}}>Privacidad del dictado</Body></Pressable>{privacy?<Body>El navegador puede procesar la voz con su proveedor. EduMoney no guarda audio ni lo envía a Anthropic.</Body>:null}</>:null}</View>;
}
