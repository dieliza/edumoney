# Negocio — registros manuales de IVU externo

## Alcance

EduMoney anota cobros y remesas realizados fuera de la aplicación; no cobra al comprador, mueve dinero ni radica en SURI. Se mantienen separados simulación, cobrado declarado, remitido declarado y presentación de formulario. No se instala pasarela ni se conecta un banco.

Este bloque comprueba con datos ficticios el flujo de IVU. No cambia código de aplicación, reglas ni fecha global del catálogo. Las fuentes se contrastaron en [la validación previa](NEGOCIO-OBLIGACIONES-VALIDACION.md). No se asume que una tasa sea aplicable por el nombre de la oferta ni se exige un CPA para simular.

## Escenario

Se crea un titular ficticio y una oferta con nombre ficticio, vigencia desde octubre de 2026 y escenario básico elegido expresamente. La clasificación, certificado, canal y destino permanecen pendientes: los números de simulación no constituyen una determinación legal de tasa o responsable.

1. Base ficticia $1,000: simulación estatal $105 y municipal $10, total $115; responsable del escenario pendiente. Los campos de cobro real permanecen sin introducir hasta el registro manual.
2. Introducir manualmente un cobro externo declarado de $115, componentes $105/$10 y responsable real «Este titular». El resumen debe mostrar remitido $0 y diferencia $115.
3. Anotar remesa estatal externa de $105 con fecha y referencia; el resumen debe mostrar diferencia $10.
4. Anotar remesa municipal externa de $10 para Ponce, también con confirmación manual; diferencia de registros $0, expresamente no presentada como deuda contributiva final.
5. Guardar presentación SC 2915 consolidada como pendiente, sin importe ni confirmación. No debe sumar otro pago ni quedar presentada al registrar las remesas.
6. Reiniciar y verificar cobro, ambas remesas, notas, diferencia y presentación pendiente.

Confirmado significa declarado por el usuario, sin certificación bancaria o de Hacienda. No se suben comprobantes reales. Las fechas base conservan su indicación pendiente de verificar; no se confirma un vencimiento oficial en este escenario.

## Verificaciones iniciales

Dos casos seleccionados de tests/business-obligations.test.ts aprobados, 38 omitidos: importes desconocidos no se convierten en cero y los cobros mantienen la clasificación histórica al cambiar la oferta. No se repiten los casos anteriores de contratistas, remesas o auditoría. ESLint y TypeScript pasaron.

## Recorridos móviles

Se usa exclusivamente `business-manual-ivu` en la rama `negocio-ivu-manual-movil`. Se reutilizan las aplicaciones de [42948943240](https://github.com/dieliza/edumoney/actions/runs/42948943240), código de aplicación `905d96f`. No se modifica la aplicación ni se recompila; la suite general queda omitida y el controlador iOS se limita a `testHttpServer`, una invocación por trabajo.

La [ejecución inicial 43142494462](https://github.com/dieliza/edumoney/actions/runs/43142494462), procedimiento `4c471b0`, falló en ambos sistemas únicamente al buscar el mes después de reiniciar. Las comprobaciones anteriores de importes y presentación pendiente habían pasado. El campo estaba debajo de la vista inicial, pero la búsqueda usaba `UP`. `343a062` cambia esa segunda búsqueda a `DOWN`, sin cambiar las aserciones financieras ni el código de aplicación. Se conservan las capturas del fallo.

| Plataforma | Ejecución corregida | Resultado |
| --- | --- | --- |
| Android | [43144248581](https://github.com/dieliza/edumoney/actions/runs/43144248581) | Aprobado: 214 comandos completados y 5 omitidos; cobro, remesas, notas y presentación pendiente conservados después del reinicio |
| iOS | [43145093757](https://github.com/dieliza/edumoney/actions/runs/43145093757) | Aprobado: 219 comandos completados y 3 omitidos; registros conservados después del reinicio |

Las capturas originales de Android revisadas muestran la diferencia $10 tras la remesa estatal, el resumen $115/$115 y diferencia $0 al reabrir, y la remesa municipal con presentación todavía pendiente. Cada captura cubre solo la porción visible; las aserciones del recorrido verifican también los elementos que requieren desplazamiento. La referencia del cobro no aparece en su tarjeta: no se afirma una comprobación visual de ese campo ni de las fechas de confirmación al reabrir.

iOS también muestra, en sus capturas originales revisadas `ivu-summary-reopened.png` e `ivu-records-reopened.png`, cobrado $115, remitido $115, diferencia $0 y SC2915 pendiente sin otro pago. Un único caso `testHttpServer` inició en la repetición. La base cifrada de 569344 bytes rechazó SQLite sin clave; la huella antes/después de reabrir coincidió: `f98d92d9596b10933548a8a1ea031c0e7d7102c8732393ae550b9f59ac8ad3ff`. El cierre de `ios-smoke.sh` verificó exclusión de respaldo automático.

**Conteo final: 8 casos**: 2 de código aprobados, 2 recorridos iniciales fallidos por desplazamiento, 2 recorridos corregidos aprobados y 2 casos del controlador iOS aprobados. No se lanzaron suites generales. [Evidencia y capturas](evidence/business-manual-ivu/README.md). Son pruebas de emulador/simulador; no sustituyen revisión en teléfonos físicos.

## Archivos y límites

- `.maestro/business-manual-ivu.yaml`: recorrido con formularios inicialmente vacíos, simulación, registros externos separados y reapertura.
- `.github/workflows/planilla-validation.yml`: escenario selectivo, reutilización de binarios y controlador iOS limitado.
- Este informe y `evidence/business-manual-ivu/`: resultados y capturas, sin bases de datos, claves, aplicaciones ni documentos reales.

ESLint y TypeScript pasaron. No se repiten pruebas de código por cambios posteriores exclusivamente de automatización y documentación. Pendientes: casos especiales, relevos, plataformas de venta y comprobación en teléfonos físicos. QA-NEGOCIO-02, sobre la visibilidad final de una exportación CSV, sigue pendiente y no se cierra con este recorrido.

Main permanece intacto. No se publica, radica ni ejecuta ningún pago.
