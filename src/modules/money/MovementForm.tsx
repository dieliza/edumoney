import { userMessage, UserInputError } from '../../core/errors';
import { useState } from 'react';
import { View } from 'react-native';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { ActionButton, Body } from '../../ui/components';
import { localToday, formatMoney, inputAmount } from './domain';
import { Choices, ErrorNotice, Field, Sheet } from './fields';
import { DuplicateMovementError, type MoneyStore } from './store';
import { kindLabels, paymentLabels, type Category, type EntryKind, type IncomeSchedule, type LedgerMovement, type PaymentMethod } from './types';
export function MovementForm({ initial, kind, categories, store, close, saved }: {
    initial?: LedgerMovement;
    kind: EntryKind;
    categories: Category[];
    store: MoneyStore;
    close(): void;
    saved(): Promise<void>;
}) {
    const [identity] = useState(() => ({ id: initial?.id ?? newId(), operation: initial?.idempotencyKey ?? newId(), schedule: newId() }));
    const [type, setType] = useState<EntryKind>(initial?.kind as EntryKind ?? kind);
    const [amount, setAmount] = useState(initial ? inputAmount(initial.amountCents) : '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [date, setDate] = useState(initial?.date ?? localToday());
    const [category, setCategory] = useState(initial?.categoryId ?? '');
    const [method, setMethod] = useState<PaymentMethod>((initial ? (initial.paymentMethod ?? '') : 'bank') as PaymentMethod);
    const [incomeType, setIncomeType] = useState(initial?.incomeType ?? 'manual');
    const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly');
    const [interval, setInterval] = useState('1');
    const [tax, setTax] = useState(initial?.taxReview ? 'yes' : 'no');
    const [use, setUse] = useState(initial?.useKind ?? 'unknown');
    const [gross, setGross] = useState(initial?.grossCents != null ? inputAmount(initial.grossCents) : '');
    const [withholding, setWithholding] = useState(initial?.withholdingCents != null ? inputAmount(initial.withholdingCents) : '');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [duplicate, setDuplicate] = useState(false);
    function changeType(value: EntryKind) { setType(value); setCategory(''); setIncomeType('manual'); if (value !== 'expense' && method === 'credit')
        setMethod('bank'); }
    async function submit(allowDuplicate = false) {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            const now = new Date().toISOString();
            const scheduleId = !initial && type === 'income' && incomeType === 'recurring' ? identity.schedule : initial?.scheduleId ?? null;
            const m: LedgerMovement = { id: identity.id, idempotencyKey: identity.operation, kind: type, amountCents: parseAmount(amount.trim()), currency: 'USD', date, description: description.trim(), categoryId: category || null, paymentMethod: method, taxReview: tax === 'yes', useKind: use, grossCents: type === 'income' && gross.trim() ? parseAmount(gross.trim()) : null, withholdingCents: type === 'income' && withholding.trim() ? parseAmount(withholding.trim()) : null, createdAt: initial?.createdAt ?? now, updatedAt: now, deletedAt: null, incomeType: type === 'income' ? incomeType : 'manual', scheduleId, occurrenceDate: initial?.occurrenceDate ?? (scheduleId ? date : null), version: initial?.version ?? 1 };
            let schedule: IncomeSchedule | undefined;
            if (!initial && scheduleId) {
                if (!/^\d+$/.test(interval))
                    throw new UserInputError('El intervalo debe ser un número entero.');
                schedule = { id: scheduleId, description: m.description, amountCents: m.amountCents, categoryId: m.categoryId, paymentMethod: m.paymentMethod, cadence, intervalCount: Number(interval), anchorDate: date, nextDate: date, active: true };
            }
            if (initial)
                await store.edit(m, reason, allowDuplicate);
            else
                await store.create(m, allowDuplicate, schedule);
            await saved();
            close();
        }
        catch (e) {
            setError(userMessage(e));
            setDuplicate(e instanceof DuplicateMovementError);
        }
        finally {
            setBusy(false);
        }
    }
    return <Sheet title={initial ? 'Corregir movimiento' : kind === 'income' ? 'Añadir ingreso' : kind === 'expense' ? 'Registrar gasto' : 'Registrar otro movimiento'} close={close} busy={busy}>
  <Body muted>USD · Datos guardados únicamente en la base cifrada de este dispositivo.</Body>
  {!initial?.scheduleId ? <Choices label="Tipo de movimiento" value={type} options={Object.entries(kindLabels) as [
        EntryKind,
        string
    ][]} onChange={changeType}/> : <Body>Ingreso vinculado a una recurrencia. Esta corrección no modifica los próximos cobros.</Body>}
  <Field label={type === 'income' ? 'Importe recibido o neto (USD)' : 'Importe (USD)'} value={amount} onChangeText={v => { setAmount(v); setDuplicate(false); }} decimal testID="movement-amount"/>
  <Field label="Fecha (AAAA-MM-DD)" value={date} onChangeText={v => { setDate(v); setDuplicate(false); }} testID="movement-date"/>
  <Field label="Descripción" value={description} onChangeText={v => { setDescription(v); setDuplicate(false); }} multiline testID="movement-description"/>
  {(type === 'income' || type === 'expense') ? <Choices label="Categoría" value={category} options={[['', 'Sin categoría'], ...categories.filter(c => c.kind === type && (!c.archived || c.id === initial?.categoryId)).map(c => [c.id, c.name] as const)]} onChange={setCategory}/> : null}
  <Choices<PaymentMethod> label="Método de pago" value={method} options={(Object.entries(paymentLabels) as [
        PaymentMethod,
        string
    ][]).filter(([key]) => type === 'expense' || key !== 'credit')} onChange={setMethod}/>
  {type === 'expense' && method === 'credit' ? <Body>La compra cuenta como gasto y consume presupuesto. El pago posterior de la tarjeta reduce el flujo de efectivo, sin volver a contar la compra.</Body> : null}
  {type === 'transfer' ? <Body>Movimiento entre tus propias cuentas: no aumenta ingresos ni gastos y no cambia el total estimado.</Body> : null}
  {type === 'loan' ? <Body>El préstamo recibido aumenta el flujo disponible, pero no es un ingreso ganado.</Body> : null}
  {type === 'debt_payment' ? <Body>Este pago reduce el flujo disponible. No vuelve a contarse como gasto. El desglose de principal, intereses y cargos se añadirá en Deudas.</Body> : null}
  {type === 'income' ? <>
   {!initial?.scheduleId ? <Choices<LedgerMovement['incomeType']> label="Clase de ingreso" value={incomeType} options={initial ? [['manual', 'Manual'], ['extraordinary', 'Extraordinario']] : [['manual', 'Manual'], ['recurring', 'Recurrente'], ['extraordinary', 'Extraordinario']]} onChange={setIncomeType}/> : null}
   {!initial && incomeType === 'recurring' ? <View style={{ gap: 14 }}><Choices<'weekly' | 'monthly'> label="Frecuencia" value={cadence} options={[['weekly', 'Semanas'], ['monthly', 'Meses']]} onChange={setCadence}/><Field label="Cada cuántas semanas o meses (1–120)" value={interval} onChangeText={setInterval}/><Body>Al guardar confirmas el primer cobro. Los siguientes aparecerán como previstos y solo se sumarán cuando confirmes que los recibiste.</Body></View> : null}
   <Field label="Ingreso bruto (opcional, USD)" value={gross} onChangeText={setGross} decimal/>
   <Field label="Retención (opcional, USD)" value={withholding} onChangeText={setWithholding} decimal/>
   <Body muted>El resumen usa el importe recibido. Bruto y retención se conservan para revisión; no se suman otra vez ni se calcula una planilla.</Body>
  </> : null}
  <Choices label="Para revisión de mi contable" value={tax} options={[['no', 'No marcar'], ['yes', 'Marcar para revisión']]} onChange={setTax}/>
  <Choices<LedgerMovement['useKind']> label="Uso del movimiento" value={use} options={[['unknown', 'Sin clasificar'], ['personal', 'Personal'], ['business', 'Comercial'], ['mixed', 'Mixto']]} onChange={setUse}/>
  <Body muted>Marcar para revisión no implica que sea deducible.</Body>
  {initial ? <Field label="Motivo de la corrección" value={reason} onChangeText={setReason} multiline/> : null}
  <ErrorNotice message={error}/>
  {!busy ? <ActionButton title={initial ? 'Guardar corrección' : 'Guardar movimiento'} onPress={() => { setDuplicate(false); void submit(); }}/> : null}
  {!busy && duplicate ? <><Body>Si son dos operaciones distintas, puedes conservar ambas. Comprueba el historial antes de confirmar.</Body><ActionButton title="Guardar como operación distinta" secondary onPress={() => void submit(true)}/></> : null}
  {initial ? <Body muted>Original: {formatMoney(initial.amountCents)} · {initial.date}. La versión anterior se conserva en el historial cifrado.</Body> : null}
 </Sheet>;
}
