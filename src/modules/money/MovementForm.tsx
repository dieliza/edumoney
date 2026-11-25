import {createIncomeMethod,customIncomeMethods,isCustomIncomePayment,paymentMethodLabel,type IncomeMethod,type IncomePaymentMethod} from './incomePaymentMethods';
import {useTheme} from '../../design/ThemeProvider';
import {transactionFormColors} from '../../ui/transactionFormStyle';
import {TransactionSheet,TransactionSegments,TransactionLink,TransactionSaveButton,TransactionError,useTransactionStyles} from './TransactionFormUI';
import {saveAccountMovement} from './saveAccountMovement';
import {useAccountScope,setAccountScope,type AccountScope} from './accountScope';
import {recognizedPayment} from '../documents/paymentRecognition';
import {entryMethods} from './entryContext';
import {announceSaved} from '../../ui/saveFeedback';
import {TransactionHistory,type TransactionHistoryKind} from './TransactionHistory';
import {router} from 'expo-router';
import { DateField } from '../../ui/DateField';
import { CategoryPicker } from './CategoryPicker';
import { userMessage, UserInputError } from '../../core/errors';
import { useEffect,useRef,useState } from 'react';
import {Pressable,Text,View} from 'react-native';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { ActionButton } from '../../ui/components';
import { localToday, formatMoney, inputAmount } from './domain';
import { Choices, Field } from './fields';
import { DuplicateMovementError, type MoneyStore } from './store';
import { kindLabels, paymentLabels, type Category, type EntryKind, type IncomeSchedule, type LedgerMovement, type PaymentMethod } from './types';
export function MovementForm({ initial, kind, categories, store, close, saved, documentReview,allowedKinds,onHistoryEdit,historySaved,initialHistory,afterSave,onDeleteDocument }: {
    initial?: LedgerMovement;
    onHistoryEdit?(movement:LedgerMovement):void;
    historySaved?():Promise<void>;
    initialHistory?:TransactionHistoryKind;
    afterSave?():void;
    onDeleteDocument?():void;
    kind: EntryKind;
    allowedKinds?:readonly EntryKind[];
    categories: Category[];
    store: MoneyStore;
    close(): void;
    saved(): Promise<void>;
    documentReview?: { id: string; version: number };
}) {
    const {name:themeName}=useTheme(),tc=transactionFormColors(themeName),styles=useTransactionStyles();
    const account=useAccountScope();
    const [identity] = useState(() => ({ id: initial?.id ?? newId(), operation: initial?.idempotencyKey ?? newId(), schedule: newId() }));
    const [type,setType] = useState<EntryKind>(initial?.kind as EntryKind ?? (initialHistory==='income'?'income':initialHistory==='expense'?'expense':kind));
    const [amount, setAmount] = useState(initial ? inputAmount(initial.amountCents) : '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [date, setDate] = useState(initial?.date ?? localToday());
    const [addedCategories,setAddedCategories]=useState<Category[]>([]);
    const availableCategories=[...categories,...addedCategories.filter(c=>!categories.some(old=>old.id===c.id))];
    const [category, setCategory] = useState(initial?.categoryId ?? '');
    const [categoryName,setCategoryName] = useState(categories.find(c=>c.id===initial?.categoryId)?.name??'');
    const commercial=(type==='income'||type==='expense')&&(initial?initial.useKind==='business':account==='business');
    const [holders,setHolders]=useState<{id:string;name:string}[]>([]),[holderId,setHolderId]=useState('');
    const [method, setMethod] = useState<IncomePaymentMethod>((initial ? (initial.paymentMethod ?? '') : 'bank') as IncomePaymentMethod);
    const [customMethods,setCustomMethods]=useState<IncomeMethod[]>([]),[addingMethod,setAddingMethod]=useState(false),[methodName,setMethodName]=useState(''),[creatingMethod,setCreatingMethod]=useState(false),[methodError,setMethodError]=useState('');
    const [incomeType, setIncomeType] = useState(initial?.incomeType ?? 'manual');
    const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly');
    const [interval, setInterval] = useState('1');
    const [tax] = useState(initial?.taxReview ? 'yes' : 'no');
    const [use] = useState(initial?.useKind ?? 'unknown');
    const [historyPane,setHistoryPane]=useState<TransactionHistoryKind|null>(initialHistory??null);
    const submitting=useRef(false);
    const [busy, setBusy] = useState(false);
    const [deleting,setDeleting]=useState(false),[deleted,setDeleted]=useState(false);
    const removalCommitted=useRef(false);
    const [error, setError] = useState('');
    const [duplicate, setDuplicate] = useState(false);
    const [showOptions,setShowOptions]=useState(Boolean(initial&&(initial.kind==='income'||initial.useKind==='business')));
    useEffect(()=>{if(!commercial)return;let live=true;void store.read(db=>db.getAllAsync<{id:string;name:string}>("SELECT id,legal_name AS name FROM business_holders WHERE legal_form IN ('individual','llc') ORDER BY rowid")).then(rows=>{if(live){setHolders(rows);if(rows.length===1)setHolderId(rows[0].id);}}).catch(()=>{if(live)setError('No pudimos cargar tus negocios. Vuelve a abrir el formulario.');});return()=>{live=false;};},[commercial,store]);
    useEffect(()=>{if(type!=='income')return;let live=true;void customIncomeMethods(store).then(rows=>{if(live)setCustomMethods(rows);}).catch(()=>{if(live)setError('No pudimos cargar tus métodos de pago.');});return()=>{live=false;};},[store,type]);
    async function submit(allowDuplicate = false) {
        if (submitting.current)
            return;
        submitting.current=true;
        setBusy(true);
        setError('');
        try {
            if(type==='expense'&&!category)throw new UserInputError('Elige o crea una categoría para el gasto.');
            const now = new Date().toISOString();
            const scheduleId = !initial && type === 'income' && incomeType === 'recurring' ? identity.schedule : initial?.scheduleId ?? null;
            const m: LedgerMovement = { id: identity.id, idempotencyKey: identity.operation, kind: type, amountCents: parseAmount(amount.trim()), currency: 'USD', date, description: commercial?(description.trim()||categoryName||categories.find(c=>c.id===category)?.name||`${type==='income'?'Ingreso':'Gasto'} comercial`):type==='expense'?(description.trim()||categoryName||categories.find(c=>c.id===category)?.name||'Gasto'):(description.trim()||categoryName||categories.find(c=>c.id===category)?.name||kindLabels[type]), categoryId: category || null, paymentMethod: type==='income'&&isCustomIncomePayment(method)?method:recognizedPayment(description)||method, taxReview: commercial||tax === 'yes', useKind: commercial?'business':initial?use:'personal', grossCents: type === 'income' ? initial?.grossCents??null : null, withholdingCents: type === 'income' ? initial?.withholdingCents??null : null, createdAt: initial?.createdAt ?? now, updatedAt: now, deletedAt: null, incomeType: type === 'income' ? incomeType : 'manual', scheduleId, occurrenceDate: initial?.occurrenceDate ?? (scheduleId ? date : null), version: initial?.version ?? 1 };
            let schedule: IncomeSchedule | undefined;
            if (!initial && scheduleId) {
                if (!/^\d+$/.test(interval))
                    throw new UserInputError('El intervalo debe ser un número entero.');
                schedule = { id: scheduleId, description: m.description, amountCents: m.amountCents, categoryId: m.categoryId, paymentMethod: m.paymentMethod, cadence, intervalCount: Number(interval), anchorDate: date, nextDate: date, active: true };
            }
            if(initial&&commercial)await store.saveCommercial(m,holderId,allowDuplicate);
            else if (initial)
                await (documentReview?store.edit(m,undefined,allowDuplicate,documentReview):store.editFromHistory(m,allowDuplicate));
            else
                await saveAccountMovement(store,m,account,holderId,allowDuplicate,schedule);
            announceSaved();await saved();
            if(afterSave)afterSave();else close();
        }
        catch (e) {
            setError(userMessage(e)==='Usa un importe decimal con hasta dos decimales'?'Escribe el importe.':userMessage(e));
            setDuplicate(e instanceof DuplicateMovementError);
        }
        finally {
            submitting.current=false;setBusy(false);
        }
    }
    async function remove(){
        if(!initial||documentReview||submitting.current)return;
        submitting.current=true;setBusy(true);setDeleting(true);setError('');setDuplicate(false);
        try{
            await store.deleteFromHistory(initial);
            removalCommitted.current=true;setDeleted(true);
            try{await (historySaved??saved)();}catch{setError('La transacción se eliminó. Vuelve a abrir el historial para actualizarlo.');}
        }catch(e){setError(userMessage(e));}
        finally{submitting.current=removalCommitted.current;setBusy(false);setDeleting(false);}
    }
    async function addIncomeMethod(){if(submitting.current)return;submitting.current=true;setBusy(true);setCreatingMethod(true);setError('');setMethodError('');try{const created=await createIncomeMethod(store,methodName);setCustomMethods(old=>old.some(row=>row.value===created.value)?old:[...old,created]);setMethod(created.value);setAddingMethod(false);setMethodName('');announceSaved();}catch(e){setMethodError(userMessage(e));}finally{submitting.current=removalCommitted.current;setBusy(false);setCreatingMethod(false);}}
    const incomeMethods:[IncomePaymentMethod,string][]=[...entryMethods('income'),...customMethods.map(row=>[row.value,row.label] as [IncomePaymentMethod,string])];
    if(isCustomIncomePayment(method)&&!incomeMethods.some(([value])=>value===method))incomeMethods.push([method,paymentMethodLabel(method)]);
    const detectedPayment=isCustomIncomePayment(method)?null:recognizedPayment(description);
    const moneyEntry=type==='income'||type==='expense';
    const openOptions=showOptions;
    const sectionTitle=moneyEntry?`${initial?'Editar':'Registrar'} ${type==='expense'?'gasto':'ingreso'} ${commercial?'comercial':'personal'}`:`${initial?'Editar':'Registrar'} ${kindLabels[type].toLocaleLowerCase('es')}`;
    const saveTitle=type==='expense'?'Guardar gasto':type==='income'?'Guardar ingreso':'Guardar transacción';
    return <TransactionSheet title={deleted?'Transacción eliminada':initial?'Editar transacción':'Nueva transacción'} close={close} busy={busy}>
  {deleted?<View testID="movement-delete-success" style={styles.section}><Text accessibilityRole="status" accessibilityLiveRegion="polite" style={styles.heading}>Transacción eliminada.</Text><TransactionError message={error}/><TransactionLink title="Cerrar" onPress={close}/></View>:<>
  {!initial&&(kind==='income'||kind==='expense')?<TransactionSegments<'income'|'expense'> label="Tipo de transacción" value={type as 'income'|'expense'} options={[["expense","Gasto"],["income","Ingreso"]]} disabled={busy} onChange={value=>{setHistoryPane(null);setType(value);if(value==='income')setMethod(current=>current==='credit'?'bank':current);if(value==='expense')setMethod(current=>isCustomIncomePayment(current)?'cash':current);setCategory('');setCategoryName('');setDuplicate(false);setError('');}}/>:null}
  {!initial&&moneyEntry?<TransactionSegments<AccountScope> compact label="Cuenta de la transacción" value={account} options={[["personal","Personal"],["business","Comercial"]]} disabled={busy} onChange={value=>{if(value===account)return;setAccountScope(value);if(value==='business')setIncomeType('manual');setDuplicate(false);setError('');}}/>:null}
  {!initial&&historyPane&&onHistoryEdit?<><TransactionLink title="Volver al registro" onPress={()=>setHistoryPane(null)}/><View style={styles.history}><TransactionHistory key={`${historyPane}:${account}`} kind={historyPane} store={store} onEdit={onHistoryEdit} saved={historySaved??saved}/></View></>:<View style={styles.section} testID="movement-form-body">
   <Text accessibilityRole="header" style={styles.heading}>{sectionTitle}</Text>
   {moneyEntry?<CategoryPicker key={type} presentation="transaction" required={type==='expense'} categories={availableCategories} onCreated={created=>setAddedCategories(old=>[...old,created])} kind={type as 'income'|'expense'} value={category} onChange={(id,name)=>{setCategory(id);setCategoryName(name??'');if(commercial)setIncomeType('manual');setDuplicate(false);}}/>:null}
   {!initial&&kind!=='income'&&kind!=='expense'?<Choices<EntryKind> controlPresentation="transaction" label="Operación" value={type} options={(allowedKinds??['transfer','loan','debt_payment'] as EntryKind[]).map(key=>[key,kindLabels[key]] as const)} onChange={setType}/>:null}
   {moneyEntry?<Field presentation="transaction" compact label="Descripción (opcional)" value={description} onChangeText={v=>{setDescription(v);setDuplicate(false);}} multiline testID="movement-description"/>:null}
   <Field presentation="transaction" compact required label="Importe (USD)" value={amount} onChangeText={v=>{setAmount(v);setError('');setDuplicate(false);}} decimal testID="movement-amount"/>
   <DateField presentation="transaction" required label="Fecha" value={date} onChangeText={v=>{setDate(v);setDuplicate(false);}} testID="movement-date"/>
   {detectedPayment?<View style={{gap:8}}><Text style={styles.text}>Método de pago</Text><View style={styles.readOnly}><Text style={{fontSize:16,color:tc.fieldInk}}>{paymentMethodLabel(detectedPayment)}</Text></View></View>:<Choices<IncomePaymentMethod> controlPresentation="transaction" label="Método de pago" value={method} options={type==='income'?incomeMethods:moneyEntry?entryMethods('expense'):(Object.entries(paymentLabels) as [PaymentMethod,string][]).filter(([key])=>key!=='credit')} onChange={setMethod}/>}
   {type==='income'?<><TransactionLink title={addingMethod?'Cancelar creación de método':'+ Crear método de pago'} disabled={busy} testID="income-method-add" onPress={()=>setAddingMethod(!addingMethod)}/>{addingMethod?<View style={styles.options}><Field presentation="transaction" compact label="Nombre del método de pago" value={methodName} onChangeText={setMethodName} maxLength={60}/>{creatingMethod?<Text style={styles.text}>Creando método…</Text>:<ActionButton title="Crear y seleccionar método" testID="income-method-create" onPress={()=>void addIncomeMethod()}/>}<TransactionError message={methodError}/></View>:null}</>:null}
   {type==='expense'&&method==='credit'?<Text style={styles.text}>La compra cuenta como gasto y consume presupuesto. El pago posterior de la tarjeta reduce el flujo de efectivo, sin volver a contar la compra.</Text>:null}
   {type==='transfer'?<Text style={styles.text}>Transacción entre tus propias cuentas: no aumenta ingresos ni gastos y no cambia el total estimado.</Text>:null}
   {type==='loan'?<Text style={styles.text}>El préstamo recibido aumenta el flujo disponible, pero no es un ingreso ganado.</Text>:null}
   {type==='debt_payment'?<Text style={styles.text}>Este pago reduce el flujo disponible. No vuelve a contarse como gasto. El desglose de principal, intereses y cargos se añadirá en Deudas.</Text>:null}
   {commercial&&holders.length!==1?<View style={styles.options}>{holders.length?<Choices controlPresentation="transaction" required label="DBA o LLC" value={holderId} options={[["","Seleccionar negocio"],...holders.map(h=>[h.id,h.name] as const)]} onChange={setHolderId}/>:<><Text style={styles.text}>Crea primero tu DBA o LLC en Negocio.</Text><ActionButton title="Ir a Negocio" secondary onPress={()=>{close();router.push('/(tabs)/business');}}/></>}</View>:null}
   {type!=='expense'||commercial||initial?.scheduleId?<TransactionLink title={openOptions?'Ocultar opciones':'Más opciones'} disabled={busy} onPress={()=>setShowOptions(!showOptions)} testID="movement-more-options"/>:null}
   {openOptions?<View style={styles.options}>
    {commercial&&holders.length===1?<Choices controlPresentation="transaction" required label="DBA o LLC" value={holderId} options={[["","Seleccionar negocio"],...holders.map(h=>[h.id,h.name] as const)]} onChange={setHolderId}/>:null}
    {!moneyEntry?<Field presentation="transaction" compact label="Descripción (opcional)" value={description} onChangeText={v=>{setDescription(v);setDuplicate(false);}} multiline testID="movement-description"/>:null}
    {type==='income'&&!initial?<TransactionLink title="Cheque o talonario" onPress={()=>{close();router.push('/income-documents');}}/>:null}
    {initial?.scheduleId?<Text style={styles.text}>Ingreso vinculado a una recurrencia. Esta corrección no modifica los próximos cobros.</Text>:null}
    {type==='income'&&!commercial?<>
     {!initial?.scheduleId?<Choices<LedgerMovement['incomeType']> controlPresentation="transaction" label="Clase de ingreso" value={incomeType} options={initial?[['manual','Manual'],['extraordinary','Extraordinario']]:[['manual','Manual'],['recurring','Recurrente'],['extraordinary','Extraordinario']]} onChange={setIncomeType}/>:null}
     {!initial&&incomeType==='recurring'?<><Choices<'weekly'|'monthly'> controlPresentation="transaction" label="Frecuencia" value={cadence} options={[[ 'weekly','Semanas'],['monthly','Meses']]} onChange={setCadence}/><Field presentation="transaction" compact label="Cada cuántas semanas o meses (1–120)" value={interval} onChangeText={setInterval}/><Text style={styles.text}>Al guardar confirmas el primer cobro. Los siguientes aparecerán como previstos y solo se sumarán cuando confirmes que los recibiste.</Text></>:null}
    </>:null}
   </View>:null}
   {initial?<Text style={styles.text}>Original: {formatMoney(initial.amountCents)} · {initial.date}. La versión anterior se conserva en el historial cifrado.</Text>:null}
   <TransactionError message={error}/>
   {!busy&&duplicate?<><Text style={styles.text}>Si son dos operaciones distintas, puedes conservar ambas. Comprueba el historial antes de confirmar.</Text><TransactionLink title="Guardar como operación distinta" onPress={()=>void submit(true)}/></>:null}
   {!deleting?<TransactionSaveButton title={saveTitle} busy={busy} onPress={()=>{setDuplicate(false);void submit();}}/>:null}
   {documentReview&&onDeleteDocument?<TransactionLink title="Eliminar escaneo" testID="movement-delete-scan" disabled={busy} onPress={onDeleteDocument}/>:null}
   {initial&&!documentReview?<Pressable testID="movement-delete" accessibilityRole="button" accessibilityLabel={deleting?'Eliminando transacción':'Eliminar transacción'} accessibilityState={{disabled:busy,busy:deleting}} disabled={busy} onPress={()=>void remove()} style={{minHeight:48,padding:12,borderWidth:1,borderColor:tc.error,borderRadius:12,alignItems:'center',justifyContent:'center',opacity:busy?0.6:1}}><Text style={{color:tc.error,fontWeight:'700',fontSize:16}}>{deleting?'Eliminando…':'🗑 Eliminar transacción'}</Text></Pressable>:null}
   {!initial&&onHistoryEdit?<TransactionLink title="Editar historiales" disabled={busy} testID="movement-edit-histories" onPress={()=>setHistoryPane(type==='income'?'income':'expense')}/>:null}
  </View>}
  </>}
 </TransactionSheet>;
}
