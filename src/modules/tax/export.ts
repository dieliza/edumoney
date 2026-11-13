import { download } from '../../web/files';
import type { buildExport } from './domain';
export async function shareTaxExport(report: ReturnType<typeof buildExport>, copies: { id: string; mime: string; base64: string }[], format: 'json' | 'csv') {
  download(format === 'json' ? JSON.stringify({ ...report, copies }, null, 2) : '\uFEFF' + report.csv, `EduMoney-Para-mi-contable.${format}`, format === 'json' ? 'application/json' : 'text/csv;charset=utf-8');
}
