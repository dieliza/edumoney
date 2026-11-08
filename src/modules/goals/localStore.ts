import type { GoalStore } from './store';
export function getGoalStore():Promise<GoalStore>{return Promise.reject(new Error('Las metas necesitan almacenamiento nativo cifrado.'));}
