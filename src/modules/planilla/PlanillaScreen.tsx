import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../design/ThemeProvider';
import { ActionButton, Body, Card, Screen, SectionHeading } from '../../ui/components';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { getMoneyStore } from '../money/localStore';
import { parseAmount } from '../../core/money';
import { userMessage } from '../../core/errors';
import { emptyClosure, evaluateClosure, questions, type Answer, type Closure } from './engine';
import { ClosureStore, type SavedClosure } from './store';
import { SOURCES, completionFields, fieldStateLabels } from './catalog';
import { decimal } from '../tax/domain';
import { generateClosurePDF, shareAnnualSummaryPDF, shareClosurePDF } from './services';
import type { TaxSnapshot } from '../tax/types';
import type { PerfilContributivo, RespuestaContributiva } from './annual-guided';
import { preguntasParaPerfiles } from './guided-questions';
import { deductionApprovalStamp, prepararExpedienteGuiado } from './annual-snapshot';
import {
  estimateWorkCredit, TAX_YEAR_RULES, WORK_CREDIT_ELIGIBILITY_KEYS, type WorkCreditInput, type WorkCreditResult,
} from './year-rules';
import { emptyForm482Intake, form482ActivityFlags, form482BusinessFields, form482OtherFields, form482PriorFields, type Draft482Field, type Form482Intake2025 } from './form482-intake-2025';
import { resolveForm4822025 } from './form482-resolve-2025';
import type { AnnualSummaryKind } from './annual-summary-pdf';

const PROFILE_OPTIONS: readonly (readonly [PerfilContributivo, string])[] = [
  ['asalariado', 'Empleado con salario'],
  ['contratista', 'Contratista independiente'],
  ['cuentapropista', 'Trabajo por cuenta propia'],
  ['comerciante', 'Comercio o ventas'],
];
const CLOSURE_OPTIONS = [['unknown', 'Pendiente de confirmar'], ['yes', 'Sí'], ['no', 'No']] as const;
const ANSWER_OPTIONS = [['unknown', 'Sin responder'], ['yes', 'Sí'], ['no', 'No']] as const;
const MARITAL_OPTIONS = [
  ['unknown', 'Sin responder'],
  ['soltero', 'Soltero(a)'],
  ['casado', 'Casado(a)'],
  ['otro', 'Otra situación'],
] as const;
const FORM_COVERAGE = [
  ['unknown', 'Sin confirmar'],
  ['salary', 'Solo sueldos'],
  ['services', 'Solo servicios'],
  ['retail', 'Solo venta de mercancía'],
  ['salary-services', 'Sueldos y servicios'],
  ['salary-retail', 'Sueldos y ventas de mercancía'],
  ['retail-services', 'Ventas y servicios, sin sueldos'],
  ['mixed', 'Sueldos, servicios y ventas de mercancía'],
] as const;
const NO_PROFILES: PerfilContributivo[] = [];
const NO_ANSWERS: RespuestaContributiva[] = [];
const HEAD = { fontWeight: '700' } as const;
const ACTIVITIES = [
  ['actividadManufactura', 'Manufactura'],
  ['actividadVentas', 'Venta de mercancía'],
  ['actividadAgricultura', 'Agricultura'],
  ['actividadServicios', 'Servicios'],
  ['actividadAlquiler', 'Alquiler'],
] as const;
const NUMERIC_FIELDS = ['dependientes', 'ventasNetas'] as const;
type NumericField = typeof NUMERIC_FIELDS[number];
const EMPTY_NUMBERS: Record<NumericField, string> = { dependientes: '', ventasNetas: '' };
const yearIsGuided = (year: number) => year >= 2000 && year <= 2100;
const missing = 'Pendiente de confirmar';
const dollars = (cents: number) => `USD ${decimal(cents)}`;

function numericAnswer(key: NumericField, raw: string): number | null | undefined {
  const text = raw.trim();
  if (!text) return null;
  if (key === 'dependientes') return /^\d{1,3}$/.test(text) ? Number(text) : undefined;
  try {
    const amount = parseAmount(text.replace(',', '.'));
    return amount >= 0 ? amount : undefined;
  } catch {
    return undefined;
  }
}

function replaceAnswer(answers: RespuestaContributiva[], key: string, value: RespuestaContributiva['valor']) {
  const rest = answers.filter(answer => answer.clave !== key);
  return value === null ? rest : [...rest, { clave: key, valor: value }];
}

function displayGuidedNumber(answers: RespuestaContributiva[], key: NumericField) {
  const value = answers.find(answer => answer.clave === key)?.valor;
  return typeof value === 'number' ? (key === 'ventasNetas' ? decimal(value) : String(value)) : '';
}

function makeFixture() {
  const fixture = emptyClosure(2025);
  for (const [id] of questions) fixture.answers[id] = 'yes';
  fixture.salaryCents = 2800000;
  fixture.withheldCents = 100000;
  fixture.sourceIds = ['COMPROBANTE-FICTICIO-2025'];
  fixture.notes = 'DATOS FICTICIOS: todos los componentes adicionales se declaran cero solo para este escenario; no usar para radicar.';
  fixture.components = Object.fromEntries(completionFields.map(f => [f.id, 0]));
  return fixture;
}

