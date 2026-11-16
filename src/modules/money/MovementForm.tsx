import {recognizedPayment} from '../documents/paymentRecognition';
import {entryMethods} from './entryContext';
import {announceSaved} from '../../ui/saveFeedback';
import {TransactionHistory,type TransactionHistoryKind} from './TransactionHistory';
import {router} from 'expo-router';
import { DateField } from '../../ui/DateField';
import { CategoryPicker } from './CategoryPicker';
import { userMessage, UserInputError } from '../../core/errors';
import { useRef,useState } from 'react';
import {ActivityIndicator,Pressable,View} from 'react-native';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { ActionButton, Body } from '../../ui/components';
import { localToday, formatMoney, inputAmount } from './domain';
import { Choices, ErrorNotice, Field, Sheet } from './fields';
import { DuplicateMovementError, type MoneyStore } from './store';
import { kindLabels, paymentLabels, type Category, type EntryKind, type IncomeSchedule, type LedgerMovement, type PaymentMethod } from './types';
export function MovementForm({ initial, kind, categories, store, close, saved, documentReview,allowedKinds,onHistoryEdit,historySaved,initialHistory,afterSave }: {
    initial?: LedgerMovement;
    onHistoryEdit?(movement:LedgerMovement):void;
    historySaved?():Promise<void>;
    initialHistory?:TransactionHistoryKind;
    afterSave?():void;
    kind: EntryKind;
    allowedKinds?:readonly EntryKind[];
    categories: Category[];
    store: MoneyStore;
    close(): void;
    saved(): Promise<void>;
    documentReview?: { id: string; version: number };
}) {
    const [identity] = useState(() => ({ id: initial?.id ?? newId(), operation: initial?.idempotencyKey ?? newId(), schedule: newId() }));
    const [type,setType] = useState<EntryKind>(initial?.kind as EntryKind ?? (initialHistory==='income'?'income':initialHistory==='expense'?'expense':kind));
    const [amount, setAmount] = useState(initial ? inputAmount(initial.amountCents) : '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [date, setDate] = useState(initial?.date ?? localToday());
    const [addedCategories,setAddedCategories]=useState<Category[]>([]);
    const availableCategories=[...categories,...addedCategories.filter(c=>!categories.some(old=>old.id===c.id))];
    const [category, setCategory] = useState(initial?.categoryId ?? '');
    const [categoryName,setCategoryName] = useState(categories.find(c=>c.id===initial?.categoryId)?.name??'');
    const [method, setMethod] = useState<PaymentMethod>((initial ? (initial.paymentMethod ?? '') : 'bank') as PaymentMethod);
    const [incomeType, setIncomeType] = useState(initial?.incomeType ?? 'manual');
    const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly');
    const [interval, setInterval] = useState('1');
    const [tax] = useState(initial?.taxReview ? 'yes' : 'no');
    const [use] = useState(initial?.useKind ?? 'unknown');
    const [historyPane,setHistoryPane]=useState<TransactionHistoryKind|null>(initialHistory??null);
    const submitting=useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [duplicate, setDuplicate] = useState(false);
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
            const m: LedgerMovement = { id: identity.id, idempotencyKey: identity.operation, kind: type, amountCents: parseAmount(amount.trim()), currency: 'USD', date, description: type==='expense'?(initial?.description||categoryName||categories.find(c=>c.id===category)?.name||'Gasto'):(description.trim()||categoryName||categories.find(c=>c.id===category)?.name||kindLabels[type]), categoryId: category || null, paymentMethod: recognizedPayment(description)||method, taxReview: tax === 'yes', useKind: use, grossCents: type === 'income' ? initial?.grossCents??null : null, withholdingCents: type === 'income' ? initial?.withholdingCents??null : null, createdAt: initial?.createdAt ?? now, updatedAt: now, deletedAt: null, incomeType: type === 'income' ? incomeType : 'manual', scheduleId, occurrenceDate: initial?.occurrenceDate ?? (scheduleId ? date : null), version: initial?.version ?? 1 };
            let schedule: IncomeSchedule | undefined;
            if (!initial && scheduleId) {
                if (!/^\d+$/.test(interval))
                    throw new UserInputError('El intervalo debe ser un número entero.');
                schedule = { id: scheduleId, description: m.description, amountCents: m.amountCents, categoryId: m.categoryId, paymentMethod: m.paymentMethod, cadence, intervalCount: Number(interval), anchorDate: date, nextDate: date, active: true };
            }
            if (initial)
                await (documentReview?store.edit(m,undefined,allowDuplicate,documentReview):store.editFromHistory(m,allowDuplicate));
            else
                await store.create(m, allowDuplicate, schedule);
            announceSaved();await saved();
            if(afterSave)afterSave();else close();
        }
        catch (e) {
            setError(userMessage(e));
            setDuplicate(e instanceof DuplicateMovementError);
        }
        finally {
            submitting.current=false;setBusy(false);
        }
    }
    return <Sheet title={initial ? 'Editar transacción' : 'Nueva transacción'} close={close} busy={busy} headerAction={!historyPane&&!busy?<><ErrorNotice message={error}/><ActionButton title={initial?'Guardar':type==='expense'?'Guardar gasto':type==='income'?'Guardar ingreso':'Guardar transacción'} onPress={()=>{setDuplicate(false);void submit();}}/></>:null}>
  {!initial&&(kind==='income'||kind==='expense')?<Choices<'income'|'expense'> compact label="Tipo de transacción" presentation="tabs" value={type as 'income'|'expense'} options={[["expense","↓ Gasto"],["income","↑ Ingreso"]]} onChange={value=>{setHistoryPane(null);setType(value);if(value==='income'&&method==='credit')setMethod('bank');setCategory('');setCategoryName('');setDuplicate(false);setError('');}}/>:null}
  {!initial&&onHistoryEdit?<View style={{gap:6}}><Body muted style={{fontSize:13}}>Historiales</Body><View style={{flexDirection:'row',gap:8}}>{(type==='income'?([['income','Ingresos']] as const):type==='expense'?([['expense','Gastos']] as const):([['expense','Gastos'],['income','Ingresos']] as const)).map(([value,label])=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:historyPane===value}} onPress={()=>setHistoryPane(historyPane===value?null:value)} style={{flex:1,minHeight:44,paddingHorizontal:8,borderWidth:1,borderColor:'#5C9B8E',borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:historyPane===value?'#D9F5E8':'transparent'}}><Body style={{fontSize:13,fontWeight:'700',...(historyPane===value?{color:'#005B43'}:{})}}>{label}</Body></Pressable>)}</View></View>:null}
  {!initial&&historyPane&&onHistoryEdit?<TransactionHistory key={historyPane} kind={historyPane} store={store} onEdit={onHistoryEdit} saved={historySaved??saved}/>:<>
  {(type === 'income' || type === 'expense') ? <CategoryPicker key={type} required={type==='expense'} categories={availableCategories} onCreated={created=>setAddedCategories(old=>[...old,created])} kind={type} value={category} onChange={(id,name)=>{setCategory(id);setCategoryName(name??'');setDuplicate(false);}}/> : null}
  {type==='income'&&!initial?<ActionButton title="Cheque o talonario" icon="camera-outline" onPress={()=>{close();router.push('/income-documents');}}/>:null}

  {!initial&&kind!=='income'&&kind!=='expense'?<Choices<EntryKind> label="Operación" value={type} options={(allowedKinds??['transfer','loan','debt_payment'] as EntryKind[]).map(key=>[key,kindLabels[key]] as const)} onChange={setType}/>:null}
  {initial?.scheduleId?<Body>Ingreso vinculado a una recurrencia. Esta corrección no modifica los próximos cobros.</Body>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}><View style={{flex:1,minWidth:140}}><DateField required label="Fecha" value={date} onChangeText={v => { setDate(v); setDuplicate(false); }} testID="movement-date"/></View>{<View style={{flex:1,minWidth:140}}><Field compact label={type==='income'?'Importe recibido (USD)':'Importe (USD)'} value={amount} onChangeText={v => { setAmount(v); setDuplicate(false); }} decimal testID="movement-amount"/></View>}</View>
  {type!=='expense'?<Field label="Descripción (opcional)" value={description} onChangeText={v => { setDescription(v); setDuplicate(false); }} multiline testID="movement-description"/>:null}

  {recognizedPayment(description)?<Body>Método identificado: {paymentLabels[recognizedPayment(description)!]}</Body>:<Choices<PaymentMethod> label={type==='income'?'Cómo recibiste el ingreso':'Método de pago'} value={method} options={type==='income'||type==='expense'?entryMethods(type):(Object.entries(paymentLabels) as [PaymentMethod,string][]).filter(([key])=>key!=='credit')} onChange={setMethod}/>}
  {type === 'expense' && method === 'credit' ? <Body>La compra cuenta como gasto y consume presupuesto. El pago posterior de la tarjeta reduce el flujo de efectivo, sin volver a contar la compra.</Body> : null}
  {type === 'transfer' ? <Body>Transacción entre tus propias cuentas: no aumenta ingresos ni gastos y no cambia el total estimado.</Body> : null}
  {type === 'loan' ? <Body>El préstamo recibido aumenta el flujo disponible, pero no es un ingreso ganado.</Body> : null}
  {type === 'debt_payment' ? <Body>Este pago reduce el flujo disponible. No vuelve a contarse como gasto. El desglose de principal, intereses y cargos se añadirá en Deudas.</Body> : null}
  {type === 'income' ? <>
   {!initial?.scheduleId ? <Choices<LedgerMovement['incomeType']> label="Clase de ingreso" value={incomeType} options={initial ? [['manual', 'Manual'], ['extraordinary', 'Extraordinario']] : [['manual', 'Manual'], ['recurring', 'Recurrente'], ['extraordinary', 'Extraordinario']]} onChange={setIncomeType}/> : null}
   {!initial && incomeType === 'recurring' ? <View style={{ gap: 14 }}><Choices<'weekly' | 'monthly'> label="Frecuencia" value={cadence} options={[['weekly', 'Semanas'], ['monthly', 'Meses']]} onChange={setCadence}/><Field label="Cada cuántas semanas o meses (1–120)" value={interval} onChangeText={setInterval}/><Body>Al guardar confirmas el primer cobro. Los siguientes aparecerán como previstos y solo se sumarán cuando confirmes que los recibiste.</Body></View> : null}
  </> : null}
  <ErrorNotice message={error}/>
  {busy?<ActivityIndicator accessibilityLabel="Guardando cambios"/>:null}
  {!busy && duplicate ? <><Body>Si son dos operaciones distintas, puedes conservar ambas. Comprueba el historial antes de confirmar.</Body><ActionButton title="Guardar como operación distinta" secondary onPress={() => void submit(true)}/></> : null}
  {initial ? <Body muted>Original: {formatMoney(initial.amountCents)} · {initial.date}. La versión anterior se conserva en el historial cifrado.</Body> : null}
 </>}
 </Sheet>;
}
