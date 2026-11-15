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
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../money/fields';
import { getDocumentStore } from '../documents/localStore';
import { captureImage } from '../documents/capture';
import type { ImageData } from '../documents/types';
import type { LedgerMovement } from '../money/types';
export function BusinessReceiptForm({movement,done,close}:{movement:LedgerMovement;done():Promise<void>;close():void}) {
 const [id]=useState(newId),[image,setImage]=useState<ImageData|null>(null),[source,setSource]=useState<'manual'|'camera'|'library'>('manual');
 const [description,setDescription]=useState(''),[date,setDate]=useState(''),[amount,setAmount]=useState(''),[notes,setNotes]=useState(''),[keep,setKeep]=useState(''),[confirmed,setConfirmed]=useState('no');
 const [reading,setReading]=useState<AnthropicReading>();
 const [recognition,setRecognition]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function capture(from:'camera'|'library'){if(busy)return;setBusy(true);setError('');try{const result=await captureImage(from);if(result){setImage(result.image);setReading(result.structured);const proposal=result.structured?anthropicProposal(result.structured):proposeFields(result.text);setDescription(proposal.description);setDate(proposal.date);setAmount(result.needsAmountReview?'':proposal.amount);setRecognition(result.warning);setSource(from);setKeep('');setConfirmed('no');}}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 async function save(){if(busy)return;setBusy(true);setError('');try{
  if(image&&!keep)throw new UserInputError('Decide si conservarás la imagen local cifrada.');
  const store=await getDocumentStore();
  await store.save({...(reading?{reading:reviewedReading(reading,description,date.trim()||null,amount.trim()?parseAmount(amount.trim()):null)}:{}),id,kind:'attachment',source,description,date:date.trim()||null,amountCents:amount.trim()?parseAmount(amount.trim()):null,notes,rawText:null,image,keepImage:keep==='yes',movementId:movement.id,billId:null,expectedMovementVersion:movement.version,expectedBillVersion:null,categoryId:null,paymentMethod:null,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:confirmed==='yes'});
  announceSaved();await done();close();
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title="Recibo del registro comercial" close={close} busy={busy}>
  <Body>Se adjunta a {movement.description} · {movement.date} · {formatMoney(movement.amountCents)}. No crea otro ingreso ni gasto. Si el recibo incluye uso personal y comercial, conserva el importe completo y revisa el porcentaje en el registro comercial.</Body>
  {!busy?<View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}><CameraActionButton label="Tomar foto del recibo" onPress={()=>void capture('camera')}/><ActionMenu actions={[
 {id:'library',label:'Seleccionar imagen del recibo',run:()=>void capture('library')},
 {id:'manual',label:'Entrada manual sin imagen',run:()=>{setImage(null);setReading(undefined);setSource('manual');setKeep('no');}},
 ]}/></View>:null}
  {recognition?<Body>{recognition}</Body>:null}
  {image?<><Image source={{uri:`data:${image.mime};base64,${image.base64}`}} accessibilityLabel="Recibo que estás revisando" style={{width:'100%',height:260}} resizeMode="contain"/><Choices label="Copia del recibo" value={keep} options={[["","Decidir antes de guardar"],["yes","Conservar imagen local cifrada"],["no","Guardar solo datos confirmados"]]} onChange={setKeep}/></>:<Body>Puedes registrar los datos manualmente sin conservar una imagen.</Body>}
  {reading?.details?<ReadingDetailsForm value={reading.details} onChange={details=>setReading({...reading,details})}/>:null}
  <Field label="Descripción del recibo" value={description} onChangeText={setDescription} maxLength={240}/>
  <DateField label="Fecha confirmada del recibo (opcional)" value={date} onChangeText={setDate}/><Field label="Total confirmado del recibo USD (opcional)" value={amount} onChangeText={setAmount} decimal/>
  <Body>El total del recibo puede diferir del depósito neto o del movimiento. Confirma su importe real y explica diferencias en las notas; adjuntar no modifica el movimiento.</Body>
  <Field label="Notas del comprobante" value={notes} onChangeText={setNotes} multiline maxLength={20000}/>
  <Choices label="Confirmación" value={confirmed} options={[["no","Todavía revisando"],["yes","Confirmo recibo y movimiento vinculado"]]} onChange={setConfirmed}/>
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar recibo vinculado" onPress={()=>void save()}/>:null}
 </Sheet>;
}
