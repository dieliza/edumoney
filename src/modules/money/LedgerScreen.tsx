import { userMessage } from '../../core/errors';
import { useEffect, useMemo, useState } from 'react';
import { AppState, ActivityIndicator, Pressable, View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { refreshBills } from '../bills/runtime';
import { billStatus, outstanding } from '../bills/domain';
import type { Bill } from '../bills/types';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { ActionButton, Body, Card, Screen, SectionHeading, ui } from '../../ui/components';
import { localToday, formatMoney, monthlySummary, validDate, validMonth } from './domain';
import { getMoneyStore } from './localStore';
import type { MoneyStore } from './store';
import { kindLabels, paymentLabels, type Category, type EntryKind, type LedgerMovement, type Snapshot } from './types';
import { Choices, ErrorNotice, Field, Sheet } from './fields';
import { MovementForm } from './MovementForm';
const empty: Snapshot = { movements: [], categories: [], budgets: [], schedules: [], commitments: [] };
export default function LedgerScreen() {
    const { colors } = useTheme();
    const focused = useIsFocused();
    const [bills,setBills] = useState<Bill[]>([]);
    const [store, setStore] = useState<MoneyStore | null>(null);
    const [data, setData] = useState(empty);
    const [error, setError] = useState('');
    const [segment, setSegment] = useState('summary');
    const [month, setMonth] = useState(localToday().slice(0, 7));
    const [form, setForm] = useState<{
        kind: EntryKind;
        initial?: LedgerMovement;
    } | null>(null);
    const [category, setCategory] = useState<Category | null | undefined>();
    const [budget, setBudget] = useState(false);
    const [selected, setSelected] = useState<LedgerMovement | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [revisions, setRevisions] = useState<{
        action: string;
        reason: string;
        recordedAt: string;
    }[] | null>(null);
    const [query, setQuery] = useState('');
    const [filterKind, setFilterKind] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMethod, setFilterMethod] = useState('all');
    const [deleted, setDeleted] = useState('active');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [limit, setLimit] = useState(50);
    useEffect(() => {
        if (!focused) return;
        let active = true;
        const load = async () => {
            const s = await getMoneyStore();
            const result = await refreshBills();
            const snapshot = await s.snapshot();
            if (active) { setStore(s); setData(snapshot); setBills(result.data.bills); }
        };
        const reload = () => { void load().catch(() => { if (active) setError('No pudimos cargar tus registros cifrados. Cierra y vuelve a abrir la app.'); }); };
        reload();
        const subscription = AppState.addEventListener('change', state => { if (state === 'active') reload(); });
        return () => { active = false; subscription.remove(); };
    }, [focused]);
    async function refresh() { if (store)
        setData(await store.snapshot()); }
    async function action(task: () => Promise<unknown>, message: string) { if (busy)
        return; setBusy(true); setError(''); try {
        await task();
        await refresh();
        setNotice(message);
    }
    catch (e) {
        setError(userMessage(e));
    }
    finally {
        setBusy(false);
    } }
    const { summary, summaryError } = useMemo(() => {
        try {
            return validMonth(month) ? { summary: monthlySummary(data, month), summaryError: '' } : { summary: null, summaryError: 'Escribe un mes válido en formato AAAA-MM.' };
        }
        catch {
            return { summary: null, summaryError: 'El total supera el rango monetario admitido. Revisa los importes registrados.' };
        }
    }, [data, month]);
    const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
    const filterError = (from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to) ? 'Revisa el rango de fechas (AAAA-MM-DD).' : '';
    const rows = filterError ? [] : data.movements.filter(m => (deleted === 'deleted' ? !!m.deletedAt : !m.deletedAt) && (filterKind === 'all' || m.kind === filterKind) && (filterCategory === 'all' || (m.categoryId ?? 'none') === filterCategory) && (filterMethod === 'all' || m.paymentMethod === filterMethod) && (!from || m.date >= from) && (!to || m.date <= to) && normalize(m.description).includes(normalize(query)));
    const categoryName = (id: string | null) => data.categories.find(c => c.id === id)?.name ?? 'Sin categoría';
    return <Screen title="Mi dinero" demo={false} subtitle="Tus registros, solo en este dispositivo.">
  <ErrorNotice message={error}/>{notice ? <Card><Body>{notice}</Body></Card> : null}
  {!store ? <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando registros cifrados"/> : <>
   <Choices label="Vista de Mi dinero" value={segment} options={[['summary', 'Resumen'], ['history', 'Historial'], ['categories', 'Categorías']]} onChange={setSegment}/>

   {segment !== 'summary' ? <View style={{ gap: 12 }}><ActionButton title="Añadir ingreso" icon="add-circle-outline" onPress={() => setForm({ kind: 'income' })}/><ActionButton title="Registrar gasto" icon="receipt-outline" onPress={() => setForm({ kind: 'expense' })}/><ActionButton title="Registrar transferencia, préstamo o pago" secondary onPress={() => setForm({ kind: 'transfer' })}/></View> : null}
   {segment !== 'history' ? <Field label="Mes (AAAA-MM)" value={month} onChangeText={setMonth}/> : null}
   {segment !== 'history' ? <ErrorNotice message={summaryError}/> : null}
   {segment === 'summary' && summary ? <>
    <Card style={{ backgroundColor: colors.mint }}><Body style={{ fontWeight: '700' }}>Disponible estimado del mes</Body><Body style={{ fontSize: 32, lineHeight: 40, fontWeight: '800' }}>{formatMoney(summary.available)}</Body><Body muted>Estimación basada en los registros del mes completo, incluidas fechas futuras. Parte de cero; no representa el saldo de tus cuentas bancarias.</Body></Card>
   <View style={{ gap: 12 }}><ActionButton title="Añadir ingreso" icon="add-circle-outline" onPress={() => setForm({ kind: 'income' })}/><ActionButton title="Registrar gasto" icon="receipt-outline" onPress={() => setForm({ kind: 'expense' })}/><ActionButton title="Registrar transferencia, préstamo o pago" secondary onPress={() => setForm({ kind: 'transfer' })}/></View>
    <Card>{[['Ingresos recibidos', summary.income], ['Gastos registrados', summary.expenses], ['Préstamos recibidos (no son ingresos)', summary.loans], ['Pagos de tarjeta o deuda', summary.payments], ['Compromisos pendientes registrados', summary.commitments]].map(([label, value]) => <View key={label} style={ui.between}><Body style={{ flex: 1 }}>{label}</Body><Body style={{ fontWeight: '700' }}>{formatMoney(value as number)}</Body></View>)}
     <Body muted>Disponible = ingresos + préstamos − gastos pagados sin crédito − pagos de deuda − aportaciones − compromisos pendientes. Las transferencias propias no alteran el total. Las compras con crédito consumen presupuesto; su pago reduce el disponible una sola vez.</Body>
     {!data.commitments.length ? <Body muted>No hay facturas pendientes registradas. Añade una factura para preparar tus vencimientos.</Body> : null}
    </Card>
    <SectionHeading title="Próximas facturas" action="Ver todas" onPress={() => router.push('/bills')}/>
    <ActionButton title="Mis facturas" testID="open-bills" icon="calendar-outline" secondary onPress={() => router.push('/bills')}/>
    {bills.filter(b => !b.voidedAt && outstanding(b)>0).slice(0,5).map(b => <Card key={b.id}><Body style={{fontWeight:'700'}}>{b.provider}</Body><Body>{b.dueDate} · {billStatus(b,localToday())}</Body><Body>Pendiente: {formatMoney(outstanding(b))}</Body></Card>)}
    <SectionHeading title="Distribución de gastos"/>
    <Distribution summary={summary}/>
    <SectionHeading title="Ingresos recurrentes"/>
    <Card><Body muted>Las fechas previstas no son dinero recibido. Confirma cada cobro una sola vez; editar un cobro pasado no cambia su programación.</Body></Card>
    {!data.schedules.length ? <Card><Body>Añade un ingreso y elige Recurrente para preparar tus siguientes cobros.</Body></Card> : data.schedules.map(s => <Card key={s.id}><Body style={{ fontWeight: '700' }}>{s.description}</Body><Body>{formatMoney(s.amountCents)} · {s.active ? 'Próximo previsto' : 'En pausa'}: {s.nextDate}</Body><Body muted>Cada {s.intervalCount} {s.cadence === 'weekly' ? 'semana(s)' : 'mes(es)'}</Body>
     {s.active && s.nextDate <= localToday() && !busy ? <ActionButton title={`Confirmar cobro: ${s.description}`} onPress={() => void action(() => store.confirmSchedule(s.id, s.nextDate, newId(), localToday()), 'Cobro registrado. Los siguientes permanecen previstos.')}/> : null}
     {!busy ? <ActionButton title={s.active ? `Pausar: ${s.description}` : `Reanudar: ${s.description}`} secondary onPress={() => void action(() => store.toggleSchedule(s.id, !s.active), 'Programación actualizada. Los movimientos anteriores se conservan.')}/> : null}
    </Card>)}
    <Card><Body style={{ fontWeight: '700' }}>Para mi contable</Body><Body>En cada movimiento puedes marcar revisión, uso personal/comercial/mixto, bruto y retención. La marca no confirma deducibilidad. La organización del expediente contributivo estará disponible próximamente.</Body></Card>
   </> : null}
   {segment === 'history' ? <>
    <Field label="Buscar descripción" value={query} onChangeText={v => { setQuery(v); setLimit(50); }}/>
    <Choices label="Tipo" value={filterKind} options={[['all', 'Todos'], ...Object.entries(kindLabels)]} onChange={v => { setFilterKind(v); setLimit(50); }}/>
    <Choices label="Filtrar categoría" value={filterCategory} options={[['all', 'Todas'], ['none', 'Sin categoría'], ...data.categories.map(c => [c.id, c.name] as const)]} onChange={setFilterCategory}/>
    <Choices label="Filtrar método" value={filterMethod} options={[['all', 'Todos los métodos'], ...Object.entries(paymentLabels)]} onChange={setFilterMethod}/>
    <Field label="Desde (AAAA-MM-DD, opcional)" value={from} onChangeText={setFrom}/><Field label="Hasta (AAAA-MM-DD, opcional)" value={to} onChangeText={setTo}/>
    <Choices label="Estado" value={deleted} options={[['active', 'Activos'], ['deleted', 'Eliminados']]} onChange={setDeleted}/><ErrorNotice message={filterError}/>
    <Card><Body>{rows.length} movimiento(s). Toca uno para revisar, corregir o restaurar.</Body></Card>
    {rows.slice(0, limit).map(m => <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`${m.description}, ${formatMoney(m.amountCents)}, ${m.date}`} onPress={() => { setSelected(m); setReason(''); setRevisions(null); setError(''); }}><Card><Body style={{ fontWeight: '700' }}>{m.description}</Body><Body>{formatMoney(m.amountCents)} · {m.date}</Body><Body muted>{kindLabels[m.kind as EntryKind] ?? 'Aportación a meta'} · {categoryName(m.categoryId)} · {paymentLabels[m.paymentMethod as keyof typeof paymentLabels] ?? m.paymentMethod}</Body>{m.taxReview ? <Body muted>Marcado para revisión contributiva</Body> : null}</Card></Pressable>)}
    {!rows.length ? <Card><Body>No hay movimientos que coincidan. Los importes de ejemplo de otras pestañas no se mezclan con tus registros.</Body></Card> : null}
    {rows.length > limit ? <ActionButton title="Mostrar más movimientos" secondary onPress={() => setLimit(limit + 50)}/> : null}
   </> : null}
   {segment === 'categories' ? <>
    <ActionButton title="Crear categoría" onPress={() => setCategory(null)}/>
    {validMonth(month) ? <ActionButton title="Definir presupuesto mensual" secondary onPress={() => setBudget(true)}/> : null}
    {summary ? <Distribution summary={summary} budget/> : null}
    <SectionHeading title="Tus categorías"/>
    {data.categories.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Editar categoría ${c.name}`} onPress={() => setCategory(c)}><Card><Body>{c.name} · {c.kind === 'expense' ? 'Gasto' : 'Ingreso'}{c.archived ? ' · Archivada' : ''}</Body></Card></Pressable>)}
   </> : null}
   {form ? <MovementForm initial={form.initial} kind={form.kind} categories={data.categories} store={store} close={() => setForm(null)} saved={async () => { await refresh(); setNotice('Movimiento guardado en este dispositivo.'); }}/> : null}
   {category !== undefined ? <CategoryForm initial={category} store={store} saved={refresh} close={() => setCategory(undefined)}/> : null}
   {budget ? <BudgetForm data={data} month={month} store={store} saved={refresh} close={() => setBudget(false)}/> : null}
   {selected ? <Sheet title="Detalle del movimiento" close={() => setSelected(null)} busy={busy}>
    <Body style={{ fontWeight: '700' }}>{selected.description} · {formatMoney(selected.amountCents)}</Body><Body>{selected.date} · {kindLabels[selected.kind as EntryKind] ?? selected.kind}</Body><Body muted>Identificador: {selected.id}</Body>
    {selected.grossCents !== null ? <Body>Bruto registrado: {formatMoney(selected.grossCents)}</Body> : null}{selected.withholdingCents !== null ? <Body>Retención: {formatMoney(selected.withholdingCents)}</Body> : null}
    <Body>Uso: {selected.useKind === 'unknown' ? 'Sin clasificar' : selected.useKind === 'personal' ? 'Personal' : selected.useKind === 'business' ? 'Comercial' : 'Mixto'} · {selected.taxReview ? 'Marcado para revisión' : 'Sin marca contributiva'}</Body>
    {selected.scheduleId ? <Body muted>Vinculado a ingreso recurrente. Eliminarlo no vuelve a generar este cobro; puedes restaurarlo.</Body> : null}
    {!selected.deletedAt && !busy ? <ActionButton title="Corregir movimiento" onPress={() => { setForm({ initial: selected, kind: selected.kind as EntryKind }); setSelected(null); }}/> : null}
    <Field label={selected.deletedAt ? 'Motivo de restauración' : 'Motivo de eliminación'} value={reason} onChangeText={setReason} multiline/>
    <Body muted>{selected.deletedAt ? 'La restauración vuelve a incluirlo en los cálculos.' : 'La eliminación lo retira de los cálculos y conserva su historial. Puedes restaurarlo desde Eliminados.'}</Body>
    {!busy ? <ActionButton title={selected.deletedAt ? 'Confirmar restauración' : 'Confirmar eliminación'} secondary onPress={() => void action(async () => { await store.setDeleted(selected.id, selected.version, !selected.deletedAt, reason); setSelected(null); }, selected.deletedAt ? 'Movimiento restaurado.' : 'Movimiento retirado de los cálculos; disponible en Eliminados.')}/> : null}
    {!busy ? <ActionButton title="Ver historial de correcciones" secondary onPress={() => void action(async () => setRevisions(await store.revisions(selected.id)), 'Historial cargado.')}/> : null}
    {revisions?.length === 0 ? <Body>Sin correcciones registradas.</Body> : null}{revisions?.map((r, index) => <Body key={index}>{r.recordedAt} · {r.action === 'edit' ? 'Corrección' : r.action === 'delete' ? 'Eliminación' : 'Restauración'} · {r.reason}</Body>)}<ErrorNotice message={error}/>
   </Sheet> : null}
  </>}
 </Screen>;
}
function Distribution({ summary, budget = false }: {
    summary: ReturnType<typeof monthlySummary>;
    budget?: boolean;
}) {
    const { colors } = useTheme();
    const items = summary.distribution.filter(c => budget ? c.budget !== null || c.spent > 0 : c.spent > 0);
    return <Card>{!items.length ? <Body>{budget ? 'Define un presupuesto para comparar tus gastos.' : 'Aún no hay gastos registrados en este mes.'}</Body> : null}
  {!budget && summary.expenses > 0 ? <View accessible accessibilityLabel={`Gastos del mes: ${formatMoney(summary.expenses)}. Desglose a continuación.`} style={{ alignItems: 'center' }}><Svg width={190} height={190} viewBox="0 0 190 190" aria-hidden>
   {items.map((item, index) => { const c = 2 * Math.PI * 70; const previous = items.slice(0, index).reduce((n, x) => n + BigInt(x.spent), 0n); return <Circle key={item.id} cx={95} cy={95} r={70} fill="none" stroke={[fixed.iconMint, fixed.iconBlue, fixed.iconCoral, fixed.iconViolet][index % 4]} strokeWidth={24} strokeDasharray={`${c * Number(BigInt(item.spent) * 10000n / BigInt(summary.expenses)) / 10000} ${c}`} strokeDashoffset={-c * Number(previous * 10000n / BigInt(summary.expenses)) / 10000} rotation={-90} origin="95,95"/>; })}
  </Svg></View> : null}
  {items.map(item => {
            const pct = item.budget && item.budget > 0 ? Number(BigInt(item.spent) * 100n / BigInt(item.budget)) : 0;
            return <View key={item.id} style={{ gap: 8 }}><View style={ui.between}><Body style={{ flex: 1, fontWeight: '600' }}>{item.name}</Body><Body>{formatMoney(item.spent)}</Body></View>
   {budget ? <><Body muted>{item.budget === null ? 'Sin presupuesto definido' : `Presupuesto: ${formatMoney(item.budget)} · ${formatMoney(item.budget - item.spent)} restante`}</Body>{item.budget !== null ? <><View accessible accessibilityLabel={item.budget === 0 ? 'Presupuesto cero' : `${pct}% del presupuesto utilizado`} style={{ height: 10, borderRadius: 8, backgroundColor: colors.progressTrack, overflow: 'hidden' }}><View style={{ height: 10, width: `${Math.min(100, pct)}%`, backgroundColor: item.spent > item.budget ? fixed.expense : colors.primary }}/></View><Body muted>{item.budget === 0 ? (item.spent ? 'Hay gastos con presupuesto cero.' : 'Presupuesto cero, sin gastos.') : `${pct}% utilizado`}{item.spent > item.budget ? ' · Supera lo presupuestado' : ''}</Body></> : null}</> : <Body muted>{summary.expenses ? Number(BigInt(item.spent) * 10000n / BigInt(summary.expenses)) / 100 : 0}% del gasto mensual</Body>}
  </View>;
        })}
 </Card>;
}
function CategoryForm({ initial, store, saved, close }: {
    initial: Category | null;
    store: MoneyStore;
    saved(): Promise<void>;
    close(): void;
}) {
    const [id] = useState(() => initial?.id ?? newId());
    const [name, setName] = useState(initial?.name ?? '');
    const [kind, setKind] = useState<'income' | 'expense'>(initial?.kind ?? 'expense');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save(archived: boolean) { if (busy)
        return; setBusy(true); try {
        await store.saveCategory(id, name, kind, archived);
        await saved();
        close();
    }
    catch (e) {
        setError(userMessage(e));
    }
    finally {
        setBusy(false);
    } }
    return <Sheet title={initial ? 'Editar categoría' : 'Crear categoría'} close={close} busy={busy}><Field label="Nombre de categoría" value={name} onChangeText={setName}/>{!initial ? <Choices<'income' | 'expense'> label="Clase de categoría" value={kind} options={[['expense', 'Gasto'], ['income', 'Ingreso']]} onChange={setKind}/> : null}<Body muted>Archivar conserva los movimientos y presupuestos anteriores; puedes reactivar la categoría.</Body><ErrorNotice message={error}/>{!busy ? <><ActionButton title="Guardar categoría" onPress={() => void save(initial?.archived ?? false)}/>{initial ? <ActionButton title={initial.archived ? 'Reactivar categoría' : 'Archivar categoría'} secondary onPress={() => void save(!initial.archived)}/> : null}</> : null}</Sheet>;
}
function BudgetForm({ data, month, store, saved, close }: {
    data: Snapshot;
    month: string;
    store: MoneyStore;
    saved(): Promise<void>;
    close(): void;
}) {
    const active = data.categories.filter(c => !c.archived && c.kind === 'expense');
    const [category, setCategory] = useState(active[0]?.id ?? '');
    const existing = (id: string) => { const value = data.budgets.find(b => b.month === month && b.categoryId === id)?.amountCents; return value === undefined ? '' : `${BigInt(value) / 100n}.${String(BigInt(value) % 100n).padStart(2, '0')}`; };
    const [amount, setAmount] = useState(existing(category));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save(remove = false) { if (busy)
        return; setBusy(true); try {
        await store.saveBudget(month, category, remove ? null : parseAmount(amount.trim()));
        await saved();
        close();
    }
    catch (e) {
        setError(userMessage(e));
    }
    finally {
        setBusy(false);
    } }
    return <Sheet title={`Presupuesto · ${month}`} close={close} busy={busy}><Choices label="Categoría de gasto" value={category} options={active.map(c => [c.id, c.name] as const)} onChange={id => { setCategory(id); setAmount(existing(id)); }}/><Field label="Límite mensual (USD)" value={amount} onChangeText={setAmount} decimal/><Body muted>Cero es un límite explícito. Quitar el límite deja la categoría sin presupuesto; no elimina sus gastos.</Body><ErrorNotice message={error}/>{!busy ? <><ActionButton title="Guardar presupuesto" onPress={() => void save()}/><ActionButton title="Quitar límite de esta categoría" secondary onPress={() => void save(true)}/></> : null}</Sheet>;
}
