import { download } from '../../../web/files';
export async function sharePayroll(data: string | Uint8Array, format: 'csv' | 'pdf') { download(data, `EduMoney-Nomina-Borrador.${format}`, format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8'); }
