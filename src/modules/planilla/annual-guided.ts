/** Preparación anual guiada: clasificación y completitud, sin calcular deuda contributiva. */
export type PerfilContributivo = 'asalariado' | 'cuentapropista' | 'contratista' | 'comerciante' | 'mixto';
export type RegistroAnual = {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'ingreso' | 'gasto' | 'retencion' | 'transferencia';
  centavos: number;
  categoria?: string;
  fuente?: string;
};
export type RespuestaContributiva = { clave: string; valor: string | number | boolean | null };
export type ResultadoPreparacion = {
  anio: number;
  perfiles: PerfilContributivo[];
  totales: { ingresosCentavos: number; gastosCentavos: number; retencionesCentavos: number };
  preguntasPendientes: string[];
  advertencias: string[];
  listoParaRadicar: false;
};
const PREGUNTAS = {
  generales: ['residencia', 'estadoCivil', 'dependientes', 'otrosIngresos', 'deducciones', 'creditos'],
  asalariado: ['comprobante499R2'],
  cuentapropista: ['informativasServicios', 'gastosDeducibles', 'retencionesServicios'],
  contratista: ['informativasServicios', 'gastosDeducibles', 'retencionesServicios'],
  comerciante: ['ventasNetas', 'costoVentas', 'inventario', 'gastosDeducibles', 'ivuSeparado'],
};
export function prepararAnio(
  anio: number,
  perfiles: PerfilContributivo[],
  registros: RegistroAnual[],
  respuestas: RespuestaContributiva[] = [],
): ResultadoPreparacion {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new Error('Año contributivo inválido');
  if (!perfiles.length) throw new Error('Seleccione al menos un perfil');
  const unicos = [...new Set(perfiles)];
  const requeridos = new Set<string>(PREGUNTAS.generales);
  for (const perfil of unicos) {
    if (perfil === 'mixto') continue;
    for (const clave of PREGUNTAS[perfil]) requeridos.add(clave);
  }
  const respondidos = new Set(respuestas.filter(r => r.valor !== null && r.valor !== '').map(r => r.clave));
  const totales = { ingresosCentavos: 0, gastosCentavos: 0, retencionesCentavos: 0 };
  const advertencias: string[] = [];
  const ids = new Set<string>();
  for (const r of registros) {
    if (ids.has(r.id)) { advertencias.push('Registro duplicado omitido: ' + r.id); continue; }
    ids.add(r.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha) || Number.isNaN(Date.parse(r.fecha)) ||
        new Date(r.fecha + 'T00:00:00Z').toISOString().slice(0, 10) !== r.fecha) {
      advertencias.push('Fecha inválida: ' + r.id); continue;
    }
    if (Number(r.fecha.slice(0, 4)) !== anio) continue;
    if (!Number.isSafeInteger(r.centavos) || r.centavos < 0) { advertencias.push('Importe inválido: ' + r.id); continue; }
    if (r.tipo === 'ingreso') totales.ingresosCentavos += r.centavos;
    else if (r.tipo === 'gasto') totales.gastosCentavos += r.centavos;
    else if (r.tipo === 'retencion') totales.retencionesCentavos += r.centavos;
    // Las transferencias no son ingresos.
  }
  advertencias.push('Los gastos registrados no son necesariamente deducibles.');
  advertencias.push('No se ha validado el mapeo completo al Formulario 482 ni sus anejos oficiales.');
  if (unicos.includes('mixto') && unicos.length === 1) advertencias.push('Identifique las fuentes de ingreso del perfil mixto.');
  return {
    anio, perfiles: unicos, totales,
    preguntasPendientes: [...requeridos].filter(clave => !respondidos.has(clave)),
    advertencias, listoParaRadicar: false,
  };
}
