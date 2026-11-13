/** Campos exigidos por las validaciones actuales. Los desconocidos opcionales no se convierten en cero. */
const requiredLabels = new Set([
  'Proveedor','Importe de factura (USD)','Vencimiento (AAAA-MM-DD)','Cada cuántos intervalos (1 a 365)',
  'Motivo del cambio de factura','Importe pagado (USD)','Fecha del pago (AAAA-MM-DD)',
  'Nombre legal','Jurisdicción de constitución de la LLC','Descripción','Fecha AAAA-MM-DD',
  'Depósito neto recibido USD','Importe total del gasto USD','Porcentaje comercial (hasta dos decimales)',
  'Justificación del porcentaje comercial','Motivo de la revisión comercial','Descripción del recibo',
  'Cantidad total que mantienes reservada USD','Motivo del importe o cambio',
  'Nombre de la deuda','Saldo total pendiente (USD)','Motivo de actualización de deuda',
  'Importe del pago de deuda (USD)','Fecha del pago de deuda (AAAA-MM-DD)',
  'Aporte adicional mensual (USD)','Primer mes del escenario (AAAA-MM)',
  'Comercio o descripción confirmada','Nombre de la meta','Cantidad objetivo','Motivo del cambio',
  'Importe de aportación','Fecha de aportación AAAA-MM-DD','Nombre de categoría','Límite mensual (USD)',
  'Importe recibido o neto (USD)','Importe (USD)','Fecha (AAAA-MM-DD)','Cada cuántas semanas o meses (1–120)',
  'Motivo de la corrección','Formulario o tipo de informativa','Nombre del pagador',
  'Nombre del escenario para guardar','Nombre del escenario','Supuestos, plazo y explicación del escenario',
  'Nombre del empleado','Código único del empleado','Fecha del pago AAAA-MM-DD','Inicio del período AAAA-MM-DD','Fin del período AAAA-MM-DD',
  'Referencia única del cálculo','Comprobante único del pago real','Obligación o trámite',
  'Contraseña local','Repetir contraseña local','Contraseña del respaldo','Código privado de enlace',
  'Mes (AAAA-MM)','Mes del calendario (AAAA-MM)','Mes para revisar AAAA-MM','Mes de consulta AAAA-MM','Año natural de consulta AAAA',
  'Año del panel AAAA','Fecha de corte AAAA-MM-DD','Año contributivo','Año de cierre','Año de conciliación','Año natural',
  'Porcentaje comercial (0 a 100, sin extremos)','Motivo de anulación o reversión','Motivo para revertir o archivar',
  'Motivo de reversión o archivo de deuda','Motivo de eliminación o revisión','Motivo de anulación',
  'Importe confirmado','Fecha real AAAA-MM-DD','Importe de esta partida del depósito',
  'Comprobante y sufijo único por partida (no repetir total)','Bruto efectivamente pagado','Neto efectivamente pagado',
  'Base salarial de Seguro Social del pago','Base salarial Medicare del pago',
  'Nombre de la oferta','Nombre del proveedor','Referencia única del proveedor',

]);
export function isRequiredField(label: string) { return requiredLabels.has(label) || /^DBA \d+$|^Nombre del proyecto \d+$|^Realmente retenido /.test(label); }
export function missingField(value: string, required: boolean) { return required && value.trim().length === 0; }

const calculationLabels = new Set(['Ventas brutas USD','Comisiones descontadas USD','Devoluciones descontadas USD','IVU registrado en este cobro USD','Salarios verificados, encasillado 11 (USD)','Retención verificada, encasillado 13 (USD)','Salario del período o tarifa por hora','Dependientes con exención completa (cantidad entera)','Dependientes con mitad de exención (cantidad entera)','Concesiones por deducciones (cantidad entera)','Retención PR adicional por período','Salarios de este patrono ANTES de empezar a registrar aquí este año (0 si confirmado)','Otras deducciones autorizadas del empleado','Ingreso bruto informado (USD)','Retención informada (USD)']);
export function isCalculationField(label:string){return calculationLabels.has(label);}
