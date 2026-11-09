import { useCallback,useEffect,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { userMessage } from '../../../core/errors';
import { ActionButton,Body,Card,Screen } from '../../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../../money/fields';
import { validMonth } from '../../money/domain';
import { getMoneyStore } from '../../money/localStore';
import { RULE_VERSION,VERIFIED_ON,providerLabels,ruleSources } from './catalog';
import { collectionTotal,contractorSummary,evaluateWithholding,obligationBaseDue,sutSummary } from './domain';
import { Forms,show,type Editor } from './Forms';
import { BusinessObligationStore } from './store';
import type { ObligationsSnapshot,SUTOffer } from './types';
export default function ObligationsScreen(){
 const params=useLocalSearchParams<{holderId:string}>();
 const [holderId,setHolderId]=useState(params.holderId??''),[flow,setFlow]=useState<'ivu'|'contractors'>('ivu'),[providerId,setProviderId]=useState('');
 const [data,setData]=useState<ObligationsSnapshot>(),[store,setStore]=useState<BusinessObligationStore>(),[error,setError]=useState(''),[editor,setEditor]=useState<Editor>(),[offer,setOffer]=useState<SUTOffer>(),[sources,setSources]=useState(false);
 const [month,setMonth]=useState(''),[year,setYear]=useState(''),[voiding,setVoiding]=useState<{kind:'collection'|'payment'|'obligation';id:string}>(),[reason,setReason]=useState('');
 const load=useCallback(async()=>{const s=new BusinessObligationStore(await getMoneyStore());setData(await s.snapshot());setStore(s);},[]);
 useEffect(()=>{let live=true;void getMoneyStore().then(async ledger=>{const s=new BusinessObligationStore(ledger),snapshot=await s.snapshot();if(live){setData(snapshot);setStore(s);}}).catch(e=>{if(live)setError(userMessage(e));});return()=>{live=false;};},[]);
 async function done(){setEditor(undefined);await load();}
 const activeHolder=data?.holders.find(h=>h.id===holderId);
 const summary=data&&validMonth(month)?sutSummary(data,holderId,month):undefined;
 const contractors=data&&providerId&&/^\d{4}$/.test(year)?contractorSummary(data,holderId,providerId,year):undefined;
 function open(kind:Editor,o?:SUTOffer){setOffer(o);setEditor(kind);}
 const voidButton=(kind:'collection'|'payment'|'obligation',id:string)=><ActionButton title="Anular este registro" secondary onPress={()=>{setReason('');setVoiding({kind,id});}}/>;
 return <Screen title="IVU y contratistas" subtitle="Simuladores y registros de obligaciones locales." demo={false} keyboardForm>
 <ActionButton title="Volver a Negocio" secondary onPress={()=>router.dismissTo('/business')}/><ErrorNotice message={error}/>
 <Card><Body>{RULE_VERSION} · Fuentes verificadas: {VERIFIED_ON}. Cada simulación muestra supuestos y datos pendientes. Las cifras calculadas no confirman cobro, retención, depósito ni radicación. No se exige revisión de CPA para simular.</Body><ActionButton title={sources?'Ocultar fuentes oficiales':'Ver fuentes y vigencia'} secondary onPress={()=>setSources(!sources)}/></Card>
 {sources?ruleSources.filter(s=>flow==='ivu'?['ivu2026','monthly','municipal','digital','marketplace','b2b'].includes(s.id):['sp2026','sp2','deposits','exceptions'].includes(s.id)).map(s=><Card key={s.id}><Body>{s.name} · {s.effective}</Body><Body>{s.summary}</Body><ActionButton title={`Abrir fuente: ${s.name}`} secondary onPress={()=>void Linking.openURL(s.url).catch(e=>setError(userMessage(e)))}/></Card>):null}
 {data?<Choices label="Titular legal pagador / vendedor" value={holderId} options={data.holders.map(h=>[h.id,h.legalName] as const)} onChange={h=>{setHolderId(h);setEditor(undefined);}}/>:<Body>Abriendo registros locales…</Body>}
 <Choices<'ivu'|'contractors'> label="Flujo de obligaciones" value={flow} options={[["ivu","IVU"],["contractors","Contratistas"]]} onChange={f=>{setFlow(f);setEditor(undefined);}}/>
 {!activeHolder?<Card><Body>Selecciona o crea primero el titular legal en Negocio.</Body></Card>:data&&store?<>
 <Body>{activeHolder.legalName}</Body>
 {flow==='ivu'?<>
 <Field label="Mes de consulta AAAA-MM" value={month} onChangeText={setMonth}/>
 {summary?<Card><Body>IVU cobrado por el titular: {show(summary.collectedCents)}. Remitido confirmado: {show(summary.remittedCents)}.</Body><Body>Diferencia entre registros: {show(summary.differenceCents)}; no representa deuda contributiva final.</Body><Body>Cobrado por facilitadores: {show(summary.marketplaceCents)}, separado del titular. Responsable pendiente: {summary.actorPending}; importes pendientes: {summary.pendingRecords}.</Body></Card>:null}
 <ActionButton title="Añadir oferta de IVU" onPress={()=>open('offer')}/>
 {data.offers.filter(o=>o.offer.holderId===holderId).map(({offer:o})=><Card key={o.id}><Body>{o.name} · {o.nature||'Naturaleza pendiente'}</Body><ActionButton title={`Revisar oferta: ${o.name}`} secondary onPress={()=>open('offer',o)}/><ActionButton title={`Simular o registrar IVU: ${o.name}`} onPress={()=>open('collection',o)}/></Card>)}
 {data.collections.filter(c=>c.holderId===holderId&&(!month||c.date.startsWith(month))).map(c=><Card key={c.id}><Body>{c.offerSnapshot.name} · {c.date} · Cobrado: {show(collectionTotal(c))}</Body><Body>{c.actor==='merchant'?'Titular':c.actor==='marketplace'?'Facilitador':'Responsable pendiente'} · {c.voidedAt?'Anulado: '+c.voidReason:c.note}</Body>{!c.voidedAt?voidButton('collection',c.id):null}</Card>)}
 </>:<>
 <Field label="Año natural de consulta AAAA" value={year} onChangeText={setYear}/>
 <ActionButton title="Añadir proveedor legal" onPress={()=>open('provider')}/>
 <Choices label="Proveedor legal, compartido entre sus DBA" value={providerId} options={data.providers.map(p=>[p.id,p.name] as const)} onChange={p=>{setProviderId(p);setEditor(undefined);}}/>
 {data.providers.filter(p=>p.id===providerId).map(p=><Card key={p.id}><Body>{p.name} · {providerLabels[p.classification]} · {p.reference}</Body><Body>Un mismo proveedor conserva su acumulado aunque trabaje en varios proyectos o DBA.</Body></Card>)}
 {providerId?<><ActionButton title="Revisar proveedor" secondary onPress={()=>open('providerEdit')}/><ActionButton title="Registrar relevo o declaración" secondary onPress={()=>open('relief')}/><ActionButton title="Simular o registrar pago al contratista" onPress={()=>open('payment')}/></>:null}
 {contractors?<Card><Body>Servicios registrados: {show(contractors.servicesCents)}. Retención estimada: {show(contractors.expectedWithheldCents)}. Retención real: {show(contractors.actualWithheldCents)}.</Body><Body>Casos pendientes: {contractors.pendingCount}; pagos registrados: {contractors.count}. Los depósitos de este titular se muestran aparte, sin atribuirlos automáticamente a un proveedor.</Body></Card>:null}
 {data.reliefs.filter(r=>r.providerId===providerId).map(r=><Card key={r.id}><Body>Documento: {r.reference} · {r.validFrom} a {r.validTo??'sin fecha final registrada'}</Body></Card>)}
 {data.payments.filter(p=>p.holderId===holderId&&p.providerId===providerId&&(!year||p.date.startsWith(year))).map(p=>{const r=evaluateWithholding(p,data.payments,data.providers,data.reliefs);return <Card key={p.id}><Body>{p.date} · Servicios {show(p.servicesCents)} · Neto real {show(p.actualNetCents)}</Body><Body>Retenido realmente {show(p.actualWithheldCents)} · Simulación actual {show(r.expectedWithheldCents)}.</Body><Body>{p.voidedAt?'Anulado: '+p.voidReason:p.note}</Body>{r.pending.map((v,i)=><Body key={i}>{v}</Body>)}{!p.voidedAt?voidButton('payment',p.id):null}</Card>;})}
 </>}
 <ActionButton title={flow==='ivu'?'Registrar remesa de IVU':'Registrar depósito de retenciones'} onPress={()=>open('remittance')}/>
 <ActionButton title="Registrar presentación de formulario" secondary onPress={()=>open('filing')}/>
 {data.obligations.filter(o=>o.holderId===holderId&&o.flow===flow).map(o=><Card key={o.id}><Body>{o.form==='deposit'?'Pago / depósito':o.form} · {o.period} · {o.scope==='state'?'estatal':o.scope==='municipal'?'municipal':o.scope==='services'?'servicios':'consolidado'} {o.municipality}</Body><Body>{o.voidedAt?'Anulado':o.status==='confirmed'?'Confirmado':o.status==='not_applicable'?'No aplica':'Pendiente'} · {o.kind==='remittance'?show(o.amountCents):'Radicación, sin registrar otro pago'}</Body><Body>Vencimiento {o.dueDate?'verificado':'base por confirmar'}: {o.dueDate??obligationBaseDue(o)??'consultar municipio'}. {o.dueSource}</Body><Body>{o.reference} · {o.note}</Body>{!o.voidedAt?voidButton('obligation',o.id):null}</Card>)}
 {editor?<Sheet title={editor==='offer'?'Oferta de IVU':(editor==='provider'||editor==='providerEdit')?'Proveedor legal':editor==='relief'?'Relevo o excepción':editor==='collection'?'IVU: simulación y cobro':editor==='payment'?'Pago al contratista':editor==='filing'?'Presentación de formulario':'Depósito / remesa'} close={()=>setEditor(undefined)}><Forms key={`${editor}-${offer?.id??'new'}`} kind={editor} data={data} holderId={holderId} providerId={providerId} offer={offer} flow={flow} store={store} done={()=>void done().catch(e=>setError(userMessage(e)))}/></Sheet>:null}
 {voiding?<Sheet title="Anular registro de obligación" close={()=>setVoiding(undefined)}><Body>Conserva el historial. Esto no modifica movimientos financieros, pagos ni trámites ya realizados.</Body><Field label="Motivo de anulación" value={reason} onChangeText={setReason}/><ActionButton title="Confirmar anulación" onPress={()=>void store.voidRecord(voiding.kind,voiding.id,reason).then(async()=>{setVoiding(undefined);await load();}).catch(e=>setError(userMessage(e)))}/></Sheet>:null}
 </>:null}
 </Screen>;
}
