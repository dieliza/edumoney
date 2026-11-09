import type { buildExport } from './domain';
export async function shareTaxExport(_report:ReturnType<typeof buildExport>,_copies:{id:string;mime:string;base64:string}[],_format:'json'|'csv'):Promise<void>{throw new Error('La exportación requiere la aplicación nativa.');}
