import { expect, it } from 'vitest';
import { expenseSegments } from '../src/ui/expenseSegments';
it('representa un gasto único como un círculo completo', () => {
  expect(expenseSegments([{ id: 'food', name: 'Comida', spent: 5500 }])).toMatchObject([{ fraction: 1, offset: 0 }]);
});
it('reparte gastos compartidos sin volver a sumar el total', () => {
  const segments = expenseSegments([{ id: 'a', name: 'A', spent: 2750 }, { id: 'b', name: 'B', spent: 2750 }]);
  expect(segments.map(s => [s.fraction, s.offset])).toEqual([[0.5, 0], [0.5, 0.5]]);
});
it('no inventa segmentos cuando no hay gastos', () => {
  expect(expenseSegments([])).toEqual([]);
  expect(expenseSegments([{ id: 'a', name: 'A', spent: 0 }])).toEqual([]);
});
