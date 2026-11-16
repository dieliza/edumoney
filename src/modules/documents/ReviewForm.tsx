import {recognizedPayment} from './paymentRecognition';
import {captureSourceLabel,captureCategory} from './capturePolicy';
import {entryMethods,methodForDirection,type EntryDirection} from '../money/entryContext';
import {suggestedDirection,kindForDirection,reviewKinds} from './reviewContext';
import {announceSaved} from '../../ui/saveFeedback';
import {ReceiptPhotoButtons} from './ReceiptPhotoButtons';
import {PhotoAnalysis} from '../../ui/PhotoAnalysis';
import {reviewedReading} from './ai/details';
import {anthropicProposal,anthropicStatement} from './ai/types';
import { DateField } from '../../ui/DateField';
import { useState,useRef } from 'react';
import { Image } from 'react-native';
import { newId } from '../../core/id';
import { userMessage,UserInputError } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { ActionButton,Body } from '../../ui/components';
import { Choices,Field,ErrorNotice,Sheet } from '../money/fields';
import { formatMoney, validDate } from '../money/domain';
import type {PaymentMethod} from '../money/types';
import type { DocumentStore } from './store';
import { DuplicateDocumentError } from './store';
import { proposeFields,proposeVoice } from './domain';
import type { DocumentsSnapshot,ImageData,RecordKind,Source,StoredDocument } from './types';
export interface ReviewDraft {entryKind?:EntryDirection;structured?:import('./ai/types').AnthropicReading;source:Source;text:string;image:ImageData|null;warning:string;needsAmountReview?:boolean;parent?:StoredDocument}
export function ReviewForm({retake,processing=false,analysisError='',initial,data,store,saved,close,openExisting}:{retake?:(source:'camera'|'library',file?:File)=>void;processing?:boolean;analysisError?:string;initial:ReviewDraft;data:DocumentsSnapshot;store:DocumentStore;saved():Promise<void>;close():void;openExisting(id:string):void}){
 const [retaking,setRetaking]=useState(false);
 const proposal=initial.structured?anthropicProposal(initial.structured):initial.source==='voice'?proposeVoice(initial.text):proposeFields(initial.text);const parent=initial.parent;
 const linkedKind=parent?data.movements.find(m=>m.id===parent.movementId)?.kind:undefined;
 const [direction,setDirection]=useState<EntryDirection|''>(initial.entryKind??(parent?(linkedKind==='income'||linkedKind==='expense'?linkedKind:parent.billId?'expense':''):suggestedDirection(initial.structured?.document_type)));
 const [details]=useState(initial.structured?.details);
 const [structuredIds]=useState(()=>initial.structured?.deductions.map(()=>newId())??[]);
 const [id]=useState(newId);const [kind,setKind]=useState<RecordKind|''>(parent?(parent.movementId||parent.billId?'attachment':'note'):direction?kindForDirection(direction):'');
 const [description,setDescription]=useState(parent?.description??proposal.description);const [date,setDate]=useState(parent?.date??proposal.date);const [amount,setAmount]=useState(initial.needsAmountReview?'':parent?.amountCents?`${Math.floor(parent.amountCents/100)}.${String(parent.amountCents%100).padStart(2,'0')}`:proposal.amount);
 const [text,setText]=useState(initial.text);const [notes,setNotes]=useState(initial.source==='voice'?initial.text:parent?.notes??'');const [keepText,setKeepText]=useState('no');const [similar,setSimilar]=useState('no');
 const [targetType,setTargetType]=useState(parent?.billId?'bill':'movement');const [targetId,setTargetId]=useState(parent?.movementId??parent?.billId??'');const [search,setSearch]=useState('');const [method,setMethod]=useState(methodForDirection(initial.structured?.details?.payment_method??'',direction||'expense'));const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [duplicate,setDuplicate]=useState('');
 const targets=targetType==='movement'?data.movements.filter(m=>!m.deletedAt&&(!direction||m.kind===direction)).map(m=>({id:m.id,label:`${m.date} · ${m.description} · ${formatMoney(m.amountCents)}`})):data.bills.map(b=>({id:b.id,label:`${b.dueDate} · ${b.provider} · ${formatMoney(b.amountCents)}`}));
 const detectedMethod=methodForDirection(recognizedPayment(text,details?.payment_method,initial.source==='camera'||initial.source==='library'?'document':'utterance')??'',direction||'expense');
 const effectiveMethod=detectedMethod||method;
 const working=useRef(false);
 const inferredCategory=captureCategory(data.categories,direction,initial.structured?.document_type);
 const financial=['paid_expense','paid_income','pending_bill'].includes(kind);
 let enteredCents:number|null=null;try{enteredCents=amount.trim()?parseAmount(amount.trim()):null;}catch{}
 const reviewKey=JSON.stringify([date,amount,description,kind]);
 const same=data.documents.find(d=>d.id!==parent?.id&&d.date===date&&enteredCents!==null&&d.amountCents===enteredCents&&d.description.trim().toLocaleLowerCase('es')===description.trim().toLocaleLowerCase('es'));
 const similarMovement=financial&&data.movements.some(m=>!m.deletedAt&&m.date===date&&enteredCents!==null&&m.amountCents===enteredCents);
 const similarBill=kind==='pending_bill'&&data.bills.some(b=>b.dueDate===date&&enteredCents!==null&&b.amountCents===enteredCents&&b.provider.trim().toLocaleLowerCase('es')===description.trim().toLocaleLowerCase('es'));
 const hasSimilar=!!same||similarMovement||similarBill;
 const match=search.toLocaleLowerCase('es');const filtered=targets.filter(t=>t.label.toLocaleLowerCase('es').includes(match));
 function changeDirection(value:EntryDirection){setDirection(value);setKind(kindForDirection(value));setMethod(old=>methodForDirection(old,value));setTargetType('movement');setTargetId('');setSearch('');setSimilar('');setError('');if(kind==='pending_bill')setDate(proposal.date);}
 function changeKind(value:RecordKind|''){if(!reviewKinds(direction,!!parent).some(([key])=>key===value))return;setKind(value);setError('');if(value==='pending_bill')setDate(details?.due_date??'');}
 async function submit(){if(working.current||processing)return;working.current=true;let committed=false;setBusy(true);setError('');setDuplicate('');try{
 if(kind==='paid_income'&&!methodForDirection(effectiveMethod,'income'))throw new UserInputError('Selecciona cómo recibiste el ingreso.');
 if(kind==='paid_expense'&&!methodForDirection(effectiveMethod,'expense'))throw new UserInputError('Selecciona el método de pago del gasto.');
 if(!kind)throw new UserInputError('Elige si es una transacción pagado, factura pendiente, comprobante adjunto o nota.');
 if((initial.image||financial)&&!amount.trim())throw new UserInputError('Escribe el importe antes de guardar.');
 if(date&&!validDate(date))throw new UserInputError('Elige una fecha válida en el calendario.');
 const m=data.movements.find(m=>m.id===targetId),b=data.bills.find(b=>b.id===targetId);
 await store.save({...(initial.structured?{reading:reviewedReading(initial.structured,description,date.trim()||null,enteredCents,details)}:{}),...(kind==='paid_income'&&initial.structured?{incomeStatement:anthropicStatement(initial.structured,enteredCents!,description.trim(),structuredIds)}:{}),id,kind,source:initial.source,description,date:date.trim()||null,amountCents:amount.trim()?parseAmount(amount.trim()):null,notes,rawText:keepText==='yes'?text:null,image:initial.image,keepImage:false,movementId:kind==='attachment'&&targetType==='movement'?targetId||null:null,billId:kind==='attachment'&&targetType==='bill'?targetId||null:null,expectedMovementVersion:m?.version??null,expectedBillVersion:b?.version??null,categoryId:financial?inferredCategory?.id??null:null,paymentMethod:kind==='paid_income'||kind==='paid_expense'?effectiveMethod||null:null,supersedesId:parent?.id??null,expectedDocumentVersion:parent?.version??null,confirmSimilar:similar===reviewKey,reviewed:true});
 committed=true;announceSaved();close();await saved();
 }catch(e){if(!committed){setError(userMessage(e));if(e instanceof DuplicateDocumentError)setDuplicate(e.documentId);}}finally{working.current=false;setBusy(false);}}
 return <Sheet title={parent?'Corregir comprobante':'Revisar antes de guardar'} close={close} busy={busy||processing} headerAction={<><ErrorNotice message={error}/>{!busy&&!processing?<ActionButton title="Guardar" testID="document-save" onPress={()=>void submit()}/>:null}</>}>
 {!parent?<Choices<EntryDirection|''> required={financial} label="Tipo de transacción" presentation="tabs" value={direction} options={[[ 'expense','↓ Gasto'],['income','↑ Ingreso']]} onChange={value=>{if(value)changeDirection(value);}}/>:null}
 {initial.structured?<Body>Documento leído: {initial.structured.document_type==='paystub'?'Talonario de pago':initial.structured.document_type==='check'?'Cheque':'Recibo de compra'}.{direction==='income'&&initial.structured.document_type==='paystub'?' Confirma el importe recibido antes de guardar.':''}</Body>:null}
 <Body>Origen: {captureSourceLabel[initial.source]}. {'Solo se conservarán los datos confirmados; la foto es temporal.'}</Body>
 <ErrorNotice message={analysisError}/>
 {processing?<PhotoAnalysis/>:initial.image&&retake?<><ActionButton title="Volver a tomar la foto" icon="camera-outline" secondary onPress={()=>setRetaking(!retaking)}/>{retaking?<ReceiptPhotoButtons onCapture={retake}/>:null}</>:null}
 <Body>El reconocimiento puede equivocarse. Confirma los campos; nada se registra como pagado automáticamente.</Body>{initial.warning?<Body>{initial.warning}</Body>:null}{proposal.warnings.length?<Body muted>Revisa la fecha y el importe antes de guardar.</Body>:null}
 {initial.image?<Image source={{uri:`data:${initial.image.mime};base64,${initial.image.base64}`}} accessibilityLabel="Vista temporal para revisar el documento" style={{width:'100%',height:280}} resizeMode="contain"/>:null}
 {!initial.structured?<>
 <Field label="Texto a revisar" testID="document-text" value={text} onChangeText={value=>{setText(value);}} multiline maxLength={20000}/>
 <ActionButton title="Proponer campos desde el texto revisado" secondary testID="document-propose" onPress={()=>{const next=initial.structured&&text===initial.text?anthropicProposal(initial.structured):initial.source==='voice'?proposeVoice(text):proposeFields(text);setDescription(next.description);setAmount(initial.needsAmountReview&&text===initial.text?'':next.amount);if(initial.source==='voice')setNotes(text);if(kind!=='pending_bill')setDate(next.date);}}/>
 </>:null}

 <Choices<RecordKind|''> key={'record:'+direction} required label={direction==='income'?'Cómo guardar este ingreso':direction==='expense'?'Cómo guardar este gasto':'Cómo guardar esta información'} value={kind} options={reviewKinds(direction,!!parent)} onChange={changeKind}/>
 {parent?<Body>La corrección conservará el vínculo original. Cambiar un comprobante no corrige el importe de la transacción o la factura.</Body>:null}
 <Field label={direction==='income'?'Pagador o descripción del ingreso (opcional)':'Comercio o descripción confirmada (opcional)'} testID="document-description" value={description} onChangeText={setDescription}/>
 <DateField label={kind==='pending_bill'?'Fecha de vencimiento':direction==='income'?'Fecha del ingreso':direction==='expense'?'Fecha del gasto':'Fecha del documento'} required={['paid_expense','paid_income','pending_bill'].includes(kind)} testID="document-date" value={date} onChangeText={setDate}/>
 {kind==='pending_bill'?<Body>La fecha impresa en la imagen no confirma su vencimiento. Introduce el vencimiento que verificaste; todavía no se registra ningún pago.</Body>:null}
 <Field label={direction==='income'?'Importe recibido (USD)':direction==='expense'?'Importe del gasto o factura (USD)':'Importe del documento (USD)'} required={!!initial.image||financial} testID="document-amount" decimal value={amount} onChangeText={setAmount}/>
 {kind==='attachment'?<><Choices label="Tipo de registro a vincular" value={targetType} options={direction==='income'?[[ 'movement','Ingreso existente']]:[[ 'movement',direction==='expense'?'Gasto existente':'Transacción existente'],['bill','Factura existente']]} onChange={value=>{if(!parent){setTargetType(value);setTargetId('');}}}/><Field label="Buscar registro por fecha o descripción" value={search} onChangeText={setSearch}/><Choices required label="Registro existente" value={targetId} options={[[ '', 'Selecciona el registro'],...filtered.slice(0,30).map(t=>[t.id,t.label] as const)]} onChange={value=>{if(!parent)setTargetId(value);}}/><Body muted>Se muestran hasta 30 coincidencias; usa búsqueda para encontrar otros. Adjuntar no crea ni cambia transacciones. Si el comprobante muestra otra cantidad, anota el motivo.</Body></>:null}
 {['paid_expense','paid_income'].includes(kind)&&detectedMethod?<Body>Método identificado: {entryMethods(direction||'expense').find(([key])=>key===detectedMethod)?.[1]}</Body>:null}
 {['paid_expense','paid_income'].includes(kind)&&!detectedMethod?<Choices<PaymentMethod|''> key={'method:'+direction} required label={direction==='income'?'Cómo recibiste el ingreso':'Método de pago del gasto'} value={method} options={[[ '', 'Seleccionar método'],...entryMethods(kind==='paid_income'?'income':'expense')]} onChange={setMethod}/>:null}
 {financial&&inferredCategory?<Body>Categoría financiera: {inferredCategory.name}</Body>:null}
 {(!initial.structured||kind==='note')?<Field label="Nota confirmada o explicación" required={kind==='note'} testID="document-note" value={notes} onChangeText={setNotes} multiline maxLength={20000}/>:null}
 {!initial.structured?<Choices label="Texto reconocido original" value={keepText} options={[[ 'no','No conservar texto original'],['yes','Conservar texto revisado cifrado']]} onChange={setKeepText}/>:null}
 {hasSimilar?<Choices label="Detectamos un registro similar" value={similar===reviewKey?'yes':'no'} options={[[ 'no','Revisar antes de duplicar'],['yes','Confirmo que es otro registro distinto']]} onChange={value=>setSimilar(value==='yes'?reviewKey:'')}/>:null}
 <Body>Al guardar confirmas que revisaste la foto, el total, la fecha y el tipo de registro. Los duplicados se comprueban automáticamente.</Body>
 {same?<ActionButton title="Ver recibo similar ya guardado" secondary onPress={()=>openExisting(same.id)}/>:null}
 {duplicate?<ActionButton title="Abrir comprobante ya existente" secondary onPress={()=>openExisting(duplicate)}/>:null}
 </Sheet>;
}
