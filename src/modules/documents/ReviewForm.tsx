import {reviewedReading} from './ai/details';
import {ReadingDetailsForm} from './ReadingDetailsForm';
import {anthropicProposal,anthropicStatement} from './ai/types';
import { DateField } from '../../ui/DateField';
import { CategoryPicker } from '../money/CategoryPicker';
import { useState } from 'react';
import { Image } from 'react-native';
import { newId } from '../../core/id';
import { userMessage,UserInputError } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { ActionButton,Body } from '../../ui/components';
import { Choices,Field,ErrorNotice,Sheet } from '../money/fields';
import { formatMoney, validDate } from '../money/domain';
import type { DocumentStore } from './store';
import { DuplicateDocumentError } from './store';
import { proposeFields,proposeVoice } from './domain';
import type { DocumentsSnapshot,ImageData,RecordKind,Source,StoredDocument } from './types';
export interface ReviewDraft {structured?:import('./ai/types').AnthropicReading;source:Source;text:string;image:ImageData|null;warning:string;needsAmountReview?:boolean;parent?:StoredDocument}
export function ReviewForm({initial,data,store,saved,close,openExisting}:{initial:ReviewDraft;data:DocumentsSnapshot;store:DocumentStore;saved():Promise<void>;close():void;openExisting(id:string):void}){
 const proposal=initial.structured?anthropicProposal(initial.structured):initial.source==='voice'?proposeVoice(initial.text):proposeFields(initial.text);const parent=initial.parent;
 const [details,setDetails]=useState(initial.structured?.details);
 const [structuredIds]=useState(()=>initial.structured?.deductions.map(()=>newId())??[]);
 const [id]=useState(newId);const [kind,setKind]=useState<RecordKind|''>(parent?(parent.movementId||parent.billId?'attachment':'note'):'');
 const [description,setDescription]=useState(parent?.description??proposal.description);const [date,setDate]=useState(parent?.date??proposal.date);const [amount,setAmount]=useState(initial.needsAmountReview?'':parent?.amountCents?`${Math.floor(parent.amountCents/100)}.${String(parent.amountCents%100).padStart(2,'0')}`:proposal.amount);
 const [text,setText]=useState(initial.text);const [notes,setNotes]=useState(initial.source==='voice'?initial.text:parent?.notes??'');const [keepImage,setKeepImage]=useState(initial.image?'yes':'');const [keepText,setKeepText]=useState('no');const [similar,setSimilar]=useState('no');
 const [targetType,setTargetType]=useState(parent?.billId?'bill':'movement');const [targetId,setTargetId]=useState(parent?.movementId??parent?.billId??'');const [search,setSearch]=useState('');const [method,setMethod]=useState(initial.structured?.details?.payment_method??'');const [category,setCategory]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [duplicate,setDuplicate]=useState('');
 const targets=targetType==='movement'?data.movements.filter(m=>!m.deletedAt).map(m=>({id:m.id,label:`${m.date} · ${m.description} · ${formatMoney(m.amountCents)}`})):data.bills.map(b=>({id:b.id,label:`${b.dueDate} · ${b.provider} · ${formatMoney(b.amountCents)}`}));
 const financial=['paid_expense','paid_income','pending_bill'].includes(kind);
 let enteredCents:number|null=null;try{enteredCents=amount.trim()?parseAmount(amount.trim()):null;}catch{}
 const reviewKey=JSON.stringify([date,amount,description,kind]);
 const same=data.documents.find(d=>d.id!==parent?.id&&d.date===date&&enteredCents!==null&&d.amountCents===enteredCents&&d.description.trim().toLocaleLowerCase('es')===description.trim().toLocaleLowerCase('es'));
 const similarMovement=financial&&data.movements.some(m=>!m.deletedAt&&m.date===date&&enteredCents!==null&&m.amountCents===enteredCents);
 const similarBill=kind==='pending_bill'&&data.bills.some(b=>b.dueDate===date&&enteredCents!==null&&b.amountCents===enteredCents&&b.provider.trim().toLocaleLowerCase('es')===description.trim().toLocaleLowerCase('es'));
 const hasSimilar=!!same||similarMovement||similarBill;
 const match=search.toLocaleLowerCase('es');const filtered=targets.filter(t=>t.label.toLocaleLowerCase('es').includes(match));
 function changeKind(value:RecordKind|''){setKind(value);setCategory('');setError('');if(value==='pending_bill')setDate(details?.due_date??'');}
 async function submit(){if(busy)return;setBusy(true);setError('');setDuplicate('');try{
 if(!kind)throw new UserInputError('Elige si es un movimiento pagado, factura pendiente, comprobante adjunto o nota.');
 if(initial.image&&!amount.trim())throw new UserInputError('Escribe el total del recibo antes de guardar.');
 if(date&&!validDate(date))throw new UserInputError('Elige una fecha válida en el calendario.');
 if(initial.image&&!keepImage)throw new UserInputError('Decide si conservarás la imagen cifrada o solo los datos.');
 const m=data.movements.find(m=>m.id===targetId),b=data.bills.find(b=>b.id===targetId);
 await store.save({...(initial.structured?{reading:reviewedReading(initial.structured,description,date.trim()||null,enteredCents,details)}:{}),...(kind==='paid_income'&&initial.structured?{incomeStatement:anthropicStatement(initial.structured,enteredCents!,description.trim(),structuredIds)}:{}),id,kind,source:initial.source,description,date:date.trim()||null,amountCents:amount.trim()?parseAmount(amount.trim()):null,notes,rawText:keepText==='yes'&&!(initial.image&&keepImage==='yes')?text:null,image:initial.image,keepImage:keepImage==='yes',movementId:kind==='attachment'&&targetType==='movement'?targetId||null:null,billId:kind==='attachment'&&targetType==='bill'?targetId||null:null,expectedMovementVersion:m?.version??null,expectedBillVersion:b?.version??null,categoryId:category||null,paymentMethod:method||null,supersedesId:parent?.id??null,expectedDocumentVersion:parent?.version??null,confirmSimilar:similar===reviewKey,reviewed:true});
 await saved();close();
 }catch(e){setError(userMessage(e));if(e instanceof DuplicateDocumentError)setDuplicate(e.documentId);}finally{setBusy(false);}}
 return <Sheet title={parent?'Corregir comprobante':'Revisar antes de guardar'} close={close} busy={busy}>
 {initial.structured?<Body>Documento leído: {initial.structured.document_type==='paystub'?'Talonario de pago':initial.structured.document_type==='check'?'Cheque':'Recibo de compra'}. Si es un talonario, confirma que se guarde como ingreso; su desglose quedará pendiente de revisión.</Body>:null}
 <Body>El reconocimiento puede equivocarse. Confirma los campos; nada se registra como pagado automáticamente.</Body>{initial.warning?<Body>{initial.warning}</Body>:null}{proposal.warnings.map(w=><Body key={w} muted>{w}</Body>)}
 {initial.image?<><Image source={{uri:`data:${initial.image.mime};base64,${initial.image.base64}`}} accessibilityLabel="Comprobante que estás revisando" style={{width:'100%',height:280}} resizeMode="contain"/><Choices label="Qué conservar de la imagen" value={keepImage} options={[[ '', 'Decidir antes de guardar'],['yes','Conservar copia local cifrada'],['no','Solo datos; no conservar imagen']]} onChange={setKeepImage}/></>:<Body muted>No hay una imagen que conservar. Solo se guardará la información confirmada.</Body>}
 {!(initial.image&&keepImage==='yes')?<>
 <Field label="Texto a revisar" testID="document-text" value={text} onChangeText={value=>{setText(value);}} multiline maxLength={20000}/>
 <ActionButton title="Proponer campos desde el texto revisado" secondary testID="document-propose" onPress={()=>{const next=initial.structured&&text===initial.text?anthropicProposal(initial.structured):initial.source==='voice'?proposeVoice(text):proposeFields(text);setDescription(next.description);setAmount(initial.needsAmountReview&&text===initial.text?'':next.amount);if(initial.source==='voice')setNotes(text);if(kind!=='pending_bill')setDate(next.date);}}/>
 </>:null}
 {details?<ReadingDetailsForm value={details} onChange={setDetails}/>:null}
 <Choices<RecordKind|''> required label="Cómo guardar esta información" value={kind} options={parent?[[ 'attachment','Corregir comprobante del mismo registro'],['note','Corregir nota sin movimiento']]:[[ '', 'Elegir tipo'],['paid_expense','Gasto ya realizado'],['paid_income','Ingreso ya recibido'],['pending_bill','Factura pendiente'],['attachment','Adjuntar a registro existente'],['note','Nota sin movimiento']]} onChange={changeKind}/>
 {parent?<Body>La corrección conservará el vínculo original. Cambiar un comprobante no corrige el importe del movimiento o la factura.</Body>:null}
 <Field label="Comercio o descripción confirmada" testID="document-description" value={description} onChangeText={setDescription}/>
 <DateField label={kind==='pending_bill'?'Fecha de vencimiento':'Fecha del recibo'} required={['paid_expense','paid_income','pending_bill'].includes(kind)} testID="document-date" value={date} onChangeText={setDate}/>
 {kind==='pending_bill'?<Body>La fecha impresa en la imagen no confirma su vencimiento. Introduce el vencimiento que verificaste; todavía no se registra ningún pago.</Body>:null}
 <Field label={initial.structured&&initial.structured.document_type!=='receipt'?'Importe neto del cheque o talonario (USD)':'Total del recibo (USD)'} required={!!initial.image||financial} testID="document-amount" decimal value={amount} onChangeText={setAmount}/>
 {kind==='attachment'?<><Choices label="Tipo de registro a vincular" value={targetType} options={[[ 'movement','Movimiento existente'],['bill','Factura existente']]} onChange={value=>{if(!parent){setTargetType(value);setTargetId('');}}}/><Field label="Buscar registro por fecha o descripción" value={search} onChangeText={setSearch}/><Choices required label="Registro existente" value={targetId} options={[[ '', 'Selecciona el registro'],...filtered.slice(0,30).map(t=>[t.id,t.label] as const)]} onChange={value=>{if(!parent)setTargetId(value);}}/><Body muted>Se muestran hasta 30 coincidencias; usa búsqueda para encontrar otros. Adjuntar no crea ni cambia movimientos. Si el comprobante muestra otra cantidad, anota el motivo.</Body></>:null}
 {['paid_expense','paid_income'].includes(kind)?<Choices required label="Método confirmado" value={method} options={[[ '', 'Seleccionar método'],['cash','Efectivo'],['check','Cheque'],['debit','Tarjeta de débito'],['bank','Transferencia bancaria'],['other','Otro'],...(kind==='paid_expense'?[[ 'credit','Tarjeta de crédito']] as const:[])]} onChange={setMethod}/>:null}
 {financial?<CategoryPicker categories={data.categories} kind={kind==='paid_income'?'income':'expense'} value={category} onChange={setCategory}/>:null}
 {(!(initial.image&&keepImage==='yes')||kind==='note')?<Field label="Nota confirmada o explicación" required={kind==='note'} testID="document-note" value={notes} onChangeText={setNotes} multiline maxLength={20000}/>:null}
 {!(initial.image&&keepImage==='yes')?<Choices label="Texto reconocido original" value={keepText} options={[[ 'no','No conservar texto original'],['yes','Conservar texto revisado cifrado']]} onChange={setKeepText}/>:null}
 {hasSimilar?<Choices label="Detectamos un registro similar" value={similar===reviewKey?'yes':'no'} options={[[ 'no','Revisar antes de duplicar'],['yes','Confirmo que es otro registro distinto']]} onChange={value=>setSimilar(value==='yes'?reviewKey:'')}/>:null}
 <Body>Al guardar confirmas que revisaste la foto, el total, la fecha y el tipo de registro. Los duplicados se comprueban automáticamente.</Body>
 {same?<ActionButton title="Ver recibo similar ya guardado" secondary onPress={()=>openExisting(same.id)}/>:null}
 <ErrorNotice message={error}/>
 {duplicate?<ActionButton title="Abrir comprobante ya existente" secondary onPress={()=>openExisting(duplicate)}/>:null}
 {!busy?<ActionButton title="Guardar información revisada" testID="document-save" onPress={()=>void submit()}/>:null}
 </Sheet>;
}
