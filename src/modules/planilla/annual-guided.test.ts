import { describe, expect, it } from 'vitest';
import { prepararAnio } from './annual-guided';

describe('preparación contributiva anual guiada', () => {
  it('resume doce meses sin contar transferencias ni registros duplicados', () => {
    const registros = Array.from({ length: 12 }, (_, i) => ({
      id: 'ingreso-' + i,
      fecha: '2025-' + String(i + 1).padStart(2, '0') + '-15',
      tipo: 'ingreso' as const,
      centavos: 100000,
    }));
    const resultado = prepararAnio(2025, ['cuentapropista'], [
      ...registros, registros[0],
      { id: 'transferencia', fecha: '2025-04-01', tipo: 'transferencia', centavos: 200000 },
      { id: 'gasto', fecha: '2025-05-01', tipo: 'gasto', centavos: 25000 },
      { id: 'otro-anio', fecha: '2024-01-01', tipo: 'ingreso', centavos: 50000 },
    ]);
    expect(resultado.totales).toEqual({ ingresosCentavos: 1200000, gastosCentavos: 25000, retencionesCentavos: 0 });
    expect(resultado.preguntasPendientes).toContain('gastosDeducibles');
    expect(resultado.listoParaRadicar).toBe(false);
  });
  it('combina perfiles y conserva preguntas distintas', () => {
    const resultado = prepararAnio(2025, ['asalariado', 'comerciante'], []);
    expect(resultado.preguntasPendientes).toContain('comprobante499R2');
    expect(resultado.preguntasPendientes).toContain('inventario');
  });
  it('no interpreta un cero confirmado como respuesta ausente', () => {
    const resultado = prepararAnio(2025, ['asalariado'], [], [{ clave: 'dependientes', valor: 0 }]);
    expect(resultado.preguntasPendientes).not.toContain('dependientes');
  });
  it('rechaza años inválidos', () => {
    expect(() => prepararAnio(0, ['asalariado'], [])).toThrow();
  });
});
