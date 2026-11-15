import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Platform,Pressable,View} from 'react-native';
import {router} from 'expo-router';
import {Body,ActionButton} from './components';
import {HoldToDictate} from './HoldToDictate';
import {Field,ErrorNotice} from '../modules/money/fields';
import {startDictation,type VoiceSession} from '../modules/documents/voice';
import {classifyVoiceEntry} from '../modules/documents/voiceEntry';
import {saveVoiceEntry} from '../modules/documents/saveVoiceEntry';
import {getDocumentStore} from '../modules/documents/localStore';
import {getMoneyStore} from '../modules/money/localStore';
import {formatMoney,localToday} from '../modules/money/domain';
import {paymentLabels,type Category} from '../modules/money/types';
import {newId} from '../core/id';
import {userMessage} from '../core/errors';
export function HomeVoiceEntry({categories,saved}:{categories:Category[];saved():Promise<void>}){
 const [text,setText]=useState(''),[phase,setPhase]=useState<'idle'|'listening'|'stopping'>('idle'),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const session=useRef<VoiceSession|null>(null),live=useRef(true),released=useRef(false),running=useRef(false),saving=useRef(false),id=useRef<string|null>(null),generation=useRef(0);
 const proposal=useMemo(()=>classifyVoiceEntry(text,categories,localToday()),[text,categories]);
 const abortSession=useCallback(()=>{generation.current++;session.current?.abort();session.current=null;running.current=false;},[]);
 useEffect(()=>{live.current=true;const sub=AppState.addEventListener('change',state=>{if(state!=='active'){abortSession();setPhase('idle');}});return()=>{live.current=false;abortSession();sub.remove();};},[abortSession]);
 function stop(){released.current=true;if(!running.current)return;setPhase('stopping');session.current?.stop();}
 async function start(){if(running.current||saving.current)return;running.current=true;released.current=false;setPhase('listening');setError('');setMessage('Habla ahora; suelta el micrófono para revisar.');const before=text.trim(),token=++generation.current;let ended=false;
 const current=()=>live.current&&generation.current===token;
 const result=await startDictation(value=>{if(current()){id.current=null;setText([before,value].filter(Boolean).join(' ').slice(0,20000));}},value=>{if(current())setMessage(value);},()=>{ended=true;if(current()){running.current=false;session.current=null;setPhase('idle');}},current);
 if(!current()){result?.abort();return;}if(!result||ended){running.current=false;setPhase('idle');return;}session.current=result;if(released.current)result.stop();
 }
 async function save(){if(saving.current||running.current||!text.trim())return;saving.current=true;setBusy(true);setError('');const draftId=id.current??=newId();let stored=false;
 try{const [documents,ledger]=await Promise.all([getDocumentStore(),getMoneyStore()]);const p=await saveVoiceEntry({documents,ledger},text,draftId,localToday(),newId);stored=true;if(live.current){setText('');id.current=null;setMessage(p.ready?`${p.kind==='income'?'Ingreso':'Gasto'} guardado. Texto original en Mis dictados.`:'Guardado en Mis dictados como nota pendiente. No cambia tus totales.');}await saved();}catch(e){if(live.current)setError(stored?'El dictado se guardó, pero no pudimos actualizar el resumen. Vuelve a abrir Home; no necesitas guardarlo otra vez.':userMessage(e));}finally{saving.current=false;if(live.current)setBusy(false);}
 }
 return <View style={{gap:8,paddingVertical:10}} testID="home-voice-entry"><View style={{flexDirection:'row',gap:14,alignItems:'center'}}><HoldToDictate start={()=>void start()} stop={stop} listening={phase!=='idle'} disabled={busy}/><View style={{flex:1}}><Body style={{fontWeight:'800',fontSize:18}}>Dictar gasto o ingreso</Body><Body style={{fontSize:12,lineHeight:18}}>Mantén pulsado para hablar y suelta para revisar.</Body><Body muted style={{fontSize:11,lineHeight:16}}>Ejemplo: «Gasté veinte dólares en gasolina, en efectivo».</Body></View></View>
 {Platform.OS==='web'?<Body muted style={{fontSize:11,lineHeight:16}}>El navegador puede procesar la voz con su proveedor. EduMoney no guarda audio ni lo envía a Anthropic.</Body>:null}
 {message?<View accessibilityLiveRegion="polite"><Body style={{fontSize:12,lineHeight:18}}>{message}</Body></View>:null}
 {text?<><Field label="Texto dictado · revisa antes de guardar" value={text} onChangeText={value=>{if(!busy&&phase==='idle'){id.current=null;setText(value);}}} multiline maxLength={20000} testID="home-voice-text"/>
 <Body style={{fontSize:13,lineHeight:19}}>{proposal.ready?`${proposal.kind==='income'?'Ingreso':'Gasto'} · ${formatMoney(proposal.amountCents!)} · ${proposal.category?.name??'Dictado por voz'} · ${proposal.date} · ${paymentLabels[proposal.method!]}`:`Nota pendiente · ${proposal.reasons.join(' ')} No cambia tus totales.`}</Body>
 {phase==='idle'?<ActionButton title={busy?'Guardando…':'Guardar'} onPress={()=>void save()} testID="home-voice-save"/>:null}</>:null}
 <ErrorNotice message={error}/><Pressable accessibilityRole="link" onPress={()=>router.push({pathname:'/documents',params:{source:'voice'}})} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}}><Body style={{fontWeight:'700',fontSize:13}}>Mis dictados →</Body></Pressable></View>;
}
