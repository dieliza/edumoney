import type { TaxStore } from './store';
export function getTaxStore():Promise<TaxStore>{return Promise.reject(new Error('Requiere almacenamiento nativo cifrado.'));}
