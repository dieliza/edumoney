import type { businessExport } from './ledgerDomain';
export async function shareBusinessExport(_report:ReturnType<typeof businessExport>,_copies:{id:string;mime:string;base64:string}[],_format:'json'|'csv'):Promise<void>{throw new Error('La exportación requiere la aplicación nativa.');}
