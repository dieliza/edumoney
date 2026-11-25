import {announceSaved} from '../../ui/saveFeedback';
import {HomeVoiceEntry} from '../../ui/HomeVoiceEntry';
import {MoneyOverview} from '../../ui/MoneyOverview';
import {ActionMenu} from '../../ui/ActionMenu';
import { userMessage } from '../../core/errors';
import { useEffect, useMemo, useState, useRef } from 'react';
import { AppState, ActivityIndicator, Pressable, View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { refreshBills } from '../bills/runtime';
import { MonthlyCharts } from '../../ui/MonthlyCharts';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { ActionButton, Body, Card, Screen, SectionHeading, ui } from '../../ui/components';
import { localToday, formatMoney, monthlySummary, validMonth } from './domain';
import { getMoneyStore } from './localStore';
import type { MoneyStore } from './store';
import { type Category, type EntryKind, type LedgerMovement, type Snapshot } from './types';
import { Choices, ErrorNotice, Field, Sheet } from './fields';
import { MovementForm } from './MovementForm';
const empty: Snapshot = { movements: [], categories: [], budgets: [], schedules: [], commitments: [] };
export default function LedgerScreen({initialSection,initialMonth,initialMovementId,initialHistory}:{initialSection?:string;initialMonth?:string;initialMovementId?:string;initialHistory?:string}) {
    const { colors } = useTheme();
    const focused = useIsFocused();
    const [store, setStore] = useState<MoneyStore | null>(null);
    const [data, setData] = useState(empty);
    const [error, setError] = useState('');
    const [showMonth, setShowMonth] = useState(false);
    const [segment, setSegment] = useState(initialSection==='categories'?'categories':'summary');
    const [month, setMonth] = useState(validMonth(initialMonth??'')?initialMonth!:localToday().slice(0,7));
    const [form, setForm] = useState<{
        kind: EntryKind;
        initial?: LedgerMovement;
        history?:'expense'|'income'|'voice';
    } | null>(initialHistory&&!initialMovementId?{kind:initialHistory==='income'?'income':'expense',history:initialHistory==='income'?'income':'expense'}:null);
    const searchOpened=useRef('');
    useEffect(()=>{
        if(!focused||!store||!initialMovementId)return;
        const key=initialMovementId??initialHistory??'';
        if(!key||searchOpened.current===key)return;
        let active=true;
        void store.snapshot().then(raw=>{
            if(!active)return;
            searchOpened.current=key;
            const movement=raw.movements.find(m=>m.id===initialMovementId&&!m.deletedAt);
            if(movement&&(movement.kind==='income'||movement.kind==='expense'))setForm({initial:movement,kind:movement.kind,history:movement.kind});
            else setError('La transacción ya no está disponible para editar. Busca de nuevo para revisar su estado.');
        }).catch(()=>{if(active)setError('No pudimos abrir esta transacción. Intenta de nuevo.');});
        return()=>{active=false;};
    },[focused,store,initialMovementId,initialHistory]);
    const [category, setCategory] = useState<Category | null | undefined>();
    const [budget, setBudget] = useState(false);
    const [notice, setNotice] = useState('');
    useEffect(() => {
        if (!focused) return;
        let active = true;
        const load = async () => {
            const s = await getMoneyStore();
            await refreshBills();
            const snapshot = await s.snapshot(true);
            if (active) { setStore(s); setData(snapshot); }
        };
        const reload = () => { void load().catch(() => { if (active) setError('No pudimos cargar tus registros cifrados. Cierra y vuelve a abrir la app.'); }); };
        reload();
        const subscription = AppState.addEventListener('change', state => { if (state === 'active') reload(); });
        return () => { active = false; subscription.remove(); };
    }, [focused]);
    async function refresh() { if (store)
        setData(await store.snapshot(true)); }
    const { summary, summaryError } = useMemo(() => {
        try {
            return validMonth(month) ? { summary: monthlySummary(data, month), summaryError: '' } : { summary: null, summaryError: 'Escribe un mes válido en formato AAAA-MM.' };
        }
        catch {
            return { summary: null, summaryError: 'El total supera el rango monetario admitido. Revisa los importes registrados.' };
        }
    }, [data, month]);
    return <Screen chartMonth={validMonth(month)?month:undefined} dashboard={segment==='summary'} title={segment==='categories'?'Categorías y presupuestos':'Mi dinero'} demo={false}>
  <ErrorNotice message={error}/>{notice ? <Card row><Body>{notice}</Body></Card> : null}
  {!store ? <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando registros cifrados"/> : <>
   {segment!=='summary'?<Choices label="Sección de Mi dinero" value={segment} options={[["categories","Administrar"],["summary","Mi dinero"],["analysis","Gráficas y categorías"]]} onChange={v=>{if(v==='analysis')router.push({pathname:'/charts',params:{month}});else setSegment(v);}}/>:null}

   {segment !== 'summary' ? <ActionMenu label="Nueva transacción" actions={[{id:'income',label:'Añadir ingreso',run:()=>setForm({kind:'income'})},{id:'expense',label:'Registrar gasto',run:()=>setForm({kind:'expense'})},{id:'transfer',label:'Registrar transferencia propia',run:()=>setForm({kind:'transfer'})}]}/> : null}
   {segment !== 'summary' ? <SectionHeading title={month === localToday().slice(0, 7) ? 'Este mes' : month} action={showMonth ? 'Cerrar' : 'Cambiar mes'} onPress={() => setShowMonth(!showMonth)}/> : null}
   {segment !== 'summary' && showMonth ? <Field label="Mes (AAAA-MM)" value={month} onChangeText={setMonth}/> : null}
   <ErrorNotice message={summaryError}/>
   {segment === 'summary' && summary ? <>
    <MoneyOverview movements={data.movements} categories={data.categories} actions={focused?<HomeVoiceEntry onExpense={()=>setForm({kind:'expense'})} onScan={()=>router.push('/documents')} categories={data.categories} saved={async date=>{await refresh();if(date)setMonth(date.slice(0,7));}}/>:null} summary={summary} month={month} currentMonth={localToday().slice(0,7)} onPeriod={()=>setShowMonth(!showMonth)} periodEditor={showMonth?<Field label="Mes (AAAA-MM)" value={month} onChangeText={setMonth}/>:null} onBreakdown={()=>router.push({pathname:'/charts',params:{month,view:'breakdown'}})}/>
   </> : null}
   {segment === 'categories' ? <>
    <ActionButton title="Crear categoría" onPress={() => setCategory(null)}/>
    {summary ? <Distribution summary={summary} budget/> : null}
    <SectionHeading title="Tus categorías"/>
    {data.categories.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Editar categoría ${c.name}`} onPress={() => setCategory(c)}><Card row><Body>{c.name} · {c.kind === 'expense' ? 'Gasto' : 'Ingreso'}{c.archived ? ' · Archivada' : ''}</Body></Card></Pressable>)}
   </> : null}
   {form ? <MovementForm key={form.initial?`${form.initial.id}:${form.initial.version}`:`new:${form.history??''}`} initialHistory={form.history} onHistoryEdit={movement=>setForm({initial:movement,kind:movement.kind as EntryKind,history:movement.kind==='income'?'income':'expense'})} historySaved={refresh} allowedKinds={['transfer']} initial={form.initial} kind={form.kind} categories={data.categories} store={store} close={() => setForm(null)} afterSave={() => setForm(form.initial&&form.history?{kind:form.history==='income'?'income':'expense',history:form.history}:null)} saved={async () => { await refresh(); setNotice('Transacción guardada en este dispositivo.'); }}/> : null}
   {category !== undefined ? <CategoryForm initial={category} store={store} saved={refresh} close={() => setCategory(undefined)}/> : null}
   {budget ? <BudgetForm data={data} month={month} store={store} saved={refresh} close={() => setBudget(false)}/> : null}

  </>}
 </Screen>;
}
function Distribution({ summary, budget = false, onSelect, movements = [], month = localToday().slice(0,7) }: {
    summary: ReturnType<typeof monthlySummary>;
    movements?: LedgerMovement[];
    month?: string;
    budget?: boolean;
    onSelect?(id: string): void;
}) {
    const { colors } = useTheme();
    const items = summary.distribution.filter(c => budget ? c.budget !== null || c.spent > 0 : c.spent > 0);
    return <Card chart>{budget && !items.length ? <Body>{budget ? 'Define un presupuesto para comparar tus gastos.' : 'Aún no hay gastos registrados en este mes.'}</Body> : null}
  {!budget ? <MonthlyCharts summary={summary} movements={movements} month={month} onSelect={onSelect}/> : null}
  {budget ? items.map(item => {
            const pct = item.budget && item.budget > 0 ? Number(BigInt(item.spent) * 100n / BigInt(item.budget)) : 0;
            return <View key={item.id} style={{ gap: 8 }}><View style={ui.between}><Body style={{ flex: 1, fontWeight: '600' }}>{item.name}</Body><Body>{formatMoney(item.spent)}</Body></View>
   {budget ? <><Body muted>{item.budget === null ? 'Sin presupuesto definido' : `Presupuesto: ${formatMoney(item.budget)} · ${formatMoney(item.budget - item.spent)} restante`}</Body>{item.budget !== null ? <><View accessible accessibilityLabel={item.budget === 0 ? 'Presupuesto cero' : `${pct}% del presupuesto utilizado`} style={{ height: 10, borderRadius: 8, backgroundColor: colors.progressTrack, overflow: 'hidden' }}><View style={{ height: 10, width: `${Math.min(100, pct)}%`, backgroundColor: item.spent > item.budget ? fixed.expense : colors.primary }}/></View><Body muted>{item.budget === 0 ? (item.spent ? 'Hay gastos con presupuesto cero.' : 'Presupuesto cero, sin gastos.') : `${pct}% utilizado`}{item.spent > item.budget ? ' · Supera lo presupuestado' : ''}</Body></> : null}</> : <Body muted>{summary.expenses ? Number(BigInt(item.spent) * 10000n / BigInt(summary.expenses)) / 100 : 0}% del gasto mensual</Body>}
  </View>;
        }) : null}
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
        announceSaved();await saved();
        close();
    }
    catch (e) {
        setError(userMessage(e));
    }
    finally {
        setBusy(false);
    } }
    return <Sheet title={initial ? 'Editar categoría' : 'Crear categoría'} close={close} busy={busy}><Field label="Nombre de categoría" value={name} onChangeText={setName}/>{!initial ? <Choices<'income' | 'expense'> label="Clase de categoría" value={kind} options={[['expense', 'Gasto'], ['income', 'Ingreso']]} onChange={setKind}/> : null}<Body muted>Archivar conserva las transacciones y presupuestos anteriores; puedes reactivar la categoría.</Body><ErrorNotice message={error}/>{!busy ? <><ActionButton title="Guardar categoría" onPress={() => void save(initial?.archived ?? false)}/>{initial ? <ActionButton title={initial.archived ? 'Reactivar categoría' : 'Archivar categoría'} secondary onPress={() => void save(!initial.archived)}/> : null}</> : null}</Sheet>;
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
        announceSaved();await saved();
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
