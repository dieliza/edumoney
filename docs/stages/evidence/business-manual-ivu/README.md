# Evidencia — registro manual de IVU externo

Datos completamente ficticios. [Informe del bloque](../../NEGOCIO-IVU-MANUAL-MOVIL.md).

Android corregido: [ejecución 43144248581](https://github.com/dieliza/edumoney/actions/runs/43144248581), aprobado. iOS corregido: [ejecución 43145093757](https://github.com/dieliza/edumoney/actions/runs/43145093757), aprobado.

En `android/`, las capturas originales conservan la simulación con clasificación pendiente, cobro separado de remesas, remesa estatal, ambas remesas, formulario pendiente y registros reabiertos. Se revisaron visualmente `ivu-state-only.png`, `ivu-summary-reopened.png` e `ivu-records-reopened.png`. Los comandos comprueban los demás elementos mediante desplazamiento. Los conteos de comandos no equivalen a casos de prueba.

Los dos primeros resultados y sus capturas de diagnóstico documentan una búsqueda en dirección incorrecta al reabrir; no prueban pérdida de datos. La corrección solo cambia el desplazamiento del segundo campo de mes.

La tasa básica se eligió para una simulación; clasificación, certificado, canal y destino quedan pendientes. Los importes confirmados son declaraciones manuales del usuario, sin verificación bancaria o de Hacienda. Presentación pendiente no agrega importe. Diferencia de registros cero no significa deuda contributiva final cero. No se cobra, transfiere ni radica desde EduMoney.

`logic-results.json` conserva los dos casos seleccionados y las verificaciones estáticas. No se incluyen bases de datos, claves, binarios ni comprobantes reales.

En `ios/` se conservaron siete capturas originales y las comprobaciones de cifrado y reapertura. Se revisaron visualmente `ivu-summary-reopened.png` e `ivu-records-reopened.png`. `execution.json` cuenta los ocho casos, incluidos fallos iniciales y controladores. Ambos recorridos corregidos aprobaron.
