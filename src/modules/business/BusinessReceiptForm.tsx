import {announceSaved} from '../../ui/saveFeedback';
import {DateField} from '../../ui/DateField';
import {anthropicProposal,type AnthropicReading} from '../documents/ai/types';
import {reviewedReading} from '../documents/ai/details';
import {ReadingDetailsForm} from '../documents/ReadingDetailsForm';
import {ActionMenu,CameraActionButton} from '../../ui/ActionMenu';
import { proposeFields } from '../documents/domain';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { formatMoney } from '../money/domain';
import { userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../money/fields';
import { getDocumentStore } from '../documents/localStore';
import { captureImage } from '../documents/capture';
import type { ImageData } from '../documents/types';
import type { LedgerMovement } from '../money/types';
export function BusinessReceiptForm({movement,done,close}:{movement:LedgerMovement;done():Promise<void>;close():void}) {
 const [id]=useState(newId),[image,setImage]=useState<ImageData|null>(null),[source,setSource]=useState<'manual'|'camera'|'library'>('manual');
 const [description,setDescription]=useState(''),[date,setDate]=useState(''),[amount,setAmount]=useState(''),[notes,setNotes]=useState(''),[confirmed,setConfirmed]=useState('no');
 const [reading,setReading]=useState<AnthropicReading>();
 const [recognition,setRecognition]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function capture(from:'camera'|'library'){if(busy)return;setBusy(true);setError('');try{const result=await captureImage(from);if(result){setImage(result.image);setReading(result.structured);const proposal=result.structured?anthropicProposal(result.structured):proposeFields(result.text);setDescription(proposal.description);setDate(proposal.date);setAmount(result.needsAmountReview?'':proposal.amount);setRecognition(result.warning);setSource(from);setConfirmed('no');}}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 async function save(){if(busy)return;setBusy(true);setError('');try{
  const store=await getDocumentStore();
  await store.save({...(reading?{reading:reviewedReading(reading,description,date.trim()||null,amount.trim()?parseAmount(amount.trim()):null)}:{}),context:'business',id,kind:'attachment',source,description,date:date.trim()||null,amountCents:amount.trim()?parseAmount(amount.trim()):null,notes,rawText:null,image,keepImage:!!image,movementId:movement.id,billId:null,expectedMovementVersion:movement.version,expectedBillVersion:null,categoryId:null,paymentMethod:null,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:confirmed==='yes'});
  announceSaved();setImage(null);close();await done();
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title="Recibo del registro comercial" close={close} busy={busy} headerAction={<><ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar" onPress={()=>void save()}/>:null}</>}>
  <Body>Se adjunta a {movement.description} · {movement.date} · {formatMoney(movement.amountCents)}. No crea otro ingreso ni gasto. Si el recibo incluye uso personal y comercial, conserva el importe completo y revisa el porcentaje en el registro comercial.</Body>
  {!busy?<View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}><CameraActionButton label="Tomar foto del recibo" onPress={()=>void capture('camera')}/><ActionMenu actions={[
 {id:'library',label:'Seleccionar imagen del recibo',run:()=>void capture('library')},
 {id:'manual',label:'Entrada manual sin imagen',run:()=>{setImage(null);setReading(undefined);setSource('manual');}},
 ]}/></View>:null}
  {recognition?<Body>{recognition}</Body>:null}
  {image?<><Image source={{uri:`data:${image.mime};base64,${image.base64}`}} accessibilityLabel="Recibo que estás revisando" style={{width:'100%',height:260}} resizeMode="contain"/><Body>El comprobante comercial se conservará cifrado con sus datos.</Body></>:<Body>Puedes registrar los datos manualmente sin conservar una imagen.</Body>}
  {reading?.details?<ReadingDetailsForm context={movement.kind==='income'?'income':movement.kind==='expense'?'expense':undefined} documentType={reading.document_type} value={reading.details} onChange={details=>setReading({...reading,details})}/>:null}
  <Field label="Descripción del recibo" value={description} onChangeText={setDescription} maxLength={240}/>
  <DateField label="Fecha confirmada del recibo (opcional)" value={date} onChangeText={setDate}/><Field label="Total confirmado del recibo USD (opcional)" value={amount} onChangeText={setAmount} decimal/>
  <Body>El total del recibo puede diferir del depósito neto o de la transacción. Confirma su importe real y explica diferencias en las notas; adjuntar no modifica la transacción.</Body>
  <Field label="Notas del comprobante" value={notes} onChangeText={setNotes} multiline maxLength={20000}/>
  <Choices label="Confirmación" value={confirmed} options={[["no","Todavía revisando"],["yes","Confirmo recibo y transacción vinculada"]]} onChange={setConfirmed}/>
 </Sheet>;
}
