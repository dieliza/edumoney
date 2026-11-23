import { describe, expect, it } from 'vitest';
import { employeeFields } from '../src/modules/business/payroll/forms';
import { isCalculationField } from '../src/ui/requiredFields';

describe('Ayuda de Nómina de Negocio', () => {
  it('solo usa casillas cortas para los tres conteos y conserva su validación', () => {
    const short = employeeFields.filter(field => field.compactInteger);
    expect(short.map(field => field.key)).toEqual(['dependents','halfDependents','allowances']);
    for (const field of short) {
      expect(field.money).toBeFalsy();
      expect(isCalculationField(field.label)).toBe(true);
      expect(field.help?.text).toMatch(/Ejemplo:/);
      expect(field.help?.source).toMatch(/^https:\/\/hacienda\.pr\.gov\//);
    }
  });
  it('explica el propósito de las concesiones antes de remitir al certificado', () => {
    const text = employeeFields.find(field => field.key === 'allowances')?.help?.text ?? '';
    expect(text.indexOf('menos contribución de cada cheque')).toBeGreaterThan(-1);
    expect(text.indexOf('«Reclamar» significa')).toBeLessThan(text.indexOf('Parte C'));
    expect(text).toContain('No pongas una cantidad en dólares');
  });
});
