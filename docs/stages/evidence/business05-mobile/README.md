# Evidencia móvil de empleados de nómina

Datos exclusivamente ficticios, creados mediante la interfaz, sin precargar el almacenamiento.

- `android-payroll-employee-{input,saved,reopened}.png`: Android API 35. Recorrido aprobado sin Wi-Fi ni datos móviles.
- `ios-payroll-employee-{input,saved,reopened}.png`: iPhone 17 Pro/iOS 26.4. Todos los comandos del recorrido completados; la ejecución de GitHub quedó cancelada durante la limpieza posterior, con los artefactos ya subidos.
- `android-result.json` e `ios-result.json`: commits, estado del recorrido y capturas.
- `ios-database-check.json` e `ios-database-reopened-check.json`: cabecera cifrada, rechazo de SQLite sin clave e igualdad de huella al reabrir. La exclusión de respaldo se confirmó en el registro de ejecución.
- `execution.json`: presupuesto y trazabilidad de los intentos.

Se verifica guardar y recuperar el salario $2,200.00 y la nota exacta `NOTA-FICTICIA-PERSISTE`. No son comprobantes de empleados reales ni validan las fichas de pagos y depósitos.

[Informe y límites](../../NEGOCIO-05-MOVIL.md).
