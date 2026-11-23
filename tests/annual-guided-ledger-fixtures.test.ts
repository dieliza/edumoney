import { describe, expect, it } from 'vitest';
import { prepararExpedienteGuiado } from '../src/modules/planilla/annual-snapshot';
import { ANNUAL_FIXTURE_MONTHS, fiveAnnualFixtures } from './fixtures/annual-guided-synthetic';

describe('Planilla guiada: cinco expedientes ficticios con doce meses', () => {
  it.each(fiveAnnualFixtures())('$id conserva la identidad y revisa la conciliación antes de concluir', (f) => {
    const key = (date: string) => date.slice(5, 7);
    const months = new Set(f.source.movements.filter(m => m.kind === 'income' && !m.deletedAt && m.date.startsWith('2025-')).map(m => key(m.date)));
    expect([...months].sort()).toEqual(ANNUAL_FIXTURE_MONTHS);
    const original = structuredClone(f.source);
    const result = prepararExpedienteGuiado(2025, f.perfiles, f.source, f.respuestas);
    expect(f.source).toEqual(original);
    expect(result.anio).toBe(2025);
    expect(result.perfiles).toEqual(f.perfiles);
    expect(result.totales).toEqual({
      ingresosCentavos: f.expected.ingresosCentavos,
      gastosCentavos: f.expected.gastosCentavos,
      retencionesCentavos: f.expected.retencionesCentavos,
    });
    expect(result.deduciblesConfirmadosCentavos).toBe(f.expected.deduciblesConfirmadosCentavos);
    expect(result.ingresosSinBruto).toBe(f.expected.ingresosSinBruto);
    expect(result.netoPreliminarCentavos).toBe(f.expected.netoPreliminarCentavos);
    expect(result.listoParaRadicar).toBe(false);
    expect(result.advertencias.join(' ')).toMatch(/No se ha validado el mapeo completo/);

    const routes = result.anejos.map(a => [a.id, a.estado]);
    if (f.id === 'asalariado') {
      expect(result.movimientosConsiderados).toBe(24); // Paid income + expenses, not transfers, loans, goals, debt, deleted/prior year.
      expect(result.retencionesSinConfirmar).toBe(0);
      expect(result.preguntasPendientes).not.toContain('comprobante499R2');
      expect(result.preguntasPendientes).not.toContain('dependientes');
      expect(routes).toEqual([]);
    } else if (f.id === 'contratista') {
      expect(result.movimientosConsiderados).toBe(60); // The identical imported movement ID counts once.
      expect(result.gastosSinRevisar).toBe(12);
      expect(result.advertencias.join(' ')).toMatch(/Movimiento duplicado|Registro duplicado/);
      expect(result.advertencias.join(' ')).toMatch(/vinculado a varias informativas/);
      expect(routes).toContainEqual(['M', 'considerar']);
    } else if (f.id === 'cuentapropista-con-perdida') {
      expect(result.retencionesSinConfirmar).toBe(0); // Explicit zero does not mean unsupported retention.
      expect(routes).toContainEqual(['J–N', 'pendiente']);
      expect(routes).not.toContainEqual(['M', 'considerar']);
    } else if (f.id === 'comerciante') {
      expect(routes).toContainEqual(['K', 'considerar']);
      expect(result.gastosSinRevisar).toBe(12);
      expect(result.preguntasPendientes).toEqual(expect.arrayContaining(['inventario', 'costoVentas', 'creditos']));
    } else {
      expect(result.retencionesSinConfirmar).toBe(1);
      expect(result.preguntasPendientes).toEqual(expect.arrayContaining(['comprobante499R2', 'retencionesServicios']));
      expect(result.advertencias.join(' ')).toMatch(/Informativa mixto-servicio-sin-conciliar/);
      expect(routes).toEqual(expect.arrayContaining([['M', 'considerar'], ['CT', 'pendiente']]));
    }
  });
});
