# Nómina — verificación móvil de pagos y depósitos

Trabajo en `negocio-05-pagos-movil`, sobre el seguimiento de empleados. Se respeta el máximo de 100 casos por bloque, incluidas repeticiones. No se modifica main ni se publica la aplicación.

## Alcance preparado

Recorrido con datos ficticios creados mediante la interfaz: titular y empleado, preparación de un cálculo, confirmación manual de un pago y dos depósitos parciales por Hacienda. Se comprueban importes y persistencia al reiniciar. El perfil contributivo/patronal incompleto conserva sus datos pendientes; no se inventan tasas ni se exige aprobación de CPA para registrar el pago.

El caso usa bruto $2,200.00, retención PR $54.91, Seguro Social $136.40, Medicare $31.90 y SINOT $6.60; neto real registrado $1,970.19. Son importes ficticios introducidos para verificar el registro, no una tasa o liquidación asignada a un patrono real. Dos depósitos de $20.00 y $34.91 deben liquidar la partida PR sin crear otro pago salarial.

## Verificaciones locales

Seis casos relevantes aprobados en una sola ejecución: calcular sin pagar, dos pagos/depósito parcial, validación y duplicados de depósitos, corrección auditada, reapertura SQLite y retención FICA insuficiente. Las otras 30 pruebas del archivo se omiten deliberadamente. TypeScript y ESLint aprobados.

## Procedimiento móvil

- Se extrae el alta de titular/empleado ya verificada a un subflujo reutilizable, sin cambiar sus acciones.
- Nuevo escenario `payroll-payments` en CI, que omite la suite general.
- Se reutilizan los paquetes de aplicación compilados en 42665307671 (Android) y 42664986263 (iOS). El código de aplicación no cambia respecto de `3f03c59`.

Los recorridos están iniciados; sus resultados y capturas se añadirán al terminar. No se declaran aprobados por haber sido enviados a CI.

### Resultado Android

[42671267051](https://github.com/dieliza/edumoney/actions/runs/42671267051): recorrido aprobado sin conexión de la aplicación, usando el APK de `3f03c59` y procedimiento `406e836`. Las capturas confirman un pago, neto $1,970.19, depósitos PR $54.91 y pendiente $0.00 después de reiniciar.

El primer intento iOS (42671278977) falló al consultar la disponibilidad del campo de empleado, que sí aparece en la captura posterior; se ajustó la espera. La ejecución 42673444171 terminó sin crear trabajos y no ejecutó otro caso. El nuevo intento usará menos pulsaciones de borrado, manteniendo datos y comprobaciones.
