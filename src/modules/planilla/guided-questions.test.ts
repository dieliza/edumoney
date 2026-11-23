import { describe, expect, it } from 'vitest';
import { preguntasParaPerfiles } from './guided-questions';
describe('preguntas guiadas por perfil', () => {
  it('muestra preguntas salariales y no comerciales', () => {
    const keys = preguntasParaPerfiles(['asalariado']).map(p => p.clave);
    expect(keys).toContain('comprobante499R2');
    expect(keys).not.toContain('inventario');
  });
  it('admite perfiles mixtos y respuestas cero', () => {
    const keys = preguntasParaPerfiles(['asalariado','comerciante'], [{clave:'dependientes',valor:0}]).map(p=>p.clave);
    expect(keys).toContain('inventario');
    expect(keys).not.toContain('dependientes');
  });
});
