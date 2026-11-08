# Revisar Mi dinero — Etapa 3

Este recorrido corresponde a una compilación nativa de prueba para iOS/Android. La web continúa mostrando la demostración de diseño;
no permite introducir registros financieros. Las capturas de las pruebas usan importes ficticios.

1. Toca **Abrir Mi dinero**. El libro personal empieza vacío y no usa los importes de ejemplo de las demás pestañas.
2. En **Añadir ingreso**, escribe el importe efectivamente recibido, fecha, descripción y método. Puedes elegir Manual,
   Extraordinario o Recurrente. El bruto y la retención son opcionales; dejarlos vacíos conserva su estado desconocido.
3. En un ingreso recurrente, guardar confirma el primer cobro y prepara la siguiente fecha. Los siguientes se suman únicamente
   al tocar **Confirmar cobro** cuando llegue su fecha. Pausar conserva los cobros anteriores.
4. En **Registrar gasto**, elige la categoría y el método. Si fue una compra a crédito, selecciona **Tarjeta de crédito**.
   El pago posterior se registra como **Pago de tarjeta o deuda**, para que la compra no cuente dos veces como gasto.
5. Usa **Registrar transferencia, préstamo o pago** para distinguir movimientos entre tus cuentas, dinero prestado y pagos de deuda.
6. En **Categorías**, crea o cambia categorías y define un límite para el mes seleccionado (AAAA-MM).
   Un límite cero es distinto de quitar el presupuesto. Archivar una categoría conserva su historia.
7. En **Historial**, busca una descripción o filtra tipo, categoría, método, fechas y estado. Toca un movimiento para corregirlo
   con motivo o confirmar su eliminación. Desde **Eliminados** puedes restaurarlo. Su identificador y las revisiones se conservan.
8. Si aparece una coincidencia de fecha, importe y descripción, revisa el historial. Solo conserva otra operación si realmente
   fueron dos movimientos distintos. Reintentar el mismo guardado no crea otro registro.

El disponible es una estimación del flujo del mes desde cero, no un saldo bancario. Incluye las fechas futuras introducidas
manualmente en ese mes. Marcar un movimiento para el contable no confirma que sea deducible.
La preparación de facturas, deudas, metas y expediente contributivo se realiza en las etapas siguientes.
