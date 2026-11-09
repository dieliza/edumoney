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

Ambos recorridos finales están aprobados. Se conserva evidencia de los intentos fallidos y sus correcciones.

### Resultado Android

[42671267051](https://github.com/dieliza/edumoney/actions/runs/42671267051): recorrido aprobado sin conexión de la aplicación, usando el APK de `3f03c59` y procedimiento `406e836`. Las capturas confirman un pago, neto $1,970.19, depósitos PR $54.91 y pendiente $0.00 después de reiniciar.

El primer intento iOS (42671278977) falló al consultar la disponibilidad del campo de empleado, que sí aparece en la captura posterior; se ajustó la espera. La ejecución 42673444171 terminó sin crear trabajos y no ejecutó otro caso. Se redujeron las pulsaciones de borrado, manteniendo datos y comprobaciones.

### Diagnóstico de navegación iOS

42674536726 confirmó el pago y los dos depósitos con los importes esperados antes de reiniciar. Al volver a abrir, la automatización pulsó la pestaña Aprende en lugar del enlace de Nómina; la captura identifica esa pantalla, por lo que ese intento no prueba la persistencia posterior. Se centra el enlace fuera de la barra inferior, se comprueba el encabezado de Nómina y se permiten dos recuperaciones limitadas a navegación, sin registrar de nuevo operaciones. La repetición 42678945990, procedimiento `9dbab0c`, terminó aprobada y solo necesitó un intento de navegación.


## Resultado final iOS

[42678945990](https://github.com/dieliza/edumoney/actions/runs/42678945990): trabajo completo aprobado. Tras reiniciar, la interfaz conserva un pago, bruto $2,200.00, neto $1,970.19 y depósitos PR $54.91, pendiente $0.00. Las obligaciones sin información suficiente siguen pendientes.

El control posterior verifica cabecera cifrada, rechazo de SQLite sin clave, exclusión de respaldo del sistema y el mismo SHA-256 antes y después de otra reapertura. Esto comprueba el cifrado y la persistencia del caso; no certifica reglas contributivas ni emisión oficial.

## Cierre y presupuesto

Diez casos principales ejecutados: seis unitarios aprobados y cuatro recorridos móviles (dos intentos iOS fallidos, Android aprobado e iOS final aprobado). Una ejecución sin trabajos no ejecutó casos. No se ejecutó la suite completa. La recuperación limitada de navegación no volvió a crear operaciones; el intento final no necesitó repetirse. TypeScript y ESLint aprobados antes de los ajustes exclusivos del procedimiento y documentación.

Archivos: subflujo `.maestro/business-payroll-setup.yaml`, recorrido `.maestro/business-payroll-payments.yaml`, llamada desde `.maestro/business-payroll.yaml`, escenario en `.github/workflows/planilla-validation.yml`, este informe y [evidencia](evidence/business05-payments-mobile/README.md). Sin cambios de código de aplicación ni dependencias en este bloque.

Quedan para otro bloque la interacción nativa del formulario de tasas patronales y la hoja de compartir exportaciones. La emisión oficial requiere las validaciones de formato, acumulados, depósitos y trámites ya documentadas. No se modificó main ni se publicó.
