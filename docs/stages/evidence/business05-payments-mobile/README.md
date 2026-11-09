# Evidencia de pagos y depósitos móviles

Datos exclusivamente ficticios introducidos en la interfaz.

- `expected-ficticio.json`: valores esperados del caso; no son resultados medidos.
- `android-result.json`: ejecución Android aprobada y commits utilizados.
- `android-assertions.json`: comprobaciones de interfaz y estados observados.
- `android-payroll-calculation-unpaid.png`: cálculo preparado, todavía sin confirmar pago.
- `android-payroll-payment-confirmed.png`: importe neto y comprobante del pago ficticio.
- `android-payroll-deposit-partial.png`: $20 depositados, pendiente PR $34.91.
- `android-payroll-deposit-reconciled.png`: $54.91 depositados, pendiente PR cero.
- `android-payroll-payments-reopened.png`: un pago salarial y los mismos totales después de reiniciar.

El resultado iOS sigue pendiente de terminar. El primer intento falló al consultar la disponibilidad de un campo que aparece en la captura posterior; se amplió la espera. Un intento posterior de GitHub terminó sin crear trabajos. El intento vigente conserva las comprobaciones y reduce borrados innecesarios en campos vacíos.

[Informe, presupuesto y límites](../../NEGOCIO-05-PAGOS-MOVIL.md).
