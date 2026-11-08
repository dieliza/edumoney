import type { LearningStore } from './store';
export function getLearningStore():Promise<LearningStore>{return Promise.reject(new Error('El avance y escenarios requieren almacenamiento nativo cifrado.'));}
