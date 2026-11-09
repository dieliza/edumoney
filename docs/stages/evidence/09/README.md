# EduMoney — Para mi contable

Capturas de las aplicaciones de prueba con **datos ficticios**. Son evidencias de revisión, no una aplicación interactiva ni una planilla.

El recorrido registra un depósito salarial ficticio de **$900.00**, conserva por separado **$1,000.00 bruto y $100.00 retenidos**, marca el movimiento para revisión y lo vincula a una informativa ficticia del mismo año. La informativa no crea otro ingreso.

| Comprobación | Android | iPhone |
| --- | --- | --- |
| Resumen inicial y pendientes | [Abrir](android-summary-pending.png) | [Abrir](ios-summary-pending.png) |
| Informativa conciliada con el ingreso original | [Abrir](android-reconciliation.png) | [Abrir](ios-reconciliation.png) |
| Contenido revisado antes de compartir | [Abrir](android-export-preview.png) | [Abrir](ios-export-preview.png) |
| Expediente conservado después de reiniciar | [Abrir](android-reopened.png) | [Abrir](ios-reopened.png) |
| Conciliación en tema oscuro | [Abrir](android-dark.png) | [Abrir](ios-dark.png) |

Las diferencias de bruto, retención y neto son cero en este ejemplo. El perfil y los comprobantes faltantes permanecen pendientes; no se inventan datos para completar el expediente. La marca comercial o mixta no valida deducibilidad.

La vista previa no envía archivos. JSON/CSV solo se comparten si el usuario confirma el contenido y elige un destino en el diálogo del dispositivo. Perfil e imágenes se excluyen por defecto. Las pruebas de servicios comprueban la limpieza del archivo temporal y la ausencia de envíos automáticos; el recorrido mostrado llega hasta la vista previa.

[Guía de uso](../../../USAR_PARA_MI_CONTABLE.md) · [Arquitectura, archivos y pruebas](../../09.md)

## Resultados

175 pruebas de lógica/SQLite y servicios, TypeScript, ESLint y 3 recorridos de navegador aprobados. [iOS y Android aprobados](https://github.com/dieliza/edumoney/actions/runs/42594412747), con Android sin Wi-Fi/datos.

En iOS se comprobaron base cifrada, rechazo de SQLite sin clave, huella estable tras reabrir y exclusión de backup. [Resultados de cifrado](cipher-checks.json). Aplicación validada: `733cdc81336bfd16efea66d833dab5ffbd7eed4b`.

Compartir con aplicaciones externas concretas requiere validación en dispositivos reales; estas pruebas no enviaron información a terceros. No se modificó main ni se inició preparación de planillas.
