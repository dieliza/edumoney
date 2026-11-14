import {PhotoAnalysis} from '../../ui/PhotoAnalysis';
import {ReadingDetailsForm} from '../documents/ReadingDetailsForm';
import {reviewedReading} from '../documents/ai/details';
import type {AnthropicReading} from '../documents/ai/types';
import {anthropicIncome} from '../documents/ai/types';
import {useEffect,useState} from 'react';
import {Image,View} from 'react-native';
import {ActionMenu,CameraActionButton,type MenuAction} from '../../ui/ActionMenu';
import {router} from 'expo-router';
import {newId} from '../../core/id';
import {parseAmount,addAmounts,cents} from '../../core/money';
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
import {IncomeStore,payerHistory,type IncomeHistory} from './store';
import {blankRule,calculateDeduction,type DeductionRule} from './calculation';
import {DeductionRuleEditor} from './DeductionRuleEditor';
import {deductionCategories,statementTotals,type DeductionCategory,type IncomeStatement} from './domain';
import type {RecognizedEarning} from './paystubTable';
import {recognizeIncome} from './recognition';
type Line={id:string;categoryId:string;label:string;amount:string;rule?:DeductionRule};
export default function IncomeDocumentsScreen(){
 const [store,setStore]=useState<IncomeStore>(),[categories,setCategories]=useState<DeductionCategory[]>([...deductionCategories]);
 const [history,setHistory]=useState<Awaited<ReturnType<IncomeStore['snapshot']>>['statements']>([]);
 const [kind,setKind]=useState<'paystub'|'check'>('paystub'),[issuer,setIssuer]=useState(''),[reference,setReference]=useState('');
 const [date,setDate]=useState(localToday()),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const [readingText,setReadingText]=useState(''),[showReading,setShowReading]=useState(false);
 const [earningIndex,setEarningIndex]=useState('0');
 const [earnings,setEarnings]=useState<RecognizedEarning[]>([]);
 const [gross,setGross]=useState(''),[net,setNet]=useState(''),[lines,setLines]=useState<Line[]>([]);
 const [method,setMethod]=useState('check'),[complete,setComplete]=useState('pending'),[received,setReceived]=useState('no');
 const [image,setImage]=useState<ImageData|null>(null),[keep,setKeep]=useState('yes'),[source,setSource]=useState<Source>('manual');
 const [reading,setReading]=useState<AnthropicReading>();
 const [photoBusy,setPhotoBusy]=useState(false);
 const [warnings,setWarnings]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [similarKey,setSimilarKey]=useState(''),[confirmedKey,setConfirmedKey]=useState('');
 const [editing,setEditing]=useState<IncomeHistory|null>(null),[autoNet,setAutoNet]=useState('no');
 const [categoryId,setCategoryId]=useState(''),[categoryRule,setCategoryRule]=useState<DeductionRule>(blankRule),[useRule,setUseRule]=useState('no');
 const [categoryName,setCategoryName]=useState(''),[adding,setAdding]=useState(false);const [id,setId]=useState(newId);
 async function refresh(s:IncomeStore){const data=await s.snapshot();setCategories(data.categories);setHistory(data.statements);}
 useEffect(()=>{let active=true;void getMoneyStore().then(async ledger=>{const s=new IncomeStore(ledger);const data=await s.snapshot();if(active){setStore(s);setCategories(data.categories);setHistory(data.statements);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[]);
 const optional=(value:string)=>value.trim()?parseAmount(value.trim()):null;
 function calculatedLine(d:Line){const calculation=d.rule?calculateDeduction(d.rule,optional(gross),d.rule.base==='threshold'&&d.rule.mode==='percentage'?payerHistory(history,d.rule.payer,d.rule.year,date,editing?.documentId):0):undefined;return {id:d.id,categoryId:d.categoryId,label:d.label.trim()||categories.find(c=>c.id===d.categoryId)?.name||'Deducción',amountCents:calculation?.amountCents??optional(d.amount),...(calculation?{calculation}: {})};}
 function draft():IncomeStatement{const deductions=lines.map(calculatedLine);const g=optional(gross);if(autoNet==='yes'&&(g===null||deductions.some(d=>d.amountCents===null)))throw new UserInputError('Completa el bruto y todas las deducciones para calcular el neto.');return {version:1,...(earnings.length?{earnings}:{}),kind,issuer:issuer.trim(),reference:reference.trim(),periodStart:start||null,periodEnd:end||null,grossCents:g,netCents:autoNet==='yes'?cents(g!-addAmounts(...deductions.map(d=>cents(d.amountCents!)))):parseAmount(net.trim()),totalDeductionsCents:deductions.every(d=>d.amountCents!==null)?addAmounts(...deductions.map(d=>cents(d.amountCents!))):null,deductions,complete:complete==='complete'};}
 function addDeduction(){setLines(old=>[...old,{id:newId(),categoryId:'other',label:'',amount:''}]);setComplete('pending');}
 function selectCategory(line:Line,categoryId:string){const c=categories.find(c=>c.id===categoryId);update(line.id,{categoryId,label:c?.name??'',rule:c?.rule?.active?{...c.rule}:undefined});}
 function openCategory(category?:DeductionCategory){setCategoryId(category?.id??'');setCategoryName(category?.name??'');setCategoryRule(category?.rule?{...category.rule}:blankRule());setUseRule(category?.rule?'yes':'no');setAdding(true);}
 function openStatement(row:IncomeHistory){const p=row.statement;setReading(undefined);setReadingText('');setShowReading(false);setEarningIndex('0');setEarnings(p.earnings??[]);setEditing(row);setKind(p.kind);setIssuer(p.issuer);setReference(p.reference);setDate(row.date);setStart(p.periodStart??'');setEnd(p.periodEnd??'');setGross(p.grossCents===null?'':(p.grossCents/100).toFixed(2));setNet((p.netCents/100).toFixed(2));setLines(p.deductions.map(d=>({id:d.id,categoryId:d.categoryId,label:d.label,amount:d.amountCents===null?'':(d.amountCents/100).toFixed(2),rule:d.calculation?{...d.calculation.rule}:undefined})));setAutoNet('no');setMethod(row.method||'check');setComplete('pending');setReceived('no');setImage(null);setError('');setNotice('Editando este cheque. Su foto original se conserva; otros cheques no se recalcularán.');}
 function clearForm(){setReading(undefined);setReadingText('');setShowReading(false);setEarningIndex('0');setEarnings([]);setEditing(null);setId(newId());setImage(null);setIssuer('');setReference('');setGross('');setNet('');setLines([]);setStart('');setEnd('');setWarnings([]);setSource('manual');setComplete('pending');setReceived('no');setAutoNet('no');}

 const reviewKey=JSON.stringify([kind,issuer,reference,date,start,end,gross,net,lines,method]);
 function update(id:string,change:Partial<Line>){setLines(old=>old.map(d=>d.id===id?{...d,...change}:d));setComplete('pending');}
 async function capture(from:'camera'|'library'){if(busy)return;setPhotoBusy(true);setBusy(true);setError('');try{const result=await captureImage(from);if(!result)return;if(result.structured?.document_type==='receipt')throw new UserInputError('Esta foto se identificó como recibo de compra. Abre Escaneo y documentos para registrarlo.');setReading(result.structured);setReference(result.structured?.details?.reference??'');if(result.structured?.details?.payment_method)setMethod(result.structured.details.payment_method);const parsed=result.structured?anthropicIncome(result.structured):recognizeIncome(result.text,kind==='check');if(result.structured)setKind(result.structured.document_type==='check'?'check':'paystub');setReadingText(result.text);setShowReading(false);setImage(result.image);setSource(from);setKeep('yes');setIssuer(parsed.issuer);setGross(parsed.gross);setNet(parsed.net);setDate(parsed.date);setStart(parsed.periodStart);setEnd(parsed.periodEnd);setEarningIndex('0');setEarnings(parsed.earnings);setLines(parsed.deductions.map(d=>({...d,amount:d.amount,id:newId()})));setWarnings([result.warning,...parsed.warnings].filter(Boolean));setComplete('pending');setReceived('no');}catch(e){setError(userMessage(e));}finally{setPhotoBusy(false);setBusy(false);}}
 async function createCategory(){if(!store||busy)return;setBusy(true);setError('');try{await store.saveCategory(categoryId||newId(),categoryName,useRule==='yes'?categoryRule:categoryId?{...blankRule(),active:false}:undefined,!!categoryId);await refresh(store);setAdding(false);setNotice('Categoría guardada para futuros pagos. Los cheques y las deducciones ya abiertos conservan sus reglas originales.');}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 async function save(){if(busy||!store)return;setBusy(true);setError('');setNotice('');try{
  if(received!=='yes')throw new UserInputError('Confirma que ya recibiste el ingreso. La foto de un cheque no confirma que fue cobrado o recibido.');
  if(!validDate(date))throw new UserInputError('Confirma la fecha del pago con el calendario.');
  const statement=draft();statementTotals(statement);
  if(editing){await store.editStatement(editing,statement,date,method);}else{const docs=await getDocumentStore();await docs.save({...(reading?{reading:reviewedReading({...reading,period_start:statement.periodStart,period_end:statement.periodEnd,gross_cents:statement.grossCents,net_cents:statement.netCents,deductions:statement.deductions.map(d=>({label:d.label,category:d.categoryId,amount_cents:d.amountCents}))},statement.issuer,date,statement.netCents,reading.details?{...reading.details,reference:statement.reference||null}:undefined)}:{}),id,kind:'paid_income',source,description:issuer.trim()|| (kind==='check'?'Cheque recibido':'Talonario de pago'),date,amountCents:statement.netCents,notes:'Comprobante de ingreso revisado. Deducciones del empleado conservadas en su desglose, sin crear gastos separados.',rawText:null,image,keepImage:!!image&&keep==='yes',movementId:null,billId:null,expectedMovementVersion:null,expectedBillVersion:null,categoryId:null,paymentMethod:method,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:confirmedKey===reviewKey,reviewed:true,incomeStatement:statement});}
  await refresh(store);clearForm();setNotice('Cheque y desglose guardados. El neto se cuenta una sola vez. Las retenciones se conservan separadas de los gastos ordinarios.');
 }catch(e){if(!(e instanceof DuplicateDocumentError)&&userMessage(e).includes('similar'))setSimilarKey(reviewKey);setError(e instanceof DuplicateDocumentError?'Este comprobante ya existe. Abre Mis documentos; no se creó otro ingreso.':userMessage(e));}finally{setBusy(false);}}
 const actions:MenuAction[]=[
  {id:'library',label:'Seleccionar foto del comprobante',run:()=>void capture('library')},
  {id:'manual',label:'Entrada manual sin foto ni talonario',run:()=>{setImage(null);setReading(undefined);setSource('manual');setWarnings(['Entrada manual: escribe solo lo que conoces. Los datos desconocidos pueden quedar pendientes.']);setComplete('pending');}},
  {id:'deduction',label:'Añadir deducción',run:addDeduction},
  {id:'category',label:'Añadir categoría',run:()=>openCategory()},
  {id:'documents',label:'Abrir Mis documentos',run:()=>router.push('/documents')},
  {id:'tax',label:'Revisar Para mi contable',run:()=>router.push('/tax')},
 ];
 let previewNet:string;try{const g=optional(gross),deductions=lines.map(calculatedLine);previewNet=g!==null&&deductions.every(d=>d.amountCents!==null)?`Neto según el desglose: ${formatMoney(cents(g-addAmounts(...deductions.map(d=>cents(d.amountCents!)))))} (bruto menos deducciones).`:'Completa el bruto y las deducciones para ver el neto calculado.';}catch(e){previewNet=userMessage(e);}
 let totals:ReturnType<typeof statementTotals>|null=null;try{totals=statementTotals({...draft(),complete:false});}catch{}
 return <Screen back title="Cheques y talonarios" demo={false} subtitle="Lectura de imágenes y revisión de deducciones de tus ingresos.">
  <ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  <Card><Body>Fotografía el talonario completo y enfocado. Se propone información impresa. Puedes calcular las deducciones con tus propias reglas y porcentajes; no se elige una tasa contributiva por ti. Revisa la columna del pago actual y distingue acumulados y aportaciones patronales.</Body><Body muted>Revisa la lectura antes de guardar. No se extraen ni guardan números de Seguro Social o cuentas como campos. Una imagen conservada puede contenerlos: recórtala o decide no guardar la copia.</Body></Card>
  <Choices label="Tipo de comprobante" value={kind} options={[[ 'paystub','Talonario de pago'],['check','Cheque']]} onChange={value=>{setKind(value);setComplete('pending');}}/>
  {photoBusy?<PhotoAnalysis/>:null}
  {!busy&&!editing?<View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}><CameraActionButton label={image?'Volver a tomar foto':'Fotografiar cheque o talonario'} onPress={()=>void capture('camera')}/><ActionMenu actions={actions}/></View>:busy&&!photoBusy?<Body>Guardando cambios…</Body>:null}
  {editing?<Card><Body>Editando: {editing.statement.reference||editing.documentId}</Body><ActionButton title="Cancelar edición" secondary onPress={clearForm}/></Card>:null}
  {reading?.details?<ReadingDetailsForm value={reading.details} onChange={details=>setReading({...reading,details})}/>:null}
  <ActionMenu label="Administrar deducciones" actions={[{id:'add',label:'Añadir deducción',run:addDeduction},{id:'new-category',label:'Añadir categoría',run:()=>openCategory()},...categories.map(c=>({id:c.id,label:`Editar ${c.name}`,run:()=>openCategory(c)}))]}/>
  {adding?<Card><SectionHeading title={categoryId?'Editar categoría y regla':'Añadir categoría'}/>{deductionCategories.some(c=>c.id===categoryId)?<Body>{categoryName} (nombre original conservado)</Body>:<Field label="Nombre de categoría" required value={categoryName} onChangeText={setCategoryName} maxLength={60}/>}
   <Choices label="Regla para pagos futuros" value={useRule} options={[[ 'no','Sin cálculo automático'],['yes','Configurar regla']]} onChange={setUseRule}/>
   {useRule==='yes'?<DeductionRuleEditor rule={categoryRule} onChange={setCategoryRule} services={categoryId==='pr-services'} configuration/>:null}
   {!busy?<ActionButton title="Guardar categoría" onPress={()=>void createCategory()}/>:null}<ActionButton secondary title="Cerrar edición de categoría" onPress={()=>setAdding(false)}/><Body muted>Editar esta plantilla no modifica los importes históricos ni las deducciones ya añadidas al formulario.</Body></Card>:null}
  {readingText?<><ActionMenu label="Revisión del reconocimiento" actions={[{id:'reading',label:showReading?'Cerrar lectura completa':'Ver lectura completa del talonario',run:()=>setShowReading(!showReading)}]}/>{showReading?<Card><Body>Texto propuesto en memoria. Confirma los campos y conserva la foto para consultar toda la evidencia.</Body><Body>{readingText}</Body></Card>:null}</>:null}
  {warnings.length?<Card>{warnings.map((w,i)=><Body key={i}>{w}</Body>)}</Card>:null}
  {image?<Card><Image accessibilityLabel="Foto del cheque o talonario en revisión" source={{uri:`data:${image.mime};base64,${image.base64}`}} style={{width:'100%',height:280}} resizeMode="contain"/><Choices label="Conservar foto" value={keep} options={[[ 'yes','Conservar copia local cifrada'],['no','Conservar solo los datos confirmados']]} onChange={setKeep}/></Card>:null}
  <Field label="Pagador o patrono (opcional)" value={issuer} onChangeText={setIssuer} maxLength={240}/><Field label="Referencia del cheque o pago (opcional)" value={reference} onChangeText={setReference}/>
  <DateField label="Fecha del pago" value={date} onChangeText={setDate} required max={localToday()}/>
  {kind==='paystub'?<><DateField label="Inicio del período (opcional)" value={start} onChangeText={setStart}/><DateField label="Fin del período (opcional)" value={end} onChangeText={setEnd}/></>:null}
  <Field label="Bruto impreso (USD, desconocido si vacío)" required={autoNet==='yes'||lines.some(d=>d.rule?.mode==='percentage'&&['gross','threshold'].includes(d.rule.base))} calculationRequired={false} value={gross} onChangeText={v=>{setGross(v);setComplete('pending');}} decimal/>
  <Choices label="Ingreso neto" value={autoNet} options={[[ 'no','Confirmar neto impreso o recibido'],['yes','Calcular neto: bruto menos deducciones']]} onChange={v=>{setAutoNet(v);setComplete('pending');}}/>
  {autoNet==='no'?<Field label="Neto impreso del cheque o talonario (USD)" required value={net} onChangeText={v=>{setNet(v);setComplete('pending');}} decimal/>:<Card><Body>{(()=>{try{return `Neto calculado: ${formatMoney(draft().netCents)}`;}catch(e){return userMessage(e);}})()}</Body></Card>}
  {earnings.length?<><SectionHeading title="Ingresos por código, tarifa y horas"/><Body>Revisa cada celda contra la foto. Las filas se conservan con el cheque; no se suman otra vez como ingresos.</Body><Choices label="Fila de ingresos del talonario" value={earningIndex} options={earnings.map((r,i)=>[String(i),`${r.code||'Sin código'} · ${r.amount?`$${r.amount}`:'Importe pendiente'}`] as const)} onChange={setEarningIndex}/>{earnings.map((r,i)=>i===Number(earningIndex)?<Card key={i}><Field label="Código de ingreso" value={r.code} maxLength={60} onChangeText={code=>setEarnings(old=>old.map((row,n)=>n===i?{...row,code}:row))}/><Field label="Tarifa impresa (USD, opcional)" value={r.rate} decimal onChangeText={rate=>setEarnings(old=>old.map((row,n)=>n===i?{...row,rate}:row))}/><Field label="Horas impresas (opcional)" value={r.hours} money={false} decimal onChangeText={hours=>setEarnings(old=>old.map((row,n)=>n===i?{...row,hours}:row))}/><Field label="Importe de esta fila (USD, opcional)" value={r.amount} decimal onChangeText={amount=>setEarnings(old=>old.map((row,n)=>n===i?{...row,amount}:row))}/></Card>:null)}</>:null}
  <SectionHeading title="Deducciones de este pago"/><Card><Body>Incluye contribución PR o federal, Seguro Social, Medicare, SINOT, plan médico, retiro u otras partidas solo si aparecen. «Tax» o «FICA» sin desglose requieren confirmar la categoría. No se supone que una deducción aplique por vivir en Puerto Rico.</Body><Body muted>Los importes patronales y los acumulados del año no son deducciones de este pago.</Body></Card>
  {lines.map((line,i)=>{let preview='',failure='';try{const d=calculatedLine(line);preview=`${d.calculation?.rule.mode==='percentage'?d.calculation.rule.percentage+'% · Base '+formatMoney(d.calculation.baseCents):'Importe fijo'} · ${d.amountCents===null?'Pendiente':formatMoney(d.amountCents)}`;if(d.calculation?.priorCents!==null&&d.calculation?.priorCents!==undefined)preview+=` · Acumulado previo: ${formatMoney(d.calculation.priorCents)}`;}catch(e){failure=userMessage(e);}return <Card key={line.id}><Choices required label={`Categoría de deducción ${i+1}`} value={line.categoryId} options={categories.map(c=>[c.id,c.name] as const)} onChange={categoryId=>selectCategory(line,categoryId)}/><ActionMenu label="Opciones de deducción" actions={[{id:'new',label:'Añadir categoría',run:()=>openCategory()},{id:'edit',label:'Editar categoría y regla futura',run:()=>openCategory(categories.find(c=>c.id===line.categoryId))},{id:'add',label:'Añadir deducción',run:addDeduction}]}/><Field label="Descripción (opcional)" value={line.label} onChangeText={label=>update(line.id,{label})} maxLength={240}/>
   <Choices label="Regla de esta deducción" value={line.rule?'calculate':'manual'} options={[[ 'manual','Importe manual'],['calculate','Calcular con una regla']]} onChange={v=>update(line.id,{rule:v==='calculate'?{...blankRule(),fixedCents:optional(line.amount)}:undefined})}/>
   {line.rule?<DeductionRuleEditor services={line.categoryId==='pr-services'} rule={line.rule} onChange={rule=>update(line.id,{rule})}/>:<Field label="Importe de deducción (USD, vacío si pendiente)" value={line.amount} onChangeText={amount=>update(line.id,{amount})} decimal/>}
   <Body>{categories.find(c=>c.id===line.categoryId)?.name} · {preview||failure}</Body><ActionButton title={`Quitar deducción ${i+1}`} secondary onPress={()=>{setLines(old=>old.filter(d=>d.id!==line.id));setComplete('pending');}}/></Card>;})}
  <ActionButton secondary title="Añadir deducción" onPress={addDeduction}/>

  <Card><Body>{previewNet}</Body></Card>
  {totals?<Card><Body>Deducciones conocidas de este pago: {formatMoney(totals.known)}</Body><Body>{totals.difference===null?'Bruto pendiente; no se comprueba la conciliación.':`Diferencia por explicar entre bruto, deducciones conocidas y neto: ${formatMoney(totals.difference)}`}</Body>{!totals.allKnown?<Body>Hay deducciones con importe pendiente; el subtotal conocido está incompleto.</Body>:null}</Card>:null}
  <Choices label="Estado del desglose" value={complete} options={[[ 'pending','Conservar datos pendientes de revisión'],['complete','Revisé todas las deducciones y el total cuadra']]} onChange={setComplete}/>
  <Choices label="Cómo recibí el ingreso" value={method} options={[[ 'check','Cheque'],['bank','Depósito bancario'],['cash','Efectivo'],['other','Otro']]} onChange={setMethod}/>
  <Choices required label="Confirmación del ingreso" value={received} options={[[ 'no','Todavía no confirmo haberlo recibido'],['yes','Confirmo que ya recibí este ingreso y revisé las cifras']]} onChange={setReceived}/>
  {similarKey===reviewKey?<Choices label="Coincidencia con otro registro" value={confirmedKey===reviewKey?'yes':'no'} options={[[ 'no','Revisar el ingreso existente'],['yes','Verifiqué que es un pago distinto con su propia referencia']]} onChange={value=>setConfirmedKey(value==='yes'?reviewKey:'')}/>:null}
  <ErrorNotice message={error}/>{!busy&&store?<ActionButton title={editing?'Guardar corrección de este cheque':'Guardar ingreso neto y desglose revisado'} onPress={()=>void save()}/>:null}
  <SectionHeading title="Comprobantes guardados"/>{!history.length?<Card><Body>Todavía no hay cheques o talonarios guardados en esta sección.</Body></Card>:null}
  {history.slice(0,30).map(row=><Card key={row.documentId}><Body style={{fontWeight:'700'}}>{row.statement.issuer||'Comprobante de ingreso'}</Body><Body>Neto registrado: {formatMoney(row.statement.netCents)} · {row.statement.complete?'Desglose revisado':'Desglose pendiente'}</Body>{row.statement.deductions.map(d=><Body key={d.id}>{d.label||categories.find(c=>c.id===d.categoryId)?.name}: {d.calculation?.rule.mode==='percentage'?`${d.calculation.rule.percentage}% · Base ${formatMoney(d.calculation.baseCents)} · `:''}{d.amountCents===null?'Pendiente':formatMoney(d.amountCents)}</Body>)}<ActionButton secondary title="Editar este cheque" onPress={()=>openStatement(row)}/><Body muted>Estos son los datos originales del comprobante. Si corriges su movimiento en Mis documentos, vuelve a conciliar con esta evidencia.</Body></Card>)}
 </Screen>;
}
