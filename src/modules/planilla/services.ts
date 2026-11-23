import { Asset } from 'expo-asset';
import { download } from '../../web/files';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
export async function generateClosurePDF(c: Closure, mode: 'review' | 'laboratory' = 'review') {
  let template: Uint8Array | undefined;
  if (c.year === 2025) { const asset = Asset.fromModule(require('../../../assets/tax/2025/form-482-informativo.pdf')); const response = await fetch(asset.uri); if (!response.ok) throw Error('No se pudo abrir la plantilla oficial incluida.'); template = new Uint8Array(await response.arrayBuffer()); }
  let ctTemplate: Uint8Array | undefined;
  if (c.year === 2025 && (c.guided?.respuestas.some(r => r.clave === 'creditos' && r.valor === true) || !!c.components?.['27C'])) {
    const asset = Asset.fromModule(require('../../../assets/tax/2025/schedule-ct-informativo.pdf'));
    const response = await fetch(asset.uri);
    if (!response.ok) throw Error('No se pudo abrir el Anejo CT de referencia incluido.');
    ctTemplate = new Uint8Array(await response.arrayBuffer());
  }
  let businessTemplate: Uint8Array | undefined;
  if (c.year === 2025 && c.draft482 && (c.draft482.incomeCoverage !== 'salary' || c.components?.['27B'] != null)) {
    const asset = Asset.fromModule(require('../../../assets/tax/2025/schedules-informativo.pdf'));
    const response = await fetch(asset.uri);
    if (!response.ok) throw Error('No se pudo abrir la plantilla de los anejos.');
    businessTemplate = new Uint8Array(await response.arrayBuffer());
  }
  const { buildClosurePDF } = await import('./pdf'); return buildClosurePDF(c, evaluateClosure(c, mode), template, ctTemplate, businessTemplate);
}
export async function shareClosurePDF(c: Closure) { download(await generateClosurePDF(c), `EduMoney-cierre-${c.year}-no-radicado.pdf`, 'application/pdf'); }

export async function shareAnnualSummaryPDF(result: import('./annual-summary-pdf').AnnualSummary, kind: import('./annual-summary-pdf').AnnualSummaryKind) {
  const { buildAnnualSummaryPDF } = await import('./annual-summary-pdf');
  download(await buildAnnualSummaryPDF(result, kind), `EduMoney-${kind === 'annual' ? 'informe-anual' : 'retenciones-creditos'}-${result.anio}.pdf`, 'application/pdf');
}
