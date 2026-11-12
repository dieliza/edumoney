# IVU y contratistas — evidencia de validación

Datos exclusivamente ficticios. No se publican bases ni claves. Este bloque comprueba seis casos de lógica/almacenamiento y navegación/formularios iniciales en ambos simuladores; no representa todavía la captura completa de pagos y remesas en móvil.

| Evidencia | Android | iOS |
| --- | --- | --- |
| Oferta sin nombre ni descripción introducidos | [Captura](android/ivu-blank-offer.png) | [Captura](ios/ivu-blank-offer.png) |
| Proveedor sin nombre ni referencia introducidos | [Captura](android/contractor-blank-provider.png) | [Captura](ios/contractor-blank-provider.png) |
| Fuentes y vigencia | [Captura](android/ivu-source-and-validity.png) | [Captura](ios/ivu-source-and-validity.png) |
| Reapertura del titular | [Captura](android/obligations-reopened.png) | [Captura](ios/obligations-reopened.png) |
| Resultado | [JSON](android/result.json) | [JSON](ios/result.json) |

[Casos de lógica](logic-results.json) · [Recuento de diez casos](execution.json) · [Primer intento Android](android-first-result.json) · [Aviso Quickstep del primer intento](android-launcher-anr.png).

Se inspeccionaron los formularios vacíos en ambas plataformas, las fuentes iOS y la reapertura Android. Los formularios conservan elecciones estructurales como «Producto» y «Sin vínculo», sin datos financieros rellenados. El primer Android falló antes de crear el titular por el aviso del lanzador. La repetición aprobó sin que reapareciera: la rama de recuperación añadida quedó omitida, no se afirma haber reproducido y resuelto activamente el ANR.

iOS confirmó [cabecera cifrada y rechazo sin clave](ios/database-check.json), [reapertura con igual huella](ios/database-reopened-check.json) y exclusión de respaldo automático. Las capturas muestran solo partes visibles de formularios desplazables. Los comandos de Maestro son pasos de un recorrido, no casos adicionales.
