import {useEffect,useState} from 'react';
import {Image,View} from 'react-native';
import {ActionMenu,CameraActionButton,type MenuAction} from '../../ui/ActionMenu';
import {router} from 'expo-router';
import {newId} from '../../core/id';
import {parseAmount} from '../../core/money';
import {userMessage,UserInputError} from '../../core/errors';
import {DateField} from '../../ui/DateField';
import {ActionButton,Body,Card,Screen,SectionHeading} from '../../ui/components';
import {Choices,ErrorNotice,Field} from '../money/fields';
import {formatMoney,localToday,validDate} from '../money/domain';
import {getMoneyStore} from '../money/localStore';
import {getDocumentStore} from '../documents/localStore';
import {DuplicateDocumentError} from '../documents/store';
import {captureImage} from '../documents/capture';
import type {ImageData,Source} from '../documents/types';
import {IncomeStore} from './store';
import {deductionCategories,statementTotals,type DeductionCategory,type IncomeStatement} from './domain';
import {recognizeIncome} from './recognition';
type Line={id:string;categoryId:string;label:string;amount:string};
export default function IncomeDocumentsScreen(){
 const [store,setStore]=useState<IncomeStore>(),[categories,setCategories]=useState<DeductionCategory[]>([...deductionCategories]);
 const [history,setHistory]=useState<Awaited<ReturnType<IncomeStore['snapshot']>>['statements']>([]);
 const [kind,setKind]=useState<'paystub'|'check'>('paystub'),[issuer,setIssuer]=useState(''),[reference,setReference]=useState('');
 const [date,setDate]=useState(localToday()),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const [gross,setGross]=useState(''),[net,setNet]=useState(''),[lines,setLines]=useState<Line[]>([]);
 const [method,setMethod]=useState('check'),[complete,setComplete]=useState('pending'),[received,setReceived]=useState('no');
 const [image,setImage]=useState<ImageData|null>(null),[keep,setKeep]=useState('yes'),[source,setSource]=useState<Source>('manual');
 const [warnings,setWarnings]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [similarKey,setSimilarKey]=useState(''),[confirmedKey,setConfirmedKey]=useState('');
 const [categoryName,setCategoryName]=useState(''),[adding,setAdding]=useState(false);const [id,setId]=useState(newId);
 async function refresh(s:IncomeStore){const data=await s.snapshot();setCategories(data.categories);setHistory(data.statements);}
 useEffect(()=>{let active=true;void getMoneyStore().then(async ledger=>{const s=new IncomeStore(ledger);const data=await s.snapshot();if(active){setStore(s);setCategories(data.categories);setHistory(data.statements);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[]);
 const optional=(value:string)=>value.trim()?parseAmount(value.trim()):null;
 function draft():IncomeStatement{return {version:1,kind,issuer:issuer.trim(),reference:reference.trim(),periodStart:start||null,periodEnd:end||null,grossCents:optional(gross),netCents:parseAmount(net.trim()),deductions:lines.map(d=>({id:d.id,categoryId:d.categoryId,label:d.label.trim()||categories.find(c=>c.id===d.categoryId)?.name||'Deducción',amountCents:optional(d.amount)})),complete:complete==='complete'};}
 const reviewKey=JSON.stringify([kind,issuer,reference,date,start,end,gross,net,lines,method]);
 function update(id:string,change:Partial<Line>){setLines(old=>old.map(d=>d.id===id?{...d,...change}:d));setComplete('pending');}
 async function capture(from:'camera'|'library'){if(busy)return;setBusy(true);setError('');try{const result=await captureImage(from);if(!result)return;const parsed=recognizeIncome(result.text,kind==='check');setImage(result.image);setSource(from);setKeep('yes');setIssuer(parsed.issuer);setGross(parsed.gross);setNet(parsed.net);setDate(parsed.date);setLines(parsed.deductions.map(d=>({...d,id:newId()})));setWarnings([result.warning,...parsed.warnings].filter(Boolean));setComplete('pending');setReceived('no');}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 async function createCategory(){if(!store||busy)return;setBusy(true);setError('');try{const categoryId=newId();await store.addCategory(categoryId,categoryName);await refresh(store);setLines(old=>[...old,{id:newId(),categoryId,label:categoryName.trim(),amount:''}]);setComplete('pending');setCategoryName('');setAdding(false);}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 async function save(){if(busy||!store)return;setBusy(true);setError('');setNotice('');try{
  if(received!=='yes')throw new UserInputError('Confirma que ya recibiste el ingreso. La foto de un cheque no confirma que fue cobrado o recibido.');
  if(!validDate(date))throw new UserInputError('Confirma la fecha del pago con el calendario.');
  const statement=draft();statementTotals(statement);
  const docs=await getDocumentStore();await docs.save({id,kind:'paid_income',source,description:issuer.trim()|| (kind==='check'?'Cheque recibido':'Talonario de pago'),date,amountCents:statement.netCents,notes:'Comprobante de ingreso revisado. Deducciones del empleado conservadas en su desglose, sin crear gastos separados.',rawText:null,image,keepImage:!!image&&keep==='yes',movementId:null,billId:null,expectedMovementVersion:null,expectedBillVersion:null,categoryId:null,paymentMethod:method,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:confirmedKey===reviewKey,reviewed:true,incomeStatement:statement});
  await refresh(store);setId(newId());setImage(null);setIssuer('');setReference('');setGross('');setNet('');setLines([]);setStart('');setEnd('');setWarnings([]);setSource('manual');setComplete('pending');setReceived('no');setNotice('Ingreso neto y comprobante guardados. Sus deducciones no se sumaron otra vez como gastos. La copia se consulta en Mis documentos.');
 }catch(e){if(!(e instanceof DuplicateDocumentError)&&userMessage(e).includes('similar'))setSimilarKey(reviewKey);setError(e instanceof DuplicateDocumentError?'Este comprobante ya existe. Abre Mis documentos; no se creó otro ingreso.':userMessage(e));}finally{setBusy(false);}}
 const actions:MenuAction[]=[
  {id:'library',label:'Seleccionar foto del comprobante',run:()=>void capture('library')},
  {id:'manual',label:'Entrada manual sin foto ni talonario',run:()=>{setImage(null);setSource('manual');setWarnings(['Entrada manual: escribe solo lo que conoces. Los datos desconocidos pueden quedar pendientes.']);setComplete('pending');}},
  {id:'deduction',label:'Añadir deducción',run:()=>{setLines(old=>[...old,{id:newId(),categoryId:'other',label:'',amount:''}]);setComplete('pending');}},
  {id:'category',label:adding?'Cancelar categoría nueva':'Crear categoría de deducción',run:()=>setAdding(!adding)},
  {id:'documents',label:'Abrir Mis documentos',run:()=>router.push('/documents')},
  {id:'tax',label:'Revisar Para mi contable',run:()=>router.push('/tax')},
 ];
 let totals:ReturnType<typeof statementTotals>|null=null;try{totals=statementTotals({...draft(),complete:false});}catch{}
 return <Screen back title="Cheques y talonarios" demo={false} subtitle="Reconocimiento local y revisión de deducciones de tus ingresos.">
  <ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  <Card><Body>Fotografía el talonario completo y enfocado. Se propone información impresa; no se calculan tasas ni se decide qué retenciones deberían aplicar. Revisa la columna del pago actual y distingue acumulados y aportaciones patronales.</Body><Body muted>La foto se procesa en este dispositivo. No se extraen ni guardan números de Seguro Social o cuentas como campos. Una imagen conservada puede contenerlos: recórtala o decide no guardar la copia.</Body></Card>
  <Choices label="Tipo de comprobante" value={kind} options={[[ 'paystub','Talonario de pago'],['check','Cheque']]} onChange={value=>{setKind(value);setComplete('pending');}}/>
  {!busy?<View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}><CameraActionButton label="Fotografiar cheque o talonario" onPress={()=>void capture('camera')}/><ActionMenu actions={actions}/></View>:<Body>Procesando localmente…</Body>}
  {adding?<Card><Field label="Nombre de categoría" value={categoryName} onChangeText={setCategoryName} maxLength={60}/>{!busy?<ActionButton title="Guardar categoría y añadir deducción" onPress={()=>void createCategory()}/>:null}</Card>:null}
  {warnings.length?<Card>{warnings.map((w,i)=><Body key={i}>{w}</Body>)}</Card>:null}
  {image?<Card><Image accessibilityLabel="Foto del cheque o talonario en revisión" source={{uri:`data:${image.mime};base64,${image.base64}`}} style={{width:'100%',height:280}} resizeMode="contain"/><Choices label="Conservar foto" value={keep} options={[[ 'yes','Conservar copia local cifrada'],['no','Conservar solo los datos confirmados']]} onChange={setKeep}/></Card>:null}
  <Field label="Pagador o patrono (opcional)" value={issuer} onChangeText={setIssuer} maxLength={240}/><Field label="Referencia del cheque o pago (opcional)" value={reference} onChangeText={setReference}/>
  <DateField label="Fecha del pago" value={date} onChangeText={setDate} required max={localToday()}/>
  {kind==='paystub'?<><DateField label="Inicio del período (opcional)" value={start} onChangeText={setStart}/><DateField label="Fin del período (opcional)" value={end} onChangeText={setEnd}/></>:null}
  <Field label="Bruto impreso (USD, desconocido si vacío)" value={gross} onChangeText={v=>{setGross(v);setComplete('pending');}} decimal/>
  <Field label="Neto impreso del cheque o talonario (USD)" required value={net} onChangeText={v=>{setNet(v);setComplete('pending');}} decimal/>
  <SectionHeading title="Deducciones de este pago"/><Card><Body>Incluye contribución PR o federal, Seguro Social, Medicare, SINOT, plan médico, retiro u otras partidas solo si aparecen. «Tax» o «FICA» sin desglose requieren confirmar la categoría. No se supone que una deducción aplique por vivir en Puerto Rico.</Body><Body muted>Los importes patronales y los acumulados del año no son deducciones de este pago.</Body></Card>
  {lines.map((line,i)=><Card key={line.id}><Choices required label={`Categoría de deducción ${i+1}`} value={line.categoryId} options={categories.map(c=>[c.id,c.name] as const)} onChange={categoryId=>update(line.id,{categoryId,label:categories.find(c=>c.id===categoryId)?.name??''})}/><Field label="Descripción (opcional)" value={line.label} onChangeText={label=>update(line.id,{label})} maxLength={240}/><Field label="Importe de deducción (USD, vacío si pendiente)" value={line.amount} onChangeText={amount=>update(line.id,{amount})} decimal/><ActionButton title={`Quitar deducción ${i+1}`} secondary onPress={()=>{setLines(old=>old.filter(d=>d.id!==line.id));setComplete('pending');}}/></Card>)}
  {totals?<Card><Body>Deducciones conocidas de este pago: {formatMoney(totals.known)}</Body><Body>{totals.difference===null?'Bruto pendiente; no se comprueba la conciliación.':`Diferencia por explicar entre bruto, deducciones conocidas y neto: ${formatMoney(totals.difference)}`}</Body>{!totals.allKnown?<Body>Hay deducciones con importe pendiente; el subtotal conocido está incompleto.</Body>:null}</Card>:null}
  <Choices label="Estado del desglose" value={complete} options={[[ 'pending','Conservar datos pendientes de revisión'],['complete','Revisé todas las deducciones y el total cuadra']]} onChange={setComplete}/>
  <Choices label="Cómo recibí el ingreso" value={method} options={[[ 'check','Cheque'],['bank','Depósito bancario'],['cash','Efectivo'],['other','Otro']]} onChange={setMethod}/>
  <Choices required label="Confirmación del ingreso" value={received} options={[[ 'no','Todavía no confirmo haberlo recibido'],['yes','Confirmo que ya recibí este ingreso y revisé las cifras']]} onChange={setReceived}/>
  {similarKey===reviewKey?<Choices label="Coincidencia con otro registro" value={confirmedKey===reviewKey?'yes':'no'} options={[[ 'no','Revisar el ingreso existente'],['yes','Verifiqué que es un pago distinto con su propia referencia']]} onChange={value=>setConfirmedKey(value==='yes'?reviewKey:'')}/>:null}
  <ErrorNotice message={error}/>{!busy&&store?<ActionButton title="Guardar ingreso neto y desglose revisado" onPress={()=>void save()}/>:null}
  <SectionHeading title="Comprobantes guardados"/>{!history.length?<Card><Body>Todavía no hay cheques o talonarios guardados en esta sección.</Body></Card>:null}
  {history.slice(0,30).map(row=><Card key={row.documentId}><Body style={{fontWeight:'700'}}>{row.statement.issuer||'Comprobante de ingreso'}</Body><Body>Neto registrado: {formatMoney(row.statement.netCents)} · {row.statement.complete?'Desglose revisado':'Desglose pendiente'}</Body>{row.statement.deductions.map(d=><Body key={d.id}>{d.label||categories.find(c=>c.id===d.categoryId)?.name}: {d.amountCents===null?'Pendiente':formatMoney(d.amountCents)}</Body>)}<Body muted>Estos son los datos originales del comprobante. Si corriges su movimiento en Mis documentos, vuelve a conciliar con esta evidencia.</Body></Card>)}
 </Screen>;
}
