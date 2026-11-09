import { useCallback,useEffect,useState } from 'react';
import { Linking } from 'react-native';
import { router,useLocalSearchParams } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../../money/fields';
import { getMoneyStore } from '../../money/localStore';
import { localToday,validDate } from '../../money/domain';
import { userMessage } from '../../../core/errors';
import { classificationLabels } from '../domain';
import { show } from '../obligations/Forms';
import { Forms,type Editor } from './Forms';
import { panel,calendar,compareScenario,planningSources } from './domain';
import { blankPlan,type PlanningSnapshot } from './types';
import { PlanningStore } from './store';
export default function PlanningScreen(){
 const params=useLocalSearchParams<{holderId:string}>(),today=localToday();
 const [holderId,setHolderId]=useState(params.holderId??''),[year,setYear]=useState(new Date().getFullYear()),[yearText,setYearText]=useState(String(year)),[cut,setCut]=useState(today),[tab,setTab]=useState<'panel'|'scenarios'|'calendar'>('panel');
 const [data,setData]=useState<PlanningSnapshot>(),[store,setStore]=useState<PlanningStore>(),[editor,setEditor]=useState<Editor>(),[entryId,setEntryId]=useState<string>(),[editingId,setEditingId]=useState<string>(),[error,setError]=useState(''),[sources,setSources]=useState(false);
 const [voidId,setVoidId]=useState<string>(),[reason,setReason]=useState(''),[voidError,setVoidError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const s=new PlanningStore(await getMoneyStore()),d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{let active=true;void getMoneyStore().then(async ledger=>{const s=new PlanningStore(ledger),d=await s.snapshot();if(active){setStore(s);setData(d);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[]);
 const holder=data?.ledger.holders.find(h=>h.id===holderId),saved=data?.records.plan.find(r=>!r.voidedAt&&r.value.holderId===holderId&&r.value.year===year),plan=saved?.value??blankPlan(holderId,year);
 const validCut=validDate(cut)&&cut.startsWith(String(year))&&cut<=today;
 const base=data&&holder&&validCut?panel(data,plan,cut):undefined;
 function open(e:Editor,id?:string){setError('');setEditingId(id);setEditor(e);}
 async function done(){setEditor(undefined);try{await load();}catch(e){setError(userMessage(e));}}
 function remove(id:string){setReason('');setVoidError('');setVoidId(id);}
 async function confirmVoid(){if(!store||!voidId||busy)return;setBusy(true);setVoidError('');try{await store.voidRecord(voidId,reason);await load();setVoidId(undefined);}catch(e){setVoidError(userMessage(e));}finally{setBusy(false);}}
 function recordList(kind:'cash'|'payment'|'calendar'){if(!data)return null;return data.records[kind].filter(r=>r.value.holderId===holderId&&('year' in r.value?r.value.year===year:r.value.date.startsWith(String(year)))).map(r=>{const v=r.value;return <Card key={v.id}><Body>{'name' in v?v.name:v.reference} · {v.date}</Body>{'direction' in v?<Body>{v.direction==='in'?'Entrada de efectivo':'Salida de efectivo'} · {v.kind==='capital'?'Capital':v.kind==='loan'?'Préstamo recibido':v.kind==='repayment'?'Principal':v.kind==='card_payment'?'Liquidación de compras':v.kind==='equipment'?'Pago de activo':'Ajuste sin resultado'}</Body>:null}{'jurisdiction' in v?<Body>{v.jurisdiction==='pr'?'Puerto Rico':'Federal'} · {v.cash==='linked'?'Gasto vinculado':v.cash==='separate'?'Efectivo separado':'Efectivo por conciliar'}</Body>:null}<Body>{'amountCents' in v?show(v.amountCents):''} · {'status' in v?v.status==='paid'?'Pago confirmado':v.status==='done'?'Atendida':'Pendiente':''}</Body><Body>{r.voidedAt?'Anulado: '+r.voidReason:'note' in v?v.note:''}</Body>{!r.voidedAt?<><ActionButton title="Revisar este registro" secondary onPress={()=>open(kind,v.id)}/><ActionButton title="Anular este registro" secondary onPress={()=>remove(v.id)}/></>:null}</Card>;});}
 return <Screen title="Panel de Negocio" subtitle="Resultado, efectivo, reservas y escenarios." demo={false} keyboardForm>
 <ActionButton title="Volver a Negocio" secondary onPress={()=>router.dismissTo('/business')}/><ErrorNotice message={error}/>
 {data?<Choices label="Titular legal" value={holderId} options={data.ledger.holders.map(h=>[h.id,h.legalName] as const)} onChange={h=>{setHolderId(h);setEditor(undefined);}}/>:<Body>Abriendo registros cifrados…</Body>}
 <Field label="Año del panel AAAA" value={yearText} onChangeText={setYearText}/><ActionButton title="Abrir año del panel" secondary onPress={()=>{const y=Number(yearText);if(!/^\d{4}$/.test(yearText)||y<1900||y>9998||y>Number(today.slice(0,4))){setError('Elige un año de cuatro dígitos hasta el actual.');return;}setYear(y);setCut(y===Number(today.slice(0,4))?today:`${y}-12-31`);setEditor(undefined);}}/>
 <Field label="Fecha de corte AAAA-MM-DD" value={cut} onChangeText={setCut}/>{!validCut?<Body>El corte debe pertenecer al año elegido y no ser futuro.</Body>:null}
 <Choices<'panel'|'scenarios'|'calendar'> label="Sección del panel" value={tab} options={[["panel","Resultado y efectivo"],["scenarios","Comparar escenarios"],["calendar","Calendario"]]} onChange={setTab}/>
 {data&&holder&&store&&base?<>
 <Card><Body>{holder.legalName} · PR: {classificationLabels[holder.prClassification]} · Federal: {classificationLabels[holder.federalClassification]}</Body><Body>Resultado de operaciones registradas, antes de depreciación y ajustes contributivos. Disponible tras reservas registradas; no es saldo bancario confirmado ni contempla compromisos que no hayas registrado.</Body></Card>
 {tab==='panel'?<>
 <Card><Body>Ganancia / pérdida registrada: {show(base.profitCents)}</Body><Body>Variación de efectivo registrada: {show(base.cashChangeCents)}</Body><Body>Efectivo estimado: {show(base.cashCents)}</Body><Body>Reservas actuales: {show(base.reservedCents)}</Body><Body>Disponible después de reservas: {show(base.availableCents)}</Body><Body>Contribuciones: {show(base.reserves.tax)} · IVU: {show(base.reserves.ivu)} · Nómina: {show(base.reserves.payroll)}</Body></Card>
 <ActionButton title="Configurar efectivo y criterio de operaciones" onPress={()=>open('cashPlan')}/><ActionButton title="Revisar movimientos y reservas" secondary onPress={()=>router.push({pathname:'/business-ledger',params:{holderId}})}/>
 <Card><Body>Pagos estimados registrados del alcance: {show(base.recordedPaidCents)}</Body><Body>Contribución anual proyectada declarada: {show(plan.annualTaxCents)}</Body><Body>Saldo proyectado tras estimadas y otros créditos: {show(base.dueCents)}</Body><Body>Faltaría reservar: {show(base.needReserveCents)}</Body>{base.taxPending.map((v,i)=><Body key={i}>{v}</Body>)}</Card>
 <ActionButton title="Configurar proyección contributiva documentada" onPress={()=>open('taxPlan')}/><ActionButton title="Registrar pago estimado" onPress={()=>open('payment')}/>{recordList('payment')}
 <ActionButton title="Registrar otro movimiento de efectivo" secondary onPress={()=>open('cash')}/>{recordList('cash')}
 <Card><Body>Clasificación económica de los registros del año</Body>{data.ledger.entries.filter(e=>e.holderId===holderId&&e.date.startsWith(String(year))).map(e=><ActionButton key={e.id} title={`${e.description} · ${show(e.amountCents)}`} secondary onPress={()=>{setEntryId(e.id);open('treatment');}}/>)}</Card>
 <Card><Body>Datos y conciliaciones pendientes</Body>{base.pending.length?base.pending.map((v,i)=><Body key={i}>{v}</Body>):<Body>Sin pendientes detectados en los registros y confirmaciones de este panel.</Body>}{base.assumptions.map((v,i)=><Body key={i}>{v}</Body>)}</Card>
 </>:tab==='scenarios'?<>
 <Card><Body>Compara cambios frente a los registros actuales y el corte elegido. Guardar un escenario conserva sus supuestos; al cambiar los registros, se recalcula la comparación. Introduce cero cuando confirmes que un componente no cambia. Las casillas vacías permanecen pendientes.</Body></Card><ActionButton title="Crear escenario" onPress={()=>open('scenario')}/>
 {data.records.scenario.filter(r=>!r.voidedAt&&r.value.holderId===holderId&&r.value.year===year).map(r=>{const v=r.value,c=compareScenario(base,v);return <Card key={v.id}><Body style={{fontWeight:'700'}}>{v.name}</Body><Body>Resultado {show(c.profitCents)} · Cambio {show(c.profitDelta)}</Body><Body>Efectivo {show(c.cashCents)} · Cambio {show(c.cashDelta)}</Body><Body>Disponible tras reservas {show(c.availableCents)}</Body><Body>Saldo contributivo del supuesto {show(c.dueCents)} · Faltaría reservar {show(c.needReserveCents)}</Body><Body>Equipo aún por atender / financiado del supuesto {show(c.assumedFinancingCents)}</Body>{c.explanations.map((t,i)=><Body key={i}>{t}</Body>)}<ActionButton title={`Editar escenario: ${v.name}`} secondary onPress={()=>open('scenario',v.id)}/><ActionButton title="Anular escenario" secondary onPress={()=>remove(v.id)}/></Card>;})}
 </>:<>
 <Card><Body>Guía de fechas base y registros verificados. Las filas base no crean deudas ni confirman que un pago cubra toda la obligación. Verifica prórrogas, feriados, régimen y municipio. Los registros de presentación y pago se mantienen separados.</Body></Card><ActionButton title="Configurar obligaciones del perfil" onPress={()=>open('profile')}/><ActionButton title="Añadir o verificar obligación con fuente" secondary onPress={()=>open('calendar')}/>{recordList('calendar')}
 <ActionButton title="Abrir registros de IVU y contratistas" secondary onPress={()=>router.push({pathname:'/business-obligations',params:{holderId}})}/>
 {calendar(data,plan).map(c=><Card key={c.key}><Body style={{fontWeight:'700'}}>{c.name}</Body><Body>{c.period} · {c.date??'Fecha pendiente'} · {c.status}</Body><Body>{c.note}</Body><Body>{c.source}</Body></Card>)}
 </>}
 <ActionButton title={sources?'Ocultar fuentes de referencia':'Ver fuentes y vigencia'} secondary onPress={()=>setSources(!sources)}/>{sources?planningSources.map(s=><Card key={s.id}><Body>{s.name} · {s.effective}</Body><Body>{s.summary}</Body><ActionButton title={`Abrir fuente: ${s.name}`} secondary onPress={()=>void Linking.openURL(s.url).catch(e=>setError(userMessage(e)))}/></Card>):null}
 {editor?<Sheet title="Registro del panel comercial" close={()=>setEditor(undefined)}><Forms key={`${editor}-${editingId??entryId??'new'}`} editor={editor} plan={plan} data={data} store={store} entryId={entryId} editingId={editingId} base={base} done={()=>void done()}/></Sheet>:null}
 {voidId?<Sheet title="Anular registro del panel" busy={busy} close={()=>setVoidId(undefined)}><ErrorNotice message={voidError}/><Field label="Motivo de anulación" value={reason} onChangeText={setReason}/>{!busy?<ActionButton title="Confirmar anulación" onPress={()=>void confirmVoid()}/>:null}</Sheet>:null}
 </>:holder?null:<Card><Body>Selecciona primero un titular legal de Negocio.</Body></Card>}
 </Screen>;
}
