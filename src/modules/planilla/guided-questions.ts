import type { PerfilContributivo, RespuestaContributiva } from './annual-guided';

/** Preguntas sencillas para preparar un borrador; no sustituyen las instrucciones oficiales. */
export type PreguntaGuiada = {
  clave: string;
  titulo: string;
  ayuda: string;
  perfiles: PerfilContributivo[] | 'todos';
  documento?: string;
};
export const PREGUNTAS_GUIADAS: readonly PreguntaGuiada[] = [
  { clave: 'residencia', titulo: '¿Viviste en Puerto Rico durante todo el año?', ayuda: 'Si te mudaste, indica las fechas. Esto puede cambiar la planilla que te corresponde.', perfiles: 'todos' },
  { clave: 'estadoCivil', titulo: '¿Cuál era tu estado civil al terminar el año?', ayuda: 'Selecciona tu situación al 31 de diciembre.', perfiles: 'todos' },
  { clave: 'dependientes', titulo: '¿Vas a reclamar dependientes?', ayuda: 'Puedes indicar cero. Si tienes dependientes, te pediremos los datos necesarios.', perfiles: 'todos' },
  { clave: 'otrosIngresos', titulo: '¿Recibiste otros ingresos que no registraste?', ayuda: 'Por ejemplo, intereses, alquileres u otro trabajo. No sumes dos veces el mismo ingreso.', perfiles: 'todos' },
  { clave: 'deducciones', titulo: '¿Tienes deducciones que quieras evaluar?', ayuda: 'No todos los gastos personales o del negocio son deducibles.', perfiles: 'todos' },
  { clave: 'creditos', titulo: '¿Quieres comprobar si cualificas para créditos contributivos?', ayuda: 'La elegibilidad depende del año y de tus circunstancias; no se presume.', perfiles: 'todos' },
  { clave: 'comprobante499R2', titulo: '¿Tienes tu comprobante de retención del patrono?', ayuda: 'Usaremos los encasillados oficiales, no el depósito recibido.', perfiles: ['asalariado'], documento: '499R-2/W-2PR' },
  { clave: 'informativasServicios', titulo: '¿Recibiste informativas por tus servicios?', ayuda: 'Revisa las cantidades y compáralas con tus facturas. Una informativa no crea ingresos adicionales.', perfiles: ['contratista','cuentapropista'], documento: '480.6SP / 480.6G' },
  { clave: 'retencionesServicios', titulo: '¿Te retuvieron contribuciones de los pagos por servicios?', ayuda: 'Registra las cantidades retenidas según las informativas y comprueba cualquier relevo.', perfiles: ['contratista','cuentapropista'] },
  { clave: 'ventasNetas', titulo: '¿Cuánto vendiste después de devoluciones?', ayuda: 'Separa ventas, devoluciones e IVU; los depósitos no siempre equivalen a ventas.', perfiles: ['comerciante'] },
  { clave: 'costoVentas', titulo: '¿Compraste mercancía para revender?', ayuda: 'El costo de ventas puede requerir inventario inicial y final.', perfiles: ['comerciante'] },
  { clave: 'inventario', titulo: '¿Tienes inventario al comenzar o terminar el año?', ayuda: 'Si no vendes mercancía, indica que no aplica.', perfiles: ['comerciante'] },
  { clave: 'ivuSeparado', titulo: '¿Separaste el IVU cobrado de tus ventas?', ayuda: 'El IVU cobrado para remitir no debe confundirse con el ingreso propio.', perfiles: ['comerciante'] },
  { clave: 'gastosDeducibles', titulo: '¿Cuáles gastos corresponden realmente a tu trabajo o negocio?', ayuda: 'Revisa comprobantes y uso personal o mixto antes de reclamar una deducción.', perfiles: ['comerciante','contratista','cuentapropista'] },
];
export function preguntasParaPerfiles(perfiles: readonly PerfilContributivo[], respuestas: readonly RespuestaContributiva[] = []): PreguntaGuiada[] {
  const contestadas = new Set(respuestas.filter(r => r.valor !== null && r.valor !== '').map(r => r.clave));
  return PREGUNTAS_GUIADAS.filter(p =>
    (p.perfiles === 'todos' || p.perfiles.some(perfil => perfiles.includes(perfil))) &&
    !contestadas.has(p.clave)
  );
}
