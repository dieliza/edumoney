import type { Bill } from './types';
export async function syncReminders(_bills:Bill[]){return 'Los avisos locales requieren la aplicación de iOS o Android.';}
export async function enableReminders(){return false;}
export async function calendarCopy(_bill:Bill):Promise<string>{return 'El calendario requiere iOS o Android.';}
