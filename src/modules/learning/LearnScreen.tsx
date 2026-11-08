import { useCallback,useEffect,useRef,useState } from 'react';
import { ActivityIndicator,AppState,Pressable,View } from 'react-native';
import { router,useIsFocused } from 'expo-router';
import { newId } from '../../core/id';
import { userMessage } from '../../core/errors';
import { ActionButton,Body,Card,IconBadge,ProgressBar,Screen,ui } from '../../ui/components';
import { Choices,ErrorNotice,Sheet } from '../money/fields';
import { lessons,findLesson } from './content';
import { getLearningStore } from './localStore';
import type { LearningSnapshot,LearningStore } from './store';
import { readLesson,stopReading } from './speech';
const empty:LearningSnapshot={completed:[],attempts:[],scenarios:[]};
export default function LearnScreen(){
 const focused=useIsFocused();const [store,setStore]=useState<LearningStore|null>(null);const [data,setData]=useState(empty);const [lessonId,setLessonId]=useState<string|null>(null);const [answer,setAnswer]=useState('');const [feedback,setFeedback]=useState('');const [error,setError]=useState('');const [voiceMessage,setVoiceMessage]=useState('');const [busy,setBusy]=useState(false);const voiceRequest=useRef(0);
 const load=useCallback(async()=>{const s=await getLearningStore();const d=await s.snapshot();setStore(s);setData(d);},[]);
 const stop=useCallback(()=>{voiceRequest.current++;void stopReading().catch(()=>undefined);},[]);
 useEffect(()=>{if(!focused){stop();return;}const refresh=()=>void load().catch(()=>setError('No pudimos cargar el avance cifrado. Vuelve a abrir Aprende.'));refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();else stop();});return()=>{sub.remove();stop();};},[focused,load,stop]);
 const lesson=lessonId?findLesson(lessonId):null;const completed=lessons.filter(l=>data.completed.some(c=>c.lessonId===l.id&&c.version===l.version)).length;
 async function check(){if(!store||!lesson||busy)return;setBusy(true);setError('');try{if(answer==='')throw new Error('Selecciona una respuesta antes de comprobar.');const correct=await store.answer(newId(),lesson.id,Number(answer));await load();setFeedback(`${correct?'¡Buen paso! Lección completada.':'Puedes intentarlo de nuevo; el avance se guarda al resolver el ejercicio.'} ${lesson.explanation}`);}catch(e){setError(answer===''?'Selecciona una respuesta antes de comprobar.':userMessage(e));}finally{setBusy(false);}}
 async function read(){if(!lesson)return;const request=++voiceRequest.current;setVoiceMessage('Buscando una voz local disponible…');try{const message=await readLesson(`${lesson.title}. ${lesson.paragraphs.join(' ')} Ejercicio: ${lesson.question}. ${lesson.options.map((o,i)=>`${i+1}: ${o}`).join('. ')}`,()=>undefined,()=>setVoiceMessage('No se pudo completar la lectura. El texto sigue disponible.'));if(request===voiceRequest.current)setVoiceMessage(message);else await stopReading();}catch{setVoiceMessage('No se pudo iniciar la lectura local. El texto sigue disponible.');}}
 return <Screen title="Aprende" demo={false} subtitle="Un poco de conocimiento, más confianza para decidir.">
 <ErrorNotice message={error}/>{!store?<ActivityIndicator accessibilityLabel="Cargando lecciones locales"/>:null}
 <Card><Body style={{fontWeight:'700'}}>{completed} de {lessons.length} lecciones completadas</Body><ProgressBar value={completed/lessons.length*100} label={`Lecciones completadas: ${completed} de ${lessons.length}`}/><Body muted>Contenido educativo general. Los ejemplos están identificados como ficticios y no sustituyen una revisión de tus condiciones reales.</Body></Card>
 <ActionButton title="Antes de decidir" testID="open-decisions" icon="git-compare-outline" onPress={()=>{stop();router.push('/decisions');}}/>
 {lessons.map(l=>{const done=data.completed.some(c=>c.lessonId===l.id&&c.version===l.version);return <Pressable key={l.id} testID={`lesson-${l.id}`} accessibilityRole="button" accessibilityLabel={`${l.title}, ${done?'completada':'por aprender'}`} onPress={()=>{setLessonId(l.id);setAnswer('');setFeedback('');setVoiceMessage('');setError('');}}><Card><View style={ui.row}><IconBadge icon={done?'checkmark-circle-outline':'book-outline'}/><View style={{flex:1,gap:6}}><Body style={{fontWeight:'700',fontSize:18}}>{l.title}</Body><Body>{l.summary}</Body><Body muted>{done?'Completada':'Por aprender'} · Lección breve</Body></View></View></Card></Pressable>;})}
 {lesson&&store?<Sheet title={lesson.title} busy={busy} close={()=>{stop();setLessonId(null);}}>
 {lesson.paragraphs.map(p=><Body key={p}>{p}</Body>)}<ActionButton title="Leer en voz alta local" testID="lesson-read" secondary onPress={()=>void read()}/><ActionButton title="Detener lectura" secondary onPress={()=>{stop();setVoiceMessage('Lectura detenida.');}}/>{voiceMessage?<Body>{voiceMessage}</Body>:null}
 <Body style={{fontWeight:'700'}}>Practica: {lesson.question}</Body><Choices label="Tu respuesta" value={answer} options={lesson.options.map((o,i)=>[String(i),o] as const)} onChange={v=>{setAnswer(v);setFeedback('');}}/>
 {!busy?<ActionButton title="Comprobar respuesta" testID="lesson-check" onPress={()=>void check()}/>:null}{feedback?<Body>{feedback}</Body>:null}
 {data.completed.some(c=>c.lessonId===lesson.id&&c.version===lesson.version)&&!busy?<ActionButton title="Volver a pendiente" secondary onPress={()=>{setBusy(true);void store.setPending(lesson.id).then(load).then(()=>{setAnswer('');setFeedback('Lección pendiente de nuevo; el historial de ejercicios se conserva.');}).catch(e=>setError(userMessage(e))).finally(()=>setBusy(false));}}/>:null}<ErrorNotice message={error}/>
 </Sheet>:null}
 </Screen>;
}
