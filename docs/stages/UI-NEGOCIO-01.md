# UI-NEGOCIO-01 — Estados de recibos en español

Rama `negocio-estados-recibos`. Mejora implementada en el código de la ficha y los botones de recibos de Negocio. No se modifica main ni se publica.

## Cambio

`BusinessLedgerScreen.tsx` reutiliza las etiquetas españolas existentes de `statusOptions`: Recibido, Pendiente, Corregido y No aplica. La ficha y su botón utilizan el mismo formateador; Retirado mantiene prioridad si el documento está retirado. Un estado no reconocido se presenta como Estado por confirmar, sin exponer un código técnico ni asumir que el documento fue recibido.

El cambio es de presentación. No modifica códigos guardados, referencias, importes, vínculos, esquema ni cálculo contributivo. No añade dependencias.

`.maestro/business-ledger.yaml` ahora exige Recibido en el botón antes/después de reiniciar y en el estado de la ficha. Estas nuevas aserciones están preparadas; no se han ejecutado en este bloque.

## Verificación

- Tres casos existentes seleccionados de documentos aprobados una vez: corrección con auditoría/revisión pendiente, retiro/restauración con evidencia conservada y reapertura con imagen/vínculos. Veintidós casos omitidos; no se ejecuta la suite completa.
- TypeScript y ESLint aprobados. Sintaxis YAML comprobada.
- Expo SDK 58 consultado y empaquetado local Hermes de iOS y Android aprobado, sin conexión del CLI. Son paquetes JavaScript, no nuevas aplicaciones APK/IPA ni una verificación visual nativa.
- [Registro de ejecución y huellas de los paquetes](evidence/receipt-status-labels/execution.json). Total de casos ejecutados: 3, inferior al límite de 100.

## Estado al cierre del bloque de código

La corrección está implementada, pero su comprobación visual en una nueva compilación instalada sigue pendiente. Las capturas de los recorridos anteriores muestran `received` y documentan el problema previo; no prueban este texto corregido.

El código de aplicación cambia respecto de `3f03c59`: no reutilizar aquellos binarios mediante `artifact_run` para comprobar las nuevas etiquetas. Se requieren compilaciones que incorporen este cambio. Los recorridos financieros previos conservan su alcance y versión históricos.

[Incidencia y evidencia anterior](../ISSUES.md) · [Calidad y pendientes](../QUALITY_RELEASE.md).


## Seguimiento visual completado

Las nuevas compilaciones Android/iOS verificaron Recibido en botón y ficha, también tras reiniciar. [Resultados, capturas y presupuesto final de siete sobre diez](UI-NEGOCIO-01-VISUAL.md). Esta verificación posterior reemplaza el estado pendiente del bloque de código, sin atribuir resultados nuevos a las capturas antiguas.
