import { useCallback,useEffect,useState } from 'react';
import { AppState } from 'react-native';
import { router,useIsFocused } from 'expo-router';
import { newId } from '../../core/id';
import { userMessage } from '../../core/errors';
import { ActionButton,Body,Card,Screen,SectionHeading } from '../../ui/components';
import { Choices,ErrorNotice,Field } from '../money/fields';
import { formatMoney } from '../money/domain';
import { getLearningStore } from '../learning/localStore';
import type { LearningStore,SavedScenario } from '../learning/store';
import { kinds,simulate,type ScenarioInput,type SimulationKind } from './domain';
import { blankDraft,draftFrom,inputScenario,type Draft } from './fields';
import { ResultCard } from './ResultCard';
export default function DecisionsScreen(){
 const focused=useIsFocused();const [store,setStore]=useState<LearningStore|null>(null);const [saved,setSaved]=useState<SavedScenario[]>([]);const [draft,setDraft]=useState<Draft>(blankDraft);const [result,setResult]=useState<ScenarioInput|null>(null);const [name,setName]=useState('');const [saveId,setSaveId]=useState(newId);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [a,setA]=useState('');const [b,setB]=useState('');const [comparison,setComparison]=useState<[SavedScenario,SavedScenario]|null>(null);const [deleting,setDeleting]=useState('');const [limit,setLimit]=useState(10);
 const load=useCallback(async()=>{const s=await getLearningStore();const d=await s.snapshot();setStore(s);setSaved(d.scenarios);},[]);
 useEffect(()=>{if(!focused)return;const refresh=()=>{void load().catch(()=>setError('No pudimos cargar los escenarios cifrados. Vuelve a abrir esta sección.'));};refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>sub.remove();},[focused,load]);
 const loan=['vehicle','home','loan'].includes(draft.kind),saving=draft.kind==='saving',emergency=draft.kind==='emergency';
 function update<K extends keyof Draft>(key:K,value:Draft[K]){setDraft(d=>({...d,[key]:value}));setResult(null);setError('');setNotice('');setSaveId(newId());}
 function calculate(){setError('');try{const input=inputScenario(draft);simulate(input);setResult(input);setSaveId(newId());setNotice('Resultado actualizado con los datos que confirmaste.');}catch(e){setError(userMessage(e));setResult(null);}}
 async function save(){if(!store||!result||busy)return;setBusy(true);setError('');try{await store.saveScenario(saveId,name,result);await load();setNotice('Escenario guardado solo en este dispositivo. No se registró ninguna compra ni pago.');}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 function compare(){setError('');setComparison(null);try{const first=saved.find(s=>s.id===a),second=saved.find(s=>s.id===b);if(!first||!second||first.id===second.id)throw new Error('Selecciona dos escenarios diferentes.');if(first.kind!==second.kind)throw new Error('Compara dos escenarios del mismo tipo.');if(first.formulaVersion!==1||second.formulaVersion!==1)throw new Error('La versión de cálculo necesita revisión antes de comparar.');simulate(first.input);simulate(second.input);setComparison([first,second]);}catch(e){setError(e instanceof Error?e.message:'No se pudo comparar.');}}
 const field=(key:keyof Draft,label:string,decimal=true)=><Field key={key} testID={`decision-${key}`} label={label} value={String(draft[key])} onChangeText={value=>update(key,value as never)} decimal={decimal}/>;
 return <Screen title="Antes de decidir" demo={false} subtitle="Compara opciones y revisa cómo cambian tus cantidades.">
 <ActionButton title="Volver a Aprende" secondary onPress={()=>router.dismissTo('/learn')}/><ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
 <Card><Body>Introduce tus propios supuestos. Los campos empiezan en blanco: confirma 0 cuando una tasa o un costo sea realmente cero. Los cálculos son locales y no generan movimientos. No ofrecen aprobación ni recomendación de compra.</Body></Card>
 <Choices<SimulationKind> label="Simulador" options={kinds} value={draft.kind} onChange={kind=>{setDraft(blankDraft(kind));setResult(null);setError('');setNotice('');setName('');setSaveId(newId());}}/>
 {!saving?field('amount',loan?(draft.kind==='loan'?'Principal solicitado':'Precio de compra'):emergency?'Gastos esenciales mensuales':'Importe de cada cobro recurrente'):null}
 {saving?null:!loan&&!emergency?<Choices<Draft['cadence']> label="Frecuencia de cobro" value={draft.cadence} options={[[ 'monthly','Mensual'],['weekly','Semanal'],['annual','Anual']]} onChange={v=>update('cadence',v)}/>:null}
 {loan&&draft.kind!=='loan'?field('down','Pronto o pago inicial'):null}
 {loan?<>{field('financedFees','Cargos que se financian (confirma 0 si no hay)')}{field('extra','Costos adicionales mensuales (seguro, uso, mantenimiento u otros)')}</>:null}
 {loan||draft.kind==='recurring'?field('upfront','Cargos iniciales pagados aparte (confirma 0 si no hay)'):null}
 {saving||emergency?<>{field('opening','Ahorro o fondo actual (confirma 0 si no hay)')}{field('contribution','Aportación mensual elegida (confirma 0 si no aportarás)')}</>:null}
 {loan||saving?field('rate',saving?'Tasa nominal anual hipotética (%)':'Tasa nominal anual fija (%)'):null}
 {emergency?field('coverage','Meses de cobertura elegidos (1 a 36)',false):field('months','Plazo u horizonte en meses (1 a 600)',false)}
 {field('margin','Margen mensual elegido para comparar (opcional; puede ser negativo)',false)}
 <Card><Body muted>El margen es la cantidad mensual que tú eliges después de tus otros compromisos. Un registro mensual parcial no confirma capacidad de pago. Si lo dejas vacío, el efecto sobre presupuesto queda pendiente.</Body></Card>
 <ActionButton title="Calcular escenario" testID="decision-calculate" onPress={calculate}/>
 {result?<><ResultCard input={result}/><Field label="Nombre del escenario para guardar" testID="decision-name" value={name} onChangeText={value=>{setName(value);setSaveId(newId());}}/>{!busy&&store?<ActionButton title="Guardar escenario" testID="decision-save" onPress={()=>void save()}/>:null}</>:null}
 <SectionHeading title="Escenarios guardados"/>
 {!saved.length?<Card><Body>Aún no has guardado escenarios. No hay ofertas ni cantidades precargadas.</Body></Card>:null}
 {saved.slice(0,limit).map(s=><Card key={s.id}><Body style={{fontWeight:'700'}}>{s.name} · {kinds.find(([k])=>k===s.kind)?.[1]}</Body><Body muted>Guardado {s.createdAt.slice(0,10)} · Fórmula {s.formulaVersion}</Body><ActionButton title={`Cargar escenario: ${s.name}`} secondary onPress={()=>{setError('');if(s.formulaVersion!==1){setError('La versión de cálculo de este escenario necesita revisión.');return;}try{simulate(s.input);setDraft(draftFrom(s.input));setResult(s.input);setName(`${s.name} copia`);setSaveId(newId());setNotice('Copia cargada. Puedes modificar cantidades y calcular de nuevo; el original se conserva.');}catch(e){setError(userMessage(e));}}}/><ActionButton title={`Eliminar escenario: ${s.name}`} secondary onPress={()=>setDeleting(s.id)}/>{deleting===s.id&&store&&!busy?<><Body>Solo se eliminará este escenario de prueba; no modifica movimientos.</Body><ActionButton title="Confirmar eliminación del escenario" onPress={()=>{setBusy(true);void store.deleteScenario(s.id).then(load).then(()=>{setComparison(null);setDeleting('');}).catch(e=>setError(userMessage(e))).finally(()=>setBusy(false));}}/></>:null}</Card>)}
 {saved.length>limit?<ActionButton title="Ver más escenarios" secondary onPress={()=>setLimit(limit+10)}/>:null}
 {saved.length>1?<>
 <SectionHeading title="Comparar dos alternativas"/><Choices label="Escenario A" value={a} options={[[ '', 'Elegir A'],...saved.map(s=>[s.id,`A: ${s.name}`] as const)]} onChange={v=>{setA(v);setComparison(null);}}/><Choices label="Escenario B" value={b} options={[[ '', 'Elegir B'],...saved.map(s=>[s.id,`B: ${s.name}`] as const)]} onChange={v=>{setB(v);setComparison(null);}}/>
 <ActionButton title="Comparar escenarios" testID="decision-compare" onPress={compare}/>
 </>:null}
 {comparison?<>
 <Card><Body style={{fontWeight:'700'}}>Qué cambia de A a B</Body><Body>Compromiso mensual: {formatMoney(simulate(comparison[0].input).monthly)} → {formatMoney(simulate(comparison[1].input).monthly)}.</Body><Body>Diferencia del total B menos A: {formatMoney(simulate(comparison[1].input).total-simulate(comparison[0].input).total)}.</Body><Body muted>Revisa en cada tarjeta cantidades, horizontes y supuestos. Una diferencia no decide cuál alternativa te conviene.</Body></Card>
 {comparison.map((s,i)=><ResultCard key={s.id} input={s.input} title={`${i===0?'A':'B'}: ${s.name}`}/>)}
 </>:null}<ErrorNotice message={error}/>
 </Screen>;
}
