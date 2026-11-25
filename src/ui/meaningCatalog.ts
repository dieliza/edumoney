const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function businessHelpExcluded(path:string){return /\/(business(?:-|\/|$)|tax(?:\/|$)|planilla(?:\/|$))/.test(path);}
export function fieldMeaning(label:string):string|undefined{
 const s=norm(label);
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
 if(path.includes('goals'))return 'Crea una meta, registra tu ahorro y revisa el presupuesto mensual. Las metas no apartan dinero ni hacen transferencias automáticamente.';
 if(path.includes('learn')||path.includes('debt-lessons'))return 'Lee la explicación, contesta la pregunta y comprueba lo aprendido. Después del premio puedes continuar con la próxima lección.';
 if(path.includes('progress'))return 'Aquí ves lo que has aprendido y las revisiones de tu plan. Completar una revisión no registra pagos ni transacciones.';
 if(path.includes('debts'))return 'Registra lo que debes, consulta vencimientos y compara formas de pagar. Los cobros programados se confirman cuando recibes el dinero.';
 if(path.includes('bills'))return 'Añade tus facturas y sus fechas de vencimiento. Registrar una factura no confirma que ya la pagaste.';
 if(path.includes('dictations'))return 'Los dictados que necesitan corrección permanecen pendientes. Ábrelos, completa lo que falta y guarda para registrar la transacción.';
 if(/documents|receipt-reader/.test(path))return 'Revisa los datos leídos antes de guardarlos y elige Personal o Comercial. En la cuenta personal se guardan los datos del documento.';
 if(path.includes('charts'))return 'Consulta ingresos, gastos y disponible de la cuenta y del mes elegidos. Disponible es una estimación basada en tus registros, no un saldo bancario confirmado.';
 if(path.includes('settings'))return 'Ajusta la apariencia, la seguridad y las preferencias de tu aplicación. Cada opción indica qué cambia.';
 if(path.includes('backup'))return 'Un respaldo es una copia para recuperar tus datos. Guárdalo en un lugar seguro y conserva tu contraseña.';
 if(path.includes('sync'))return 'La sincronización permite mantener tus registros entre dispositivos autorizados. Revisa el estado antes de cerrar la aplicación.';
 if(path==='/'||path==='/money')return 'Elige Personal o Comercial para ver sus datos por separado. Registra ingresos y gastos, y abre Transacciones para consultar las gráficas.';
 return title?'Aquí puedes revisar '+title.toLocaleLowerCase('es')+' y abrir las opciones disponibles. Los campos obligatorios deben completarse antes de guardar.':undefined;
}
