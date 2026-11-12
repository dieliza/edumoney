# Negocio — revisión comercial y exportación móvil

La revisión del gasto se conserva tras reiniciar en ambos simuladores. Android recibió y validó JSON/CSV; iOS aprobó el recorrido con apertura/cancelación de ambos menús de compartir. **La ejecución Android terminó con fallo en su última aserción de visibilidad**, después de validar los archivos. El desplazamiento de esa aserción está corregido en 4a2e38c, sin reejecución; no se declara CI Android aprobado.

## Datos y resultados

Datos exclusivamente ficticios desde formularios en blanco: un gasto de $55, corregido a 50 % comercial, reparto $30/$25, nota exacta REVISION-FICTICIA-50 y revisión CPA «Requiere corrección». Tras reiniciar, gasto $55 y parte comercial $27.50, con nota y reparto conservados. No se exige CPA para guardar ni calcular; la clasificación no afirma deducibilidad.

| Plataforma | Resultado comprobado | Ejecución |
| --- | --- | --- |
| Android emulado, sin Wi-Fi ni datos | Revisión persistente; JSON/CSV leídos por receptor local sin red. Ambos suman 5500 centavos de gasto, 2750 comerciales y 2750 personales, dos filas con el mismo movimiento. Última aserción fallida al volver al formulario | [43124881691](https://github.com/dieliza/edumoney/actions/runs/43124881691), job 130874326198, artefacto 13902618193 |
| iOS simulado | Recorrido aprobado: revisión persistente, abrir/cancelar JSON y CSV, volver al formulario y verificación de cifrado | [43125832018](https://github.com/dieliza/edumoney/actions/runs/43125832018), job 130877541772, artefacto 13902979479 |

Se inspeccionaron las capturas de revisión reabierta y archivos recibidos Android, así como revisión y menús JSON/CSV iOS. Las pantallas son desplazables; las capturas no muestran todos sus campos simultáneamente. Android verificó además el porcentaje, nota, estado changes, pendientes y ausencia de imágenes no seleccionadas en JSON. El receptor interpreta solo los datos simples de este escenario, no es un importador general de CSV ni parte de la aplicación.

En iOS se comprobó cabecera cifrada, rechazo de lectura SQLite sin clave, exclusión de respaldo automático y la misma huella al reabrir: 433b37abe65863c65edff2665e3f73a53cb124a85db2612a15ee1a49dc0d0852, 569344 bytes. No se publican bases ni claves.

## Automatización y correcciones

Procedimientos 15fcca2 → be399b1 → c09c67d, aplicaciones de 42948943240 con código 905d96f. No cambió el código de aplicación.

- 43123115399 se canceló al detectar un selector que debía admitir el mensaje de dos líneas del receptor. Android omitió el paso nativo; iOS se detuvo durante el arranque del simulador, sin casos XCTest iniciados. Se cuentan conservadoramente ambos intentos.
- 43123264346 falló en ambos simuladores al sustituir la nota: el cursor quedó dentro del texto largo y la automatización dejó «-PORCIENTO». Las aserciones exactas lo rechazaron. Importes, porcentaje y reparto se habían conservado. c09c67d usa una nota inicial corta para reemplazarla completa, sin relajar las aserciones ni modificar datos de la aplicación.
- El Android repetido validó los dos archivos y volvió al formulario. Su último extendedWaitUntil esperaba ver el botón CSV sin desplazar; la captura muestra el botón debajo de la zona visible. 4a2e38c sustituye esa espera por scrollUntilVisible. **Este último ajuste no se reejecutó**, para cerrar el presupuesto del bloque.
- El iOS repetido aprobó con c09c67d; 146 comandos completados y dos ramas Android omitidas. Solo inició testHttpServer, sin suites internas adicionales del controlador.

## Pruebas y presupuesto cerrado

**Diez casos conservadores:** dos casos de código aprobados; dos intentos detenidos; cuatro recorridos de aplicación, incluidos los tres que terminaron con fallo de automatización; dos casos del controlador XCTest iOS. Los pasos de Maestro no se cuentan como casos independientes. No ejecutar más casos de este bloque ni reiniciar este presupuesto para repetirlos.

Los casos seleccionados de tests/business-ledger.test.ts verificaron corrección con historial/control de versión y filtrado por titular/proyecto con protección de fórmulas CSV. Dieciocho casos omitidos, sin suite general. ESLint y TypeScript pasaron localmente y en los trabajos Android.

## Archivos y pendientes

Se añadieron .maestro/business-review-export.yaml, selección exclusiva del escenario en .github/workflows/planilla-validation.yml y BusinessValidator.java; se amplió el receptor de pruebas y su instalación para JSON comercial. No se incluye ese receptor en EduMoney. Se añadieron informe, capturas y resultados; no se cambiaron reglas contributivas ni funciones financieras.

[Capturas, resultados y presupuesto](evidence/business-review-export/README.md). QA-NEGOCIO-02 conserva la comprobación pendiente del último desplazamiento de automatización Android. No afecta el cálculo ni bloquea el uso de la exportación. Quedan comprobantes seleccionados/imágenes, destinos externos iOS y teléfonos físicos. Siguen pendientes los recorridos IVU/contratistas y panel/escenarios. Main permanece intacto; no se publica.
