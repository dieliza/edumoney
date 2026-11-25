# Transferir fondos como acceso único

Cambios preparados a solicitud del propietario:

- Mis metas conserva únicamente Simular ahorro entre sus accesos superiores. Se retiró el acceso directo Registrar aportación y el detalle de meta abre su historial.
- Home muestra Presupuesto mensual en el recuadro violeta.
- Ahorros, Fondo de emergencia y Presupuesto mensual muestran Transferir fondos e Historial de transferencias; se retiraron el resumen, los selectores, las fichas de fondos y Crear fondo de la parte superior marcada.
- Cada apartado tiene Editar historiales: editar origen, destino, importe, fecha y descripción; eliminar anula el efecto financiero mediante reversión auditada. No se añade método de pago porque es una distribución interna.
- Transacciones incluye el mismo historial, filtrado por cuenta y mes. Una transferencia entre dos apartados aparece en ambos historiales específicos y una sola vez en el historial general. No se suma a ingresos ni gastos.
- Según la respuesta del propietario, los tres apartados pueden elegirse sin crearlos todavía. Solo se materializan en la misma transacción SQL de la primera transferencia confirmada. Si falla por falta de dinero, no se guarda ningún apartado ni registro parcial.

No se crearon tablas, servicios ni nuevos cálculos de balances. Los registros anteriores se conservan. Las ayudas se adaptaron al acceso mediante Transferir fondos.

Bloque de pruebas: 50 ejecuciones conservadoras de 100. Todos los casos pasan en su última ejecución; se actualizó una expectativa de texto obsoleta y se repitió solo ese caso. Ver evidence/transfer-only/progress.json.

El propietario confirmó que el apartado se crea únicamente al confirmar la primera transferencia. Se conserva Crear nueva meta porque solo se pidió retirar los dos accesos superiores; se informó esta interpretación antes de continuar. Ese formulario define el objetivo con dinero inicial cero y conserva sin cambios el dinero y tipo de las metas anteriores. No permite financiar ni redistribuir fondos directamente.

Verificación final: 41 ejecuciones de código (incluida una repetición tras actualizar el texto esperado), una comprobación del paquete y ocho del artefacto real. Todos pasan en su última ejecución. TypeScript y ESLint sin errores; permanece la advertencia anterior de req sin usar. Compilación aprobada. Solo se prepara la versión privada; producción 109 se conserva hasta revisar este cambio.
