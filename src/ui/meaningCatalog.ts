const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function businessHelpExcluded(path:string){return /\/(business(?:-|\/|$)|tax(?:\/|$)|planilla(?:\/|$))/.test(path);}
const fundMeanings:Record<string,string>={
 'deposito inicial (usd)':'Es la primera aportación real a esta meta. Al guardar se transfiere desde el Balance disponible, se registra en su historial y aparece en Mis metas. No es un ingreso nuevo y no aumenta el Total de fondos.',
 'resumen de tu dinero':'Balance disponible es lo que queda sin reservar. Total de fondos suma ese balance, tus ahorros, el fondo de emergencia, los presupuestos reservados y las metas. Son cantidades registradas en EduMoney, no balances bancarios confirmados. Toca cada recuadro para consultar y editar su historial. Para añadir o retirar dinero utiliza Transferir fondos.',
 'balance disponible':'Es el dinero registrado que queda sin apartar en fondos. Reservar dinero lo reduce; retirarlo de un fondo lo aumenta. Puede ser negativo si tus pagos superan lo disponible. No es un balance bancario confirmado.',
 'total de fondos':'Suma el balance disponible, los ahorros, el fondo de emergencia, los presupuestos reservados y las metas de la cuenta elegida. Transferir entre ellos cambia el reparto, pero no este total.',
 'ahorros':'Es dinero apartado en fondos de ahorro independientes de Mis metas. Las metas tienen su propio recuadro y se incluyen una sola vez en el Total. Un objetivo o una simulación no añade dinero a este recuadro. Puedes registrar aportaciones y retiradas.',
 'fondo de emergencia':'Es dinero que confirmaste como reservado para imprevistos. El simulador ayuda a calcular una meta; para financiarla debes confirmar una transferencia con dinero disponible.',
 'presupuesto mensual':'Es el dinero que ya reservaste para los gastos del mes. Solo cambia al confirmar una transferencia entre tus fondos. Un presupuesto planificado es una referencia y no añade dinero.',
 'presupuestos reservados':'Es dinero que ya apartaste para gastos previstos. Un presupuesto planificado es solo un límite: no reserva dinero. Reservarlo no registra un gasto; el gasto se registra cuando lo realizas.',
 'transferir fondos':'Cambia cómo distribuyes tu dinero entre disponible, ahorros, emergencia y presupuestos de la misma cuenta. No es un ingreso ni un gasto y no mueve dinero en tu banco. Confírmalo solo cuando hayas realizado esa distribución.',
 'historial de transferencias':'Aquí consultas las distribuciones que confirmaste. Corregir modifica sus datos; revertir anula su efecto en EduMoney y conserva el historial. Ninguna opción cancela operaciones bancarias. Una reserva ya utilizada puede requerir corregir primero las transferencias posteriores.',
 'ahorro proyectado y realizado':'Proyectado es lo que calcula el simulador con tus supuestos. Realizado es el dinero que confirmaste como apartado. Convertir la simulación crea un plan con cero ahorro realizado; las aportaciones se registran cuando las confirmas.',
 'aportacion periodica planificada (usd)':'Es la cantidad que planeas apartar cada vez. No se cobra ni se reserva automáticamente. Cuando la realices, confirma una transferencia para actualizar tu ahorro.',
 'frecuencia de aportacion':'Indica cada cuánto planeas aportar: semanal, quincenal (15 y fin de mes), mensual o anual. Es una planificación; no programa cobros ni registra aportaciones automáticamente.',
 'fecha final para alcanzar la meta':'Es el día en que quieres haber reunido la cantidad objetivo. Elige la fecha de culminación, no la de comienzo. La meta avanza con las aportaciones confirmadas que le asignes.',
 'fecha objetivo (opcional)':'Es la fecha en que te gustaría reunir la cantidad objetivo. No es un vencimiento de pago ni mueve dinero. Puedes dejarla vacía si todavía no la has decidido.',
 'donde guardas el dinero':'Indica dónde conservas el dinero: banco, cooperativa, efectivo en casa, cuenta digital u otra ubicación. Puedes añadir o editar su nombre. Elegirla no conecta una cuenta bancaria ni duplica tu dinero.',
 'tipo de ubicacion':'Elige si guardas el dinero en un banco, cooperativa, efectivo en casa, cuenta digital u otro lugar. Después escribe el nombre que te ayude a identificarlo.',
 'institucion o nombre de ubicacion':'Escribe el nombre del banco, cooperativa, cuenta digital o lugar donde guardas el dinero. Es una referencia personal; no necesitas números de cuenta ni contraseñas.',
 'nombre del fondo':'Pon un nombre que te ayude a recordar para qué apartas el dinero. Crear el fondo no lo financia: después confirma una transferencia.',
 'nombre de la meta':'Pon un nombre al objetivo que quieres alcanzar. El nombre no añade ahorro ni registra una aportación.',
 'presupuesto planificado (usd)':'Es la cantidad que planeas dedicar a ese gasto. Guardarla no aparta dinero: la cantidad efectivamente reservada se registra mediante una transferencia.',
};
export function fieldMeaning(label:string,path=''):string|undefined{
 const s=norm(label);
 if(fundMeanings[s])return fundMeanings[s];
 if(path==='/funds'){
  if(s==='origen')return 'Elige de dónde sale el dinero de esta distribución: balance disponible o un fondo con dinero suficiente en esa fecha.';
  if(s==='destino')return 'Elige dónde quedará apartado el dinero. Debe ser diferente del origen y pertenecer a la misma cuenta personal o comercial.';
  if(s==='cantidad (usd)')return 'Es la cantidad que vas a redistribuir, en dólares. Debe ser mayor que cero y no superar el dinero disponible en el origen.';
  if(s==='fecha')return 'Indica cuándo realizaste la distribución. No se admiten fechas futuras; EduMoney comprueba que había dinero suficiente en esa fecha.';
  if(s==='confirmacion')return 'Confirma solo una distribución que ya realizaste. Al guardar se actualizan tus fondos en EduMoney; no se hace una operación bancaria.';
  if(s==='descripcion (opcional)')return 'Puedes anotar para qué redistribuiste este dinero. La nota queda en el historial de la transferencia.';
 }

 if(s.includes('tasa nominal anual'))return s.includes('hipotetica')?'Es una tasa anual que eliges solo para simular el ahorro; no garantiza ganancias. Para 4 %, escribe 4.':'Es el interés anual que indica el contrato, antes de añadir otros cargos. Para 12 %, escribe 12. Confirma la tasa fija con el prestamista.';
 if(/\bapr\b/.test(s))return 'Es la tasa porcentual anual del crédito, que puede incluir ciertos costos además del interés. Cópiala del contrato o estado de cuenta; no la confundas con la tasa nominal.';
 if(s.includes('principal solicitado'))return 'Es el dinero que quieres pedir prestado, antes de sumar intereses. Escribe la cantidad del préstamo.';
 if(s.includes('pronto')||s.includes('pago inicial'))return 'Es el dinero que pagas al principio con tus fondos. Reduce lo que necesitas financiar.';
 if(s.includes('cargos que se financian'))return 'Son cargos que se añaden al préstamo y pagarás junto con él. Confirma el total; escribe 0 solo si no hay.';
 if(s.includes('cargos iniciales pagados aparte'))return 'Son costos que pagas al comenzar y que no se incluyen en el préstamo. No repitas aquí los cargos financiados.';
 if(s.includes('costos adicionales mensuales'))return 'Son gastos mensuales aparte de la cuota, como seguro o mantenimiento. Escribe una estimación de su total.';
 if(s.includes('plazo')||s.includes('horizonte'))return 'Es el tiempo del préstamo o de la simulación, contado en meses. Por ejemplo, 2 años son 24 meses.';
 if(s.includes('meses de cobertura'))return 'Es cuántos meses de gastos esenciales quieres cubrir con tu fondo de emergencia.';
 if(s.includes('gastos esenciales'))return 'Suma lo necesario para vivir durante un mes, como vivienda, comida, servicios y transporte.';
 if(s.includes('margen mensual'))return 'Es la cantidad que eliges como referencia para comparar con el costo mensual. No cambia tus balances reales.';
 if(s.includes('ahorro o fondo actual')||s.includes('ahorro previo'))return 'Es el dinero que ya tenías separado antes de registrar nuevas aportaciones. Evita contar el mismo dinero dos veces.';
 if(s.includes('aportacion mensual'))return 'Es lo que planeas añadir a tu ahorro cada mes. Es una propuesta; no hace transferencias automáticas.';
 if(s==='frecuencia de aportacion sugerida')return 'Elige aportaciones semanales, quincenales (15 y último día del mes) o mensuales. La sugerencia reparte lo pendiente hasta la fecha final; no crea depósitos automáticamente.';
 if(s.includes('frecuencia')||s.includes('cadencia'))return 'Indica cada cuánto ocurre: semanal, mensual o anual. Elige lo que corresponde a ese cobro o pago.';
 if(s.includes('fecha de corte')||s.includes('cierre'))return 'Es el día en que termina el período del estado de cuenta. Es distinto del último día para pagar.';
 if(s.includes('vencimiento')||s.includes('fecha limite'))return 'Es el último día para hacer el pago según la factura o el contrato.';
 if(s.includes('pago minimo')||s.includes('minimo mensual'))return 'Es el menor pago exigido para ese período. Pagar solo eso puede alargar la deuda y aumentar intereses.';
 if(s.includes('saldo'))return 'Es la cantidad pendiente o registrada en este apartado. Confírmala con tu estado de cuenta cuando corresponda.';
 if(s.includes('categoria'))return 'Elige el grupo que mejor describe el ingreso o gasto. Puedes crear uno si no encuentras el que necesitas.';
 if(s.includes('metodo de pago'))return 'Elige cómo recibiste o pagaste el dinero: efectivo, cheque, tarjeta u otro medio. Esto no cambia el importe.';
 if(s.includes('descripcion'))return 'Escribe para qué fue la transacción o de dónde vino el dinero. Este detalle te ayudará a encontrarla después.';
 if(s.includes('importe'))return 'Es la cantidad de dinero de esta transacción, en dólares. No sumes aquí otros pagos.';
 if(s.includes('presupuesto'))return 'Es un límite o plan de gasto que eliges para el mes. No registra un gasto ni aparta dinero por sí solo.';
 if(s.includes('objetivo')||s.includes('meta de ahorro'))return 'Es la cantidad que quieres reunir. Se compara con el ahorro que vayas registrando.';
 if(s.includes('motivo'))return 'Explica brevemente por qué haces este cambio. Quedará junto al historial para que puedas revisarlo.';
 return undefined;
}
export function sectionMeaning(path:string,title:string):string|undefined{
 if(businessHelpExcluded(path))return undefined;
 if(path.includes('decisions'))return 'Aquí puedes comparar supuestos antes de decidir. Completa los datos que conozcas y abre «¿Qué significa?» junto a un campo si necesitas ayuda. Simular no solicita crédito ni registra pagos.';
 if(path.includes('funds')&&norm(title)==='presupuesto mensual')return 'Presupuesto mensual permite simular ingresos, distribuir cantidades y comparar el plan con gastos registrados. Guardar conserva la proyección y no modifica los balances reales. Los movimientos de dinero se administran por separado.';
 if(path.includes('funds'))return 'Aquí consultas las transferencias de esta sección. Utiliza Transferir fondos para añadir o retirar dinero y Editar historiales para corregir o eliminar una transferencia. No se convierte en un ingreso o gasto ni se mueve dinero en tu banco.';
 if(path.includes('goals'))return 'Define tu objetivo y la fecha final. Al seleccionar una meta verás una pista: verde para cantidades cubiertas y rojo para las pendientes. Las aportaciones confirmadas actualizan el avance; al alcanzar el objetivo aparece la celebración. Puedes planificar aportaciones semanales, quincenales o mensuales. Crear o editar una meta no añade dinero.';
 if(path.includes('learn')||path.includes('debt-lessons'))return 'Lee la explicación, contesta la pregunta y comprueba lo aprendido. Después del premio puedes continuar con la próxima lección.';
 if(path.includes('progress'))return 'Aquí ves lo que has aprendido, las revisiones de tu plan y el avance del dinero reunido para cada meta. Completar una revisión no registra pagos ni transacciones.';
 if(path.includes('debts'))return 'Registra lo que debes, consulta vencimientos y compara formas de pagar. Los cobros programados se confirman cuando recibes el dinero.';
 if(path.includes('bills'))return 'Añade tus facturas y sus fechas de vencimiento. Registrar una factura no confirma que ya la pagaste.';
 if(path.includes('dictations'))return 'Los dictados que necesitan corrección permanecen pendientes. Ábrelos, completa lo que falta y guarda para registrar la transacción.';
 if(/documents|receipt-reader/.test(path))return 'Revisa los datos leídos antes de guardarlos y elige Personal o Comercial. En la cuenta personal se guardan los datos del documento.';
 if(path.includes('charts'))return 'Consulta ingresos, gastos y disponible de la cuenta y del mes elegidos. Disponible es una estimación basada en tus registros, no un saldo bancario confirmado.';
 if(path.includes('settings'))return 'Ajusta la apariencia, la seguridad y las preferencias de tu aplicación. Cada opción indica qué cambia.';
 if(path.includes('backup'))return 'Un respaldo es una copia para recuperar tus datos. Guárdalo en un lugar seguro y conserva tu contraseña.';
 if(path.includes('sync'))return 'La sincronización permite mantener tus registros entre dispositivos autorizados. Revisa el estado antes de cerrar la aplicación.';
 if(path==='/'||path==='/money')return 'Elige Personal o Comercial para ver sus datos por separado. '+fundMeanings['resumen de tu dinero']+' Usa Transferir fondos para registrar una distribución interna y Transacciones para consultar las gráficas.';
 return title?'Aquí puedes revisar '+title.toLocaleLowerCase('es')+' y abrir las opciones disponibles. Los campos obligatorios deben completarse antes de guardar.':undefined;
}
