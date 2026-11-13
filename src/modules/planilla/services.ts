import { Asset } from 'expo-asset';
import { download } from '../../web/files';
import type { Closure } from './engine';
import { evaluateClosure } from './engine';
export async function generateClosurePDF(c: Closure, mode: 'review' | 'laboratory' = 'review') {
  let template: Uint8Array | undefined;
  if (c.year === 2025) { const asset = Asset.fromModule(require('../../../assets/tax/2025/form-482-informativo.pdf')); const response = await fetch(asset.uri); if (!response.ok) throw Error('No se pudo abrir la plantilla oficial incluida.'); template = new Uint8Array(await response.arrayBuffer()); }
  const { buildClosurePDF } = await import('./pdf'); return buildClosurePDF(c, evaluateClosure(c, mode), template);
}
export async function shareClosurePDF(c: Closure) { download(await generateClosurePDF(c), `EduMoney-cierre-${c.year}-no-radicado.pdf`, 'application/pdf'); }
