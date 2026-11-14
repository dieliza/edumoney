import {expect,it} from 'vitest';
import {debtLessonIds,isDebtTip} from '../src/modules/education/topics';
import {lessons} from '../src/modules/learning/content';
import seed from '../src/modules/education/seed.json';
it('la reorganización mantiene las diez lecciones y reparte cada ID entre un único tema',()=>{const debt=lessons.filter(l=>debtLessonIds.has(l.id)),general=lessons.filter(l=>!debtLessonIds.has(l.id));expect(debt.map(l=>l.id)).toEqual(['debt','credit','loan','vehicle','home']);expect([...debt,...general]).toHaveLength(10);expect(new Set([...debt,...general].map(l=>l.id)).size).toBe(10);});
it('consejos de avalancha, bola de nieve y deuda se presentan dentro de Deudas sin alterar contenido',()=>{for(const id of ['avalancha','bola-nieve','deuda-lista','minimos'])expect(isDebtTip(seed.tips.find(t=>t.id===id)!)).toBe(true);for(const id of ['meta-clara','reserva-inicio','registro-gastos'])expect(isDebtTip(seed.tips.find(t=>t.id===id)!)).toBe(false);expect(new Set(seed.tips.map(t=>t.id)).size).toBe(30);});
