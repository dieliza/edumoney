import type {EducationTip} from './types';
export const debtLessonIds=new Set(['debt','credit','loan','vehicle','home']);
/** Solo organiza contenido educativo; no clasifica ni modifica registros contables. */
export function isDebtTip(tip:Pick<EducationTip,'id'|'title'|'body'>){const text=`${tip.id} ${tip.title} ${tip.body}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return /\b(deudas?|credito|prestamos?|intereses|avalancha|tarjetas?)\b|bola de nieve/.test(text);}
