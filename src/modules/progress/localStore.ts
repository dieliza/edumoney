import type { ProgressStore } from './store';
export function getProgressStore():Promise<ProgressStore>{return Promise.reject(new Error('El progreso necesita almacenamiento nativo cifrado.'));}
