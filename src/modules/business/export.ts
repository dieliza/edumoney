import { download } from '../../web/files';
import type { businessExport } from './ledgerDomain';
export async function shareBusinessExport(report: ReturnType<typeof businessExport>, copies: { id: string; mime: string; base64: string }[], format: 'json' | 'csv') {
  download(format === 'json' ? JSON.stringify({ ...report, copies }, null, 2) : '\uFEFF' + report.csv, `EduMoney-Negocio-CPA.${format}`, format === 'json' ? 'application/json' : 'text/csv;charset=utf-8');
}