export default function PlanillaScreen() {
  const params = useLocalSearchParams<{ year?: string }>();
  const initialYear = params.year && /^\d{4}$/.test(params.year) && Number(params.year) >= 1900
    ? Number(params.year)
    : new Date().getFullYear();
  const [loadedYear, setLoadedYear] = useState<number>();
  const [year, setYear] = useState(initialYear);
  const [yearText, setYearText] = useState(String(year));
  const [store, setStore] = useState<ClosureStore>();
  const [saved, setSaved] = useState<SavedClosure | null>(null);
  const [source, setSource] = useState<TaxSnapshot>();
  const [c, setC] = useState<Closure>(emptyClosure(year));
  const [salary, setSalary] = useState('');
  const [withheld, setWithheld] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState(false);
  const [synthetic, setSynthetic] = useState(false);
  const [pdfStatus, setPdfStatus] = useState('');
  const [components, setComponents] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [guidedNumbers, setGuidedNumbers] = useState(EMPTY_NUMBERS);
  const [showDetails, setShowDetails] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [expensePage, setExpensePage] = useState(0);
  const [showDraft, setShowDraft] = useState(false);
  const [draftNumbers, setDraftNumbers] = useState<Partial<Record<Draft482Field, string>>>({});
  const [showCredit, setShowCredit] = useState(false);
  const [creditInput, setCreditInput] = useState<WorkCreditInput>();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void getMoneyStore().then(async ledger => {
      const nextStore = new ClosureStore(ledger);
      const [old, data] = await Promise.all([nextStore.get(year), nextStore.source(year)]);
      if (!active) return;
      const closure = old?.closure ?? emptyClosure(year);
      setStore(nextStore);
      setSaved(old);
      setSource(data);
      setC(closure);
      setDraftNumbers(Object.fromEntries(Object.entries(closure.draft482?.values ?? {}).map(([id, value]) => [id, id === 'priorOriginYear' ? String(value) : decimal(value)])));
      setComponents(Object.fromEntries(completionFields.map(f => {
        const n = closure.components?.[f.id];
        return [f.id, n == null ? '' : decimal(n)];
      })));
      setSalary(closure.salaryCents == null ? '' : decimal(closure.salaryCents));
      setWithheld(closure.withheldCents == null ? '' : decimal(closure.withheldCents));
      const answers = closure.guided?.respuestas ?? NO_ANSWERS;
      setGuidedNumbers({
        dependientes: displayGuidedNumber(answers, 'dependientes'),
        ventasNetas: displayGuidedNumber(answers, 'ventasNetas'),
      });
      setQuestionIndex(0);
      setLoadedYear(year);
    }).catch(e => { if (active) setError(userMessage(e)); });
    return () => { active = false; };
  }, [reload, year]);

  const ready = !!source && !!store && loadedYear === year && c.year === year;
  const stale = ready && !!saved && saved.fingerprint !== JSON.stringify(source);
  const profiles = c.guided?.perfiles ?? NO_PROFILES;
  const answers = c.guided?.respuestas ?? NO_ANSWERS;
  const guideQuestions = useMemo(() => profiles.length ? preguntasParaPerfiles(profiles) : [], [profiles]);
  const validGuided = useMemo(() => {
    let next = answers;
    const errors: Partial<Record<NumericField, string>> = {};
    for (const key of NUMERIC_FIELDS) {
      if (!guideQuestions.some(item => item.clave === key)) continue;
      const value = numericAnswer(key, guidedNumbers[key]);
      if (value === undefined) {
        errors[key] = key === 'dependientes' ? 'Usa un número entero entre 0 y 999.' : 'Usa un importe no negativo con hasta dos decimales.';
        next = replaceAnswer(next, key, null);
      } else {
        next = replaceAnswer(next, key, value);
      }
    }
    return { answers: next, errors };
  }, [answers, guideQuestions, guidedNumbers]);
  const question = guideQuestions[Math.min(questionIndex, guideQuestions.length - 1)];
  const answer = validGuided.answers.find(item => item.clave === question?.clave)?.valor;
  const summary = useMemo(() => {
    if (!ready || !source || !profiles.length || !yearIsGuided(year)) return { prep: null, error: '' };
    try { return { prep: prepararExpedienteGuiado(year, profiles, source, validGuided.answers), error: '' }; }
    catch { return { prep: null, error: 'No se pudo calcular el resumen de este año. Revisa los importes y vuelve a abrir el expediente.' }; }
  }, [profiles, ready, source, validGuided.answers, year]);
  const { prep } = summary;
  const hasBusiness = profiles.some(profile => profile !== 'asalariado' && profile !== 'mixto');
  const activitiesApply = hasBusiness || answers.some(item => item.clave === 'otrosIngresos' && item.valor === true);
  const reviewedExpenses = useMemo(() => {
    if (!ready || !source || !hasBusiness) return [];
    const reviewed = new Map(source.entries.filter(e =>
      e.year === year && e.movementId && e.classification === 'expense_review' &&
      (e.status === 'received' || e.status === 'corrected'),
    ).map(e => [e.movementId, e]));
    const ids = new Set<string>();
    return source.movements.flatMap(m => {
      if (ids.has(m.id) || m.kind !== 'expense' || m.deletedAt || !m.date.startsWith(`${year}-`) ||
        !Number.isSafeInteger(m.amountCents) || m.amountCents < 0) return [];
      const entry = reviewed.get(m.id);
      const valid = entry?.sourceVersion === m.version && (entry.useKind === 'business' ||
        (entry.useKind === 'mixed' && Number.isInteger(entry.businessBps) &&
          entry.businessBps !== null && entry.businessBps > 0 && entry.businessBps < 10000 && entry.notes.trim()));
      if (valid) ids.add(m.id);
      return valid && entry ? [{ ...m, approvalStamp: deductionApprovalStamp(m.version, entry.id, entry.version) }] : [];
    });
  }, [hasBusiness, ready, source, year]);

  function openYear() {
    if (busy) return;
    const next = Number(yearText);
    if (!/^\d{4}$/.test(yearText) || next < 1900) {
      setError('Escribe un año de cuatro dígitos.');
      return;
    }
    setError('');
    setReview(false);
    setSynthetic(false);
    setNotice('');
    setReason('');
    setShowDetails(false);
    setShowCalculation(false);
    setShowActivity(false);
    setShowExpenses(false);
    setExpensePage(0);
    setShowCredit(false);
    setCreditInput(undefined);
    setShowDraft(false);
    setLoadedYear(undefined);
    setYear(next);
    setReload(n => n + 1);
  }

  function toggleProfile(profile: PerfilContributivo) {
    if (busy) return;
    setError('');
    const next = profiles.includes(profile) ? profiles.filter(p => p !== profile) : [...profiles, profile];
    if (!next.length && (answers.length || Object.values(guidedNumbers).some(value => value.trim()))) {
      setError('Elige otro tipo de ingreso antes de quitar el último, para conservar tus respuestas.');
      return;
    }
    setQuestionIndex(0);
    setExpensePage(0);
    setC(prev => ({ ...prev, guided: next.length ? { perfiles: next, respuestas: answers } : undefined }));
  }

  function setGuideAnswer(key: string, value: RespuestaContributiva['valor']) {
    setC(prev => prev.guided
      ? { ...prev, guided: { ...prev.guided, respuestas: replaceAnswer(prev.guided.respuestas, key, value) } }
      : prev);
  }

  function setDeduction(id: string, version: string, answer: boolean | null) {
    setC(prev => {
      if (!prev.guided) return prev;
      const withChoice = replaceAnswer(prev.guided.respuestas, `deducible:${id}`, answer);
      return { ...prev, guided: { ...prev.guided, respuestas: replaceAnswer(withChoice, `deducible-version:${id}`, answer === null ? null : version) } };
    });
  }

  async function exportSummary(kind: AnnualSummaryKind) {
    if (!prep || summary.error || Object.keys(validGuided.errors).length || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await shareAnnualSummaryPDF(prep, kind);
      setNotice('Se preparó tu resumen en PDF. No es una planilla ni se envió a Hacienda.');
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const draft = c.draft482 ?? emptyForm482Intake();
  const draftActivities = form482ActivityFlags(draft.incomeCoverage);
  const draftBusinessFields = form482BusinessFields.filter(([key]) => key.startsWith('goods') ? draftActivities.k : draftActivities.m);
  const negativeBusinessResult = draftBusinessFields.some(([key]) =>
    (key === 'goodsGain' || key === 'serviceGain') && /^-/.test(draftNumbers[key]?.trim() ?? ''));
  const askLossConfirmation = negativeBusinessResult && draftActivities.k !== draftActivities.m;
  const askPrincipal = negativeBusinessResult && draftActivities.k && draftActivities.m;
  const askPrior = !negativeBusinessResult && draftActivities.k !== draftActivities.m;
  const shownPriorFields = askPrior && draft.priorLossScope ? form482PriorFields : [];
  function updateDraft(change: Partial<Form482Intake2025>) {
    setC(prev => ({ ...prev, draft482: { ...(prev.draft482 ?? emptyForm482Intake()), ...change } }));
  }

  async function save() {
    if (!store || !source || !ready || busy) return;
    const invalid = Object.keys(validGuided.errors)[0];
    if (invalid) {
      const index = guideQuestions.findIndex(item => item.clave === invalid);
      if (index >= 0) setQuestionIndex(index);
      setError('Revisa el formato de la respuesta numérica antes de guardar.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next: Closure = {
        ...c,
        draft482: year === 2025 && c.draft482 ? {
          ...c.draft482,
          singleActivityLossConfirmed: askLossConfirmation && c.draft482.singleActivityLossConfirmed === true,
          currentLossPrincipal: askPrincipal ? c.draft482.currentLossPrincipal : undefined,
          priorLossScope: askPrior ? c.draft482.priorLossScope : undefined,
          priorLossExpiry: askPrior && c.draft482.priorLossScope && c.draft482.priorLossPrincipal ? c.draft482.priorLossExpiry : undefined,
          priorLossPrincipal: askPrior && c.draft482.priorLossScope ? c.draft482.priorLossPrincipal : undefined,
          values: Object.fromEntries([...draftBusinessFields, ...form482OtherFields, ...shownPriorFields].flatMap<[Draft482Field, number]>(([key]) => {
            const raw = draftNumbers[key]?.trim();
            if (!raw) return [];
            if (key === 'priorOriginYear') return [[key,/^\d{4}$/.test(raw) ? Number(raw) : -1]];
            return [[key, parseAmount(raw.replace(',', '.'))]];
          })),
        } : undefined,
        guided: profiles.length ? { perfiles: profiles, respuestas: validGuided.answers } : undefined,
        components: Object.fromEntries(completionFields.map(f => [f.id, components[f.id]?.trim() ? parseAmount(components[f.id].trim()) : null])),
        salaryCents: salary.trim() ? parseAmount(salary.trim()) : null,
        withheldCents: withheld.trim() ? parseAmount(withheld.trim()) : null,
      };
      await store.save(next, JSON.stringify(source), saved?.version ?? 0, reason);
      setSaved(await store.get(year));
      setC(next);
      setNotice('Entrevista guardada en el expediente local. Revisa los datos que siguen pendientes.');
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function openReview() {
    setSynthetic(false);
    setReview(true);
  }

  function openFixture() {
    setSynthetic(true);
    setReview(true);
    setBusy(true);
    setPdfStatus('');
    void generateClosurePDF(makeFixture(), 'laboratory')
      .then(bytes => setPdfStatus(`PDF ficticio generado localmente: ${bytes.length} bytes.`))
      .catch(e => setError(userMessage(e)))
      .finally(() => setBusy(false));
  }

  const result = review ? evaluateClosure(synthetic ? makeFixture() : (saved?.closure ?? emptyClosure(year)), synthetic ? 'laboratory' : 'review') : null;

  const draftReview = review && !synthetic && saved && !stale ? resolveForm4822025(saved.closure) : null;

  return <Screen title="Preparar mi planilla" keyboardForm demo={false} subtitle="Organiza tu información contributiva paso a paso.">
    <ActionButton title="Volver a Para mi contable" secondary onPress={() => router.dismissTo('/tax')}/>
    <Card>
      <SectionHeading title="1. Elige el año" onSurface/>
      <Field label="Año contributivo" testID="closure-year" value={yearText} onChangeText={setYearText} maxLength={4}/>
      {!busy ? <ActionButton title="Abrir cierre del año" secondary onPress={openYear}/> : null}
      <Body>{year === 2025
        ? 'Año 2025: prepara el 482 con los datos que confirmes. Si falta algún importe, queda en blanco.'
        : `Año ${year}: prepara tu expediente. No se aplican las reglas ni las planillas de 2025.`}</Body>
      <Body muted>Esto es un borrador. EduMoney no radica tu planilla ni confirma tu elegibilidad para deducciones o créditos.</Body>
    </Card>
    <ErrorNotice message={error}/>
    {notice ? <Card><Body>{notice}</Body></Card> : null}
    {ready && source ? <>
      {stale ? <Card><Body>El expediente cambió desde que guardaste la entrevista. Comprueba las fuentes y las cantidades antes de reutilizarlas.</Body></Card> : null}
      {yearIsGuided(year) ? <>
        <Card>
          <SectionHeading title="2. ¿De dónde vinieron tus ingresos?" onSurface/>
          <Body>Elige todas las opciones que apliquen. Si tuviste más de un tipo de ingreso, verás las preguntas de cada uno sin repetirlas.</Body>
          {PROFILE_OPTIONS.map(([profile, title]) => <Choices
            key={profile}
            label={title}
            presentation="tabs"
            value={profiles.includes(profile) ? 'yes' : 'no'}
            options={[[ 'no', 'No incluir' ], [ 'yes', 'Incluir' ]]}
            onChange={value => { if ((value === 'yes') !== profiles.includes(profile)) toggleProfile(profile); }}
          />)}
          {profiles.includes('mixto') && !PROFILE_OPTIONS.some(([profile]) => profiles.includes(profile))
            ? <Body>Selecciona los tipos de ingreso que corresponden a tu perfil mixto.</Body>
            : null}
        </Card>
        {question ? <Card>
          <SectionHeading title="3. Responde una pregunta a la vez" onSurface/>
          <Body muted>Pregunta {questionIndex + 1} de {guideQuestions.length} · Puedes dejarla pendiente y volver después.</Body>
          {question.clave === 'dependientes' ? <>
            <Field
              label="¿Cuántos dependientes vas a reclamar?"
              testID="closure-guided-dependent-count"
              value={guidedNumbers.dependientes}
              onChangeText={text => setGuidedNumbers(prev => ({ ...prev, dependientes: text }))}
              maxLength={3}
            />
            <Body muted>Escribe 0 si confirmaste que no reclamarás ninguno. Deja el campo vacío si todavía no sabes.</Body>
            <ErrorNotice message={validGuided.errors.dependientes ?? ''}/>
          </> : question.clave === 'ventasNetas' ? <>
            <Field
              label="¿Cuánto vendiste después de devoluciones, sin incluir IVU? (USD)"
              testID="closure-guided-sales"
              value={guidedNumbers.ventasNetas}
              onChangeText={text => setGuidedNumbers(prev => ({ ...prev, ventasNetas: text }))}
              maxLength={17}
              decimal
            />
            <Body muted>Es una respuesta para revisar. No se suma otra vez al total de tus movimientos.</Body>
            <ErrorNotice message={validGuided.errors.ventasNetas ?? ''}/>
          </> : question.clave === 'estadoCivil' ? <>
            <Choices
              label={question.titulo}
              value={answer === 'soltero' || answer === 'casado' || answer === 'otro' ? answer : 'unknown'}
              options={MARITAL_OPTIONS}
              onChange={value => setGuideAnswer(question.clave, value === 'unknown' ? null : value)}
            />
            <Body muted>{question.ayuda}</Body>
          </> : <>
            <Choices
              label={question.clave === 'gastosDeducibles' ? '¿Ya revisaste qué gastos realmente corresponden a tu trabajo o negocio?' : question.titulo}
              value={answer === true ? 'yes' : answer === false ? 'no' : 'unknown'}
              options={ANSWER_OPTIONS}
              presentation="tabs"
              onChange={value => setGuideAnswer(question.clave, value === 'unknown' ? null : value === 'yes')}
            />
            <Body muted>{question.clave === 'residencia' ? 'Si te mudaste, apunta las fechas en Notas para revisarlas.' : question.ayuda}</Body>
            {question.documento ? <Body>Documento para buscar: {question.documento}.</Body> : null}
          </>}
          {questionIndex + 1 < guideQuestions.length
            ? <ActionButton title="Siguiente pregunta" testID="closure-guided-next" onPress={() => setQuestionIndex(i => Math.min(i + 1, guideQuestions.length - 1))}/>
            : <Body>Fin de las preguntas de tu perfil. Revisa el resumen y guarda la entrevista.</Body>}
          {questionIndex > 0 ? <ActionButton title="Pregunta anterior" testID="closure-guided-prev" secondary onPress={() => setQuestionIndex(i => Math.max(0, i - 1))}/> : null}
        </Card> : null}
        {activitiesApply ? <Card>
          <ActionButton title={showActivity ? 'Ocultar tipos de actividad' : 'Indicar tipos de actividad'} secondary
            testID="closure-activities" onPress={() => setShowActivity(value => !value)}/>
          {showActivity ? <>
            <Body>Esto ayuda a identificar anejos que podrías necesitar. No los prepara ni determina que apliquen.</Body>
            {ACTIVITIES.map(([key, title]) => {
              const value = answers.find(item => item.clave === key)?.valor;
              return <Choices key={key} label={title} value={value === true ? 'yes' : value === false ? 'no' : 'unknown'}
                options={ANSWER_OPTIONS} presentation="tabs"
                onChange={answer => setGuideAnswer(key, answer === 'unknown' ? null : answer === 'yes')}/>;
            })}
          </> : null}
        </Card> : null}
        {hasBusiness ? <Card>
          <ActionButton title={showExpenses ? 'Ocultar gastos revisados' : 'Revisar gastos del trabajo o negocio'} secondary
            testID="closure-deductions" onPress={() => setShowExpenses(value => !value)}/>
          {showExpenses ? <>
            <Body>Solo se muestran gastos del expediente ya revisados como comerciales o de uso mixto con una proporción anotada. Marcarlos no confirma su elegibilidad contributiva.</Body>
            {!reviewedExpenses.length ? <Body>No hay gastos compatibles revisados. Compruébalos primero en Para mi contable.</Body> : null}
            {reviewedExpenses.slice(expensePage * 8, expensePage * 8 + 8).map(m => {
              const choice = answers.find(item => item.clave === `deducible-version:${m.id}`)?.valor === m.approvalStamp
                ? answers.find(item => item.clave === `deducible:${m.id}`)?.valor
                : null;
              return <Choices key={m.id} label={`${m.description} · ${m.date} · ${dollars(m.amountCents)}`}
                value={choice === true ? 'yes' : choice === false ? 'no' : 'unknown'}
                options={[[ 'unknown', 'Pendiente' ], [ 'yes', 'Considerar para deducción' ], [ 'no', 'No incluir' ]]}
                onChange={value => setDeduction(m.id, m.approvalStamp, value === 'unknown' ? null : value === 'yes')}/>;
            })}
            {expensePage > 0 ? <ActionButton title="Gastos anteriores" secondary onPress={() => setExpensePage(page => page - 1)}/> : null}
            {(expensePage + 1) * 8 < reviewedExpenses.length ? <ActionButton title="Más gastos revisados" secondary onPress={() => setExpensePage(page => page + 1)}/> : null}
          </> : null}
        </Card> : null}
        <ErrorNotice message={summary.error}/>
        {prep ? <Card>
          <SectionHeading title="4. Resumen preliminar del año" onSurface/>
          <Body>Solo registros de EduMoney para {year}. No incluye automáticamente todos tus ingresos ni vuelve a sumar comprobantes que documenten el mismo ingreso.</Body>
          <Body>Ingresos brutos registrados: {prep.ingresosSinBruto && !prep.totales.ingresosCentavos
            ? missing : prep.movimientosConsiderados ? dollars(prep.totales.ingresosCentavos) : 'Sin importes registrados'}{prep.ingresosSinBruto ? ' (hay ingresos sin bruto confirmado)' : ''}.</Body>
          <Body>Gastos registrados: {prep.movimientosConsiderados ? dollars(prep.totales.gastosCentavos) : 'Sin importes registrados'}.</Body>
          <Body>Gastos revisados que marcaste para deducción: {prep.deduciblesConfirmadosCentavos > 0 ? dollars(prep.deduciblesConfirmadosCentavos) : 'Sin importes confirmados'}.</Body>
          <Body>Retenciones anotadas en los movimientos: {prep.totales.retencionesCentavos > 0 ? dollars(prep.totales.retencionesCentavos) : 'Sin importes confirmados'}.</Body>
          {prep.retencionesSinConfirmar > 0 ? <Body>Retenciones aún por comprobar: {prep.retencionesSinConfirmar}.</Body> : null}
          <Body>Ingreso neto preliminar: {prep.netoPreliminarCentavos === null ? missing : dollars(prep.netoPreliminarCentavos)}. No es el saldo de tu planilla.</Body>
          <Body>{prep.preguntasPendientes.length ? `${prep.preguntasPendientes.length} pregunta(s) aún sin contestar.` : 'Todas las preguntas visibles tienen respuesta. Los importes y los documentos todavía requieren revisión.'}</Body>
          <ActionButton title={showDetails ? 'Ocultar pendientes y anejos' : 'Ver pendientes y anejos'} secondary testID="closure-guided-details" onPress={() => setShowDetails(value => !value)}/>
          {showDetails ? <>
            {guideQuestions.filter(p => prep.preguntasPendientes.includes(p.clave)).map(p => <Body key={p.clave}>Por responder: {p.titulo}</Body>)}
            {prep.anejos.map(anejo => <Body key={anejo.id}>{anejo.id}: {anejo.estado === 'considerar' ? 'Para revisar' : 'Pendiente'} · {anejo.motivo}</Body>)}
            {prep.advertencias.map((warning, index) => <Body key={index}>{warning}</Body>)}
          </> : null}
          {!busy && !Object.keys(validGuided.errors).length ? <>
            <ActionButton title="PDF: resumen anual" testID="closure-annual-pdf" secondary onPress={() => void exportSummary('annual')}/>
            <ActionButton title="PDF: resumen de retenciones y créditos" testID="closure-withholding-pdf" secondary onPress={() => void exportSummary('withholding')}/>
          </> : null}
        </Card> : null}
      </> : null}
      {year === 2025 || year === 2026 ? <Card>
        <SectionHeading title="Crédito por Trabajo (Anejo CT)" onSurface/>
        {year === 2025 ? <>
          <Body>Estimación separada del resumen anual. Usa las cantidades que verificaste en el Anejo CT; EduMoney no las toma de tus ingresos brutos.</Body>
          <ActionButton title={showCredit ? 'Cerrar estimador' : 'Abrir estimador 2025'} secondary testID="closure-work-credit-toggle"
            onPress={() => setShowCredit(value => !value)}/>
          {showCredit ? <WorkCreditEstimate initial={creditInput} onReviewed={setCreditInput}/> : null}
        </> : <>
          <Body>No hay cálculo ni PDF oficial de 2026 disponible aquí. EduMoney no aplica las reglas de 2025 a ese año.</Body>
          <OfficialLink href={TAX_YEAR_RULES[2026].informationReturns.source}>Hacienda: comprobantes e informativas 2026</OfficialLink>
        </>}
      </Card> : null}
      <Card>
        <SectionHeading title="Cálculo salarial y comprobantes" onSurface/>
        <Body>Esta sección separa los datos comprobados del resumen anual. No usa los depósitos bancarios como salarios ni supone que los campos vacíos valen cero.</Body>
        <ActionButton title={showCalculation ? 'Ocultar campos del cálculo salarial' : 'Ver campos del cálculo salarial'} secondary testID="closure-calculation-toggle" onPress={() => setShowCalculation(value => !value)}/>
        {showCalculation ? <>
          <Body>Selecciona referencias del expediente y transcribe los encasillados 11 y 13 del 499R-2/W-2PR.</Body>
          {source.statements.map(a => <ActionButton key={a.id} secondary
            title={`${c.sourceIds.includes(a.id) ? 'Retirar referencia' : 'Seleccionar referencia'}: ${a.formType} · ${a.payer}`}
            onPress={() => setC(prev => ({ ...prev, sourceIds: prev.sourceIds.includes(a.id) ? prev.sourceIds.filter(id => id !== a.id) : [...prev.sourceIds, a.id] }))}
          />)}
          {!source.statements.length ? <Body>No hay informativas en el expediente de este año; los comprobantes quedan pendientes.</Body> : null}
          <Field label="Salarios verificados, encasillado 11 (USD)" testID="closure-salary" value={salary} onChangeText={value => {setSalary(value); if(c.draft482)updateDraft({standardMethodConfirmed:false});}} decimal/>
          <Field label="Retención verificada, encasillado 13 (USD)" testID="closure-withheld" value={withheld} onChangeText={value => {setWithheld(value); if(c.draft482)updateDraft({standardMethodConfirmed:false});}} decimal/>
          {questions.map(([id, label]) => <Choices key={id} label={label} value={c.answers[id]} options={CLOSURE_OPTIONS}
            onChange={(value: Answer) => setC(prev => ({ ...prev, answers: { ...prev.answers, [id]: value } }))}
          />)}
          <Body style={HEAD}>Componentes para calcular el saldo</Body>
          <Body>Introduce los importes de los anejos aplicables o cero confirmado. No es un requisito contratar a un CPA; registrar un importe tampoco confirma que cualifica.</Body>
          {completionFields.map(f => <Field key={f.id} calculationRequired label={`Línea ${f.id}: ${f.label} (USD)`}
            testID={`closure-component-${f.id}`} value={components[f.id] ?? ''}
            onChangeText={value => {setComponents(prev => ({ ...prev, [f.id]: value })); if(c.draft482)updateDraft({standardMethodConfirmed:false});}} decimal
          />)}
          <Field label="Nombre de quien revisa (opcional)" testID="closure-reviewer" value={c.review?.name ?? ''}
            onChangeText={name => setC(prev => ({ ...prev, review: { name, confirmed: prev.review?.confirmed ?? false, notes: prev.review?.notes ?? '' } }))}
            maxLength={150}
          />
          <Choices label="Revisión registrada por el usuario" value={c.review?.confirmed ? 'yes' : 'no'}
            options={[[ 'no', 'Todavía estoy revisando' ], [ 'yes', 'Revisado por mí' ]]}
            onChange={value => setC(prev => ({ ...prev, review: { name: prev.review?.name ?? '', confirmed: value === 'yes', notes: prev.review?.notes ?? '' } }))}
          />
          <Body muted>Registrar la revisión no es un requisito para ejecutar el cálculo.</Body>
        </> : null}
      </Card>
      {year === 2025 ? <Card>
        <SectionHeading title="Datos verificados del Formulario 482" onSurface/>
        <Body>Usa los importes de tus comprobantes y anejos. Deja vacío si aún no lo sabes; escribe 0 si verificaste que no aplica.</Body>
        <ActionButton title={showDraft ? 'Ocultar datos para el 482' : 'Completar datos para el 482'} secondary
          testID="closure-482-toggle" onPress={() => setShowDraft(value => !value)}/>
        {showDraft ? <>
          <Field label="Nombre (opcional)" value={draft.givenName}
            onChangeText={givenName => updateDraft({givenName})} maxLength={60}/>
          <Field label="Inicial (opcional)" value={draft.middleInitial ?? ''}
            onChangeText={middleInitial => updateDraft({middleInitial})} maxLength={1}/>
          <Field label="Apellido materno (opcional)" value={draft.maternalSurname ?? ''}
            onChangeText={maternalSurname => updateDraft({maternalSurname})} maxLength={60}/>
          <Field label="Apellido paterno (opcional)" value={draft.paternalSurname}
            onChangeText={paternalSurname => updateDraft({paternalSurname})} maxLength={60}/>
          <Body muted>No escribas tu Seguro Social ni tus datos bancarios aquí.</Body>
          <Choices label="¿Viviste todo el año en Puerto Rico y rindes como contribuyente individual?"
            value={draft.individualResident ? 'yes' : 'no'} options={[[ 'no', 'No o no lo sé' ], [ 'yes', 'Sí' ]]}
            onChange={value => updateDraft({individualResident: value === 'yes', standardMethodConfirmed: false})}/>
          <Choices label="¿De dónde vinieron tus ingresos?" value={draft.incomeCoverage ?? 'unknown'} options={FORM_COVERAGE}
            onChange={value => updateDraft({incomeCoverage: value === 'unknown' ? null : value, standardMethodConfirmed: false, singleActivityLossConfirmed: false, currentLossPrincipal:undefined, priorLossScope:undefined, priorLossPrincipal:undefined})}/>
          {[...draftBusinessFields, ...form482OtherFields].filter(([key]) => key !== 'grossFor17' || draft.incomeCoverage !== 'salary').map(([key, label]) =>
            <Field key={key} label={`${label} (USD, dólares enteros)`} value={draftNumbers[key] ?? ''}
              onChangeText={value => {setDraftNumbers(prev => ({...prev,[key]:value})); updateDraft({standardMethodConfirmed:false, singleActivityLossConfirmed:false, currentLossPrincipal:undefined, priorLossScope:draft.priorLossScope ? 'review' : undefined});}} decimal={!key.endsWith('Gain')}/>)}
          {askLossConfirmation ? <>
            <Body>Escribe la pérdida verificada con un signo menos. No se toma de los gastos del resumen anual.</Body>
            <Choices label="¿La pérdida fue de tu única actividad y no incluye pérdidas de años anteriores ni requiere ajuste de contribución básica alterna?"
              value={draft.singleActivityLossConfirmed ? 'yes' : 'no'} options={[[ 'no', 'Por revisar' ], [ 'yes', 'Lo confirmé' ]]}
              onChange={value => updateDraft({singleActivityLossConfirmed:value === 'yes', standardMethodConfirmed:false})}/>
          </> : null}
          {askPrincipal ? <>
            <Body>Este cálculo cubre una actividad de ventas y una de servicios, sin arrastres, tasas especiales ni ajuste por contribución básica alterna.</Body>
            <Choices label="Si verificaste que solo hubo esas dos actividades y que cumplen esas condiciones, ¿cuál era la principal?"
              value={draft.currentLossPrincipal ?? 'unknown'} options={[[ 'unknown', 'Por revisar' ], [ 'K', 'Venta de mercancía' ], [ 'M', 'Servicios' ]]}
              onChange={value=>updateDraft({currentLossPrincipal:value==='unknown' ? undefined : value, standardMethodConfirmed:false})}/>
          </> : null}
          {askPrior ? <>
            <Choices label="¿Vas a usar una pérdida de 2021 a 2024 de esta misma actividad?"
              value={draft.priorLossScope ? 'yes' : 'no'} options={[[ 'no', 'No añadir arrastre' ], [ 'yes', 'Añadir pérdida anterior' ]]}
              onChange={value=>updateDraft({priorLossScope:value==='yes' ? 'review' : undefined, priorLossPrincipal:undefined, standardMethodConfirmed:false})}/>
            {draft.priorLossScope ? <>
              <Body>Solo para un año de origen y la misma actividad activa. Indica el importe ya revisado en tu anejo; no uses el total de gastos de EduMoney.</Body>
              {shownPriorFields.map(([key,label])=><Field key={key} label={label} value={draftNumbers[key] ?? ''}
                onChangeText={value=>{setDraftNumbers(prev=>({...prev,[key]:value})); updateDraft({priorLossScope:'review',standardMethodConfirmed:false});}}
                maxLength={key==='priorOriginYear' ? 4 : 17} decimal={key!=='priorOriginYear'}/>)}
              <Choices label="¿Era esta actividad tu negocio principal?"
                value={draft.priorLossPrincipal===undefined ? 'unknown' : draft.priorLossPrincipal ? 'yes' : 'no'}
                options={[[ 'unknown','Por revisar' ],[ 'yes','Sí' ],[ 'no','No' ]]}
                onChange={value=>updateDraft({priorLossPrincipal:value==='unknown' ? undefined : value==='yes',priorLossScope:'review',standardMethodConfirmed:false})}/>
              {draft.priorLossPrincipal===true ? <Field label="Vencimiento confirmado (AAAA-MM-DD)" value={draft.priorLossExpiry ?? ''}
                maxLength={10} onChangeText={priorLossExpiry=>updateDraft({priorLossExpiry,priorLossScope:'review',standardMethodConfirmed:false})}/> : null}
              <Choices label="¿Confirmaste que la pérdida sigue vigente, tiene ajuste cero y no hay otras pérdidas, cambios de actividad ni ajuste de contribución básica alterna?"
                value={draft.priorLossScope==='confirmed' ? 'yes' : 'no'}
                options={[[ 'no','Por revisar' ],[ 'yes','Lo confirmé' ]]}
                onChange={value=>updateDraft({priorLossScope:value==='yes'?'confirmed':'review',standardMethodConfirmed:false})}/>
            </> : null}
          </> : null}
          <Choices label="¿Verificaste todos los ingresos y que aplica la tabla regular, sin tasas especiales ni pensión pagada por divorcio?"
            value={draft.standardMethodConfirmed ? 'yes' : 'no'} options={[[ 'no', 'Todavía no' ], [ 'yes', 'Sí, lo verifiqué' ]]}
            onChange={value => updateDraft({standardMethodConfirmed: value === 'yes'})}/>
          <Body muted>En «Cálculo salarial y comprobantes» puedes confirmar la retención, el Crédito por Trabajo, otros pagos y el resto de los componentes del saldo. Si no hubo sueldos en un caso mixto, confirma cero solo si lo verificaste.</Body>
          <OfficialLink href={TAX_YEAR_RULES[2025].form482.instructions}>Hacienda: instrucciones y encasillados del 482</OfficialLink>
        </> : null}
      </Card> : null}
      <Card>
        <SectionHeading title="Guardar tu entrevista" onSurface/>
        <Field testID="closure-notes" label="Notas y situaciones para revisar" value={c.notes}
          onChangeText={notes => setC(prev => ({ ...prev, notes }))} multiline maxLength={2000}
        />
        <Body muted>No escribas tu Seguro Social, contraseñas ni detalles bancarios en estas notas.</Body>
        <Field label="Motivo del cierre o corrección" testID="closure-reason" value={reason} onChangeText={setReason}/>
        {!busy ? <ActionButton title="Guardar entrevista de cierre" testID="closure-save" onPress={() => void save()}/> : <Body>Guardando…</Body>}
      </Card>
      <ActionButton title="Revisar campos guardados y pendientes" testID="closure-review" secondary onPress={openReview}/>
      {saved ? <ActionButton title="Compartir PDF del expediente de cierre" secondary onPress={openReview}/> : null}
    </> : <Card><Body>{error ? 'No se pudo abrir el expediente de este año. Usa «Abrir cierre del año» para volver a intentar.' : 'Abriendo expediente cifrado…'}</Body></Card>}
    {process.env.EXPO_PUBLIC_PLANILLA_TESTS === '1'
      ? <ActionButton title="Ver caso ficticio de validación 2025" testID="closure-fixture" secondary onPress={openFixture}/>
      : null}
    <Card>
      <ActionButton title={showSources ? 'Ocultar fuentes de consulta' : 'Ver fuentes de consulta'} secondary onPress={() => setShowSources(value => !value)}/>
      {showSources ? <>
        <Body>Fuentes de referencia del catálogo de 2025 (consultadas el 9 de noviembre de 2026):</Body>
        <OfficialLink href={SOURCES.form.url}>Hacienda: Formulario 482 informativo de 2025</OfficialLink>
        <OfficialLink href={TAX_YEAR_RULES[2025].form482.instructions}>Hacienda: instrucciones del Formulario 482 de 2025</OfficialLink>
        <OfficialLink href={SOURCES.filing.url}>Hacienda: circular sobre la radicación de 2025</OfficialLink>
        <OfficialLink href={SOURCES.repository.url}>Hacienda: repositorio de planillas y anejos</OfficialLink>
      </> : null}
    </Card>
    {result ? <Sheet title={synthetic ? 'LABORATORIO — DATOS FICTICIOS' : 'Borrador de EduMoney — no radicado'} close={() => setReview(false)} busy={busy}>
      {draftReview ? <>
        <Body>Año 2025. {draftReview.balance === null ? 'Saldo pendiente: faltan datos para completar la planilla.' :
          `Saldo del borrador: ${draftReview.balance.type === 'payment' ? 'pendiente de pago' :
            draftReview.balance.type === 'overpayment' ? 'sobrepago' : 'cero'} · USD ${draftReview.balance.dollars}.`}</Body>
        {draftReview.issues.map(issue => <Body key={issue}>{issue}</Body>)}
        {draftReview.pending.length ? <Body>Revisa: {draftReview.pending.map(item =>
          item.line === 'scope' ? 'tipo de contribuyente' : item.line === 'grossFor17' ? 'ingreso bruto de la línea 17' : `línea ${item.line}`).join(', ')}.</Body> : null}
        {draftReview.truncatedLines.length ? <Body>El borrador omite fracciones de dólar en las líneas {draftReview.truncatedLines.join(', ')}. No se ha confirmado que SURI calcule igual.</Body> : null}
      </> : <>
      <Body>Año {result.year}. {result.finalAmountCents === null
        ? 'Saldo no determinado. Revisa los datos pendientes y el alcance del cálculo.'
        : `Saldo calculado: ${result.balanceType === 'refund' ? 'sobrepago' : result.balanceType === 'payment' ? 'pendiente de pago' : 'cero'} · ${dollars(Math.abs(result.finalAmountCents))}. Basado en los componentes declarados.`}</Body>
      {pdfStatus && synthetic ? <Body>{pdfStatus}</Body> : null}
      {result.fields.map(f => <Body key={f.id}>Línea {f.id} · {f.label}: {fieldStateLabels[f.state]} · {f.state === 'not_applicable' ? 'No aplica' : f.valueCents === null ? missing : decimal(f.valueCents)}</Body>)}
      {[...result.missing, ...result.excluded, ...result.validationPending].map((text, i) => <Body key={i}>{text}</Body>)}
      </>}
      {!synthetic ? <ErrorNotice message={error}/> : null}
      {stale && !synthetic ? <Body>Tu expediente cambió. Revisa y guarda la entrevista antes de descargar el borrador.</Body> : null}
      {!synthetic && saved && !stale && !busy ? <ActionButton title={year === 2025 ? 'Descargar borrador PDF del 482' : 'Compartir resumen de revisión'} testID="closure-pdf-share" onPress={() => {
        setBusy(true);
        setError('');
        void shareClosurePDF(saved.closure, creditInput)
          .then(() => {setNotice('Se preparó el PDF del expediente. EduMoney no lo envió a Hacienda.'); setReview(false);})
          .catch(e => setError(userMessage(e)))
          .finally(() => setBusy(false));
      }}/> : null}
    </Sheet> : null}
  </Screen>;
}

function OfficialLink({ href, children }: { href: `https://${string}`; children: string }) {
  const { colors } = useTheme();
  return <Link href={href} target="_blank" rel="noopener noreferrer"
    style={{ color: colors.primary, fontSize: 16, lineHeight: 26, textDecorationLine: 'underline' }}>
    {children}
  </Link>;
}

const CREDIT_FILING = [
  ['uncertain', 'Pendiente de confirmar'],
  ['individual', 'Individual'],
  ['joint', 'Casados que rinden juntos'],
  ['married-separate', 'Casados que rinden por separado'],
  ['surviving-spouse-with-optional-computation', 'Cónyuge supérstite con cómputo opcional'],
] as const;
const CREDIT_ELIGIBILITY_LABELS: Record<typeof WORK_CREDIT_ELIGIBILITY_KEYS[number], string> = {
  prResidencyAllYearAndAtFiling: 'Residencia en Puerto Rico durante el año y al radicar',
  validIdentificationByDueDate: 'Identificación válida a la fecha límite (no escribas aquí el número)',
  earnedIncomeRequirementMet: 'Ingreso ganado que cumple los requisitos del Anejo CT',
  taxpayerAndApplicableSpouseAge19Plus: 'Edad requerida del contribuyente y cónyuge cuando aplique',
  taxpayerAndApplicableSpouseNotClaimedAsDependents: 'Ninguno figura como dependiente de otra persona cuando aplique',
  doesNotClaimIncompatibleCredits: 'Sin créditos incompatibles',
  timelyFilingIncludingExtension: 'Radicación dentro del término, incluida prórroga cuando aplique',
  taxpayerAliveAtFiling: 'Condición de contribuyente vivo al radicar',
  specialCasesReviewed: 'Situaciones especiales revisadas según corresponda',
};

function creditResultText(r: WorkCreditResult) {
  if (r.status === 'estimated') return `Estimación informativa para 2025: ${dollars(r.creditCents)}. No se copia al saldo ni confirma elegibilidad o radicación.`;
  if (r.reason === 'other-income-exact-limit-review') return 'La cantidad exacta de USD 10,000 en otros ingresos requiere revisar el límite con Hacienda. No se calculó un crédito.';
  if (r.condition) {
    return `${r.status === 'blocked' ? 'Falta confirmar' : 'La respuesta no cumple esta condición'}: ${CREDIT_ELIGIBILITY_LABELS[r.condition]}. No se calculó un crédito.`;
  }
  if (r.reason === 'married-separate') return 'Casados que rinden por separado no están cubiertos por esta estimación. Revisa las instrucciones oficiales.';
  if (r.status === 'ineligible') return 'Las cantidades verificadas no cumplen el rango de ingresos indicado en el Anejo CT de 2025. No se calculó un crédito.';
  return 'Falta confirmar el estado para radicar, los importes o los dependientes cualificados. No se calculó un crédito.';
}

function WorkCreditEstimate({ initial, onReviewed }: {initial?:WorkCreditInput; onReviewed:(input?:WorkCreditInput)=>void}) {
  const [filingStatus, setFilingStatus] = useState<WorkCreditInput['filingStatus']>(initial?.filingStatus ?? 'uncertain');
  const [eligibility, setEligibility] = useState<WorkCreditInput['eligibility']>(initial?.eligibility ?? {});
  const [earned, setEarned] = useState(initial ? decimal(initial.earnedIncome.cents) : '');
  const [otherIncome, setOtherIncome] = useState(initial ? decimal(initial.otherIncome.cents) : '');
  const [dependents, setDependents] = useState(initial?.qualifiedDependents.count?.toString() ?? '');
  const [assessed, setAssessed] = useState(false);
  const [verified, setVerified] = useState(!!initial);
  const [error, setError] = useState('');
  const [result, setResult] = useState<WorkCreditResult | undefined>(() => initial ? estimateWorkCredit(initial) : undefined);
  function clearResult() {
    setResult(undefined);
    onReviewed(undefined);
  }
  function changeAmount(update: (next: string) => void, value: string) {
    update(value);
    setVerified(false);
    clearResult();
    setError('');
  }
  function run() {
    const earnedCents = numericAnswer('ventasNetas', earned);
    const otherCents = numericAnswer('ventasNetas', otherIncome);
    const count = numericAnswer('dependientes', dependents);
    if (earnedCents === undefined || otherCents === undefined || count === undefined) {
      setError('Revisa los importes no negativos y el número entero de dependientes.');
      clearResult();
      return;
    }
    setError('');
    const input:WorkCreditInput = {
      taxYear: 2025, filingStatus, eligibility,
      earnedIncome: { cents: earnedCents, verified },
      otherIncome: { cents: otherCents, verified },
      qualifiedDependents: { count, verified },
    };
    const estimate = estimateWorkCredit(input);
    setResult(estimate);
    onReviewed(estimate.status === 'estimated' ? input : undefined);
  }
  return <>
    <OfficialLink href={TAX_YEAR_RULES[2025].workCredit.sources[0]}>Hacienda: Anejo CT 2025 en español</OfficialLink>
    <OfficialLink href={TAX_YEAR_RULES[2025].workCredit.sources[2]}>Hacienda: importes y límites de 2025</OfficialLink>
    <Body muted>No escribas identificación personal. El estimador no guarda los datos. Si descargas el borrador en esta sesión, adjunta los totales verificados en el Anejo CT sin cambiar tu 482.</Body>
    <Choices label="¿Cómo presentarías tu planilla?" value={filingStatus} options={CREDIT_FILING}
      onChange={value => { setFilingStatus(value); clearResult(); }}/>
    <Field label="Ingreso ganado verificado, Anejo CT línea 1D (USD)" testID="closure-ct-earned" value={earned}
      onChangeText={value => changeAmount(setEarned, value)} decimal maxLength={17}/>
    <Field label="Otros ingresos verificados, Anejo CT línea 2D (USD)" testID="closure-ct-other" value={otherIncome}
      onChangeText={value => changeAmount(setOtherIncome, value)} decimal maxLength={17}/>
    <Field label="Dependientes cualificados para el Anejo CT" testID="closure-ct-dependents" value={dependents}
      onChangeText={value => changeAmount(setDependents, value)} maxLength={3}/>
    <Body muted>Escribe cero solo si lo verificaste. Para trabajo por cuenta propia, revisa las reglas especiales del anejo antes de confirmar el ingreso ganado.</Body>
    <Choices label="¿Verificaste ambos importes y los dependientes con las instrucciones y comprobantes?"
      value={verified ? 'yes' : 'unknown'} options={[[ 'unknown', 'Pendiente' ], [ 'yes', 'Verifiqué los tres datos' ]]}
      presentation="tabs" onChange={value => { setVerified(value === 'yes'); clearResult(); }}/>
    <ActionButton title={assessed ? 'Ocultar requisitos' : 'Revisar requisitos antes de estimar'} secondary
      testID="closure-ct-requirements" onPress={() => setAssessed(value => !value)}/>
    {assessed ? WORK_CREDIT_ELIGIBILITY_KEYS.map(key => <Choices key={key} label={CREDIT_ELIGIBILITY_LABELS[key]}
      value={eligibility[key] === true ? 'yes' : eligibility[key] === false ? 'no' : 'unknown'}
      options={CLOSURE_OPTIONS} presentation="tabs"
      onChange={choice => {
        setEligibility(prev => ({ ...prev, [key]: choice === 'unknown' ? null : choice === 'yes' }));
        clearResult();
      }}/>) : null}
    <ActionButton title="Estimar Crédito por Trabajo 2025" testID="closure-ct-estimate" onPress={run}/>
    <ErrorNotice message={error}/>
    {result ? <Body>{creditResultText(result)}</Body> : null}
  </>;
}
