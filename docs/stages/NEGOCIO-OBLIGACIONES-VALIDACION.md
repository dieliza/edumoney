# Negocio — validación de IVU y contratistas

## Alcance de este bloque

Contraste de seis fuentes oficiales y selección de cálculos/almacenamiento local. El recorrido móvil comprueba navegación, fuentes/vigencia, apertura y cancelación de formularios en blanco y reapertura del titular. No representa todavía el ingreso completo de pagos, relevos, cobros o remesas por la interfaz.

No cambia código de aplicación, reglas, tasas ni la fecha global del catálogo PR-NEGOCIO-2026.1 (2026-11-09). La consulta de este informe es 2026-11-11 en Puerto Rico (2026-11-12 UTC) y abarca solo las fuentes siguientes; no sustituye una revisión completa de todas las reglas. No se modifica main ni se publica.

## Fuentes contrastadas

| Fuente oficial | Punto contrastado y alcance |
| --- | --- |
| [480.6SP 2026, revisión 06.26](https://hacienda.pr.gov/sites/default/files/documentos/480.6sp_2026_informativo.pdf) | Primeros $500 por año natural sin retención; régimen ordinario del 10 %; relevo parcial del 6 % requiere certificado aplicable. Los pagos y retenciones se informan por separado. La opción por sucursales requiere análisis específico y no se presume en el caso sencillo. Documento informativo, no utilizable para rendir. |
| [CC RI 19-10](https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-19-10-cc-ri-19-10) | Fecha base de depósito: día 15 del mes siguiente; planilla trimestral: fin del mes siguiente al trimestre. La alternativa trimestral exige retención menor de $2,500 y cumplimiento de sus condiciones; no se aplica automáticamente. |
| [BI RI 25-05](https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-25-05-bi-ri-25-05) | Distinguir la obligación general, excepciones con documentación y pagos excluidos; no exigir indistintamente el mismo relevo a todos. |
| [Modelo SC 2915 informativo](https://hacienda.pr.gov/sites/default/files/documentos/sc_2915_rev._14_mar_25_informativo.pdf) | Bases estatales y municipal separadas, incluyendo escenarios de 10.5 %, 6 % y 4 %. El nombre del archivo conserva marzo de 2025: su uso en julio de 2026 se contrasta con CC RI 26-13, no se deduce del nombre. No utilizar este PDF para rendir. |
| [CC RI 26-13](https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-26-13-cc-ri-26-13) | Consolidación desde julio de 2026 para 73 municipios. Bayamón, Carolina, Guaynabo, Mayagüez y San Juan mantienen procedimiento municipal separado. Que SURI no calcule ese componente para esos municipios no significa exención del impuesto municipal. |
| [Planilla mensual de IVU](https://hacienda.pr.gov/node/1820) | Fecha base día 20; los avisos, feriados y particularidades del período deben confirmarse antes de tratar la fecha como definitiva. |

No se afirma ausencia de toda enmienda futura, elegibilidad de una transacción concreta ni presentación oficial. Los supuestos y pendientes del simulador permanecen visibles y no bloquean por exigir un CPA.

## Pruebas de lógica y almacenamiento

Selección inicial de tests/business-obligations.test.ts: cinco aprobadas, 35 omitidas, sin suite general:

1. Caso ordinario, mismo pagador legal/proveedor/año, servicios PR y sin relevo: $300 sin retención y $400 con $20 en el segundo pago.
2. IVU cobrado por titular y facilitador separados; remesas estatal/municipal confirmadas; presentación pendiente no agrega otro pago ni crea movimientos financieros.
3. Depósito pendiente no figura pagado; importe desconocido no confirma una remesa ni se admite registrar radicación como otro pago.
4. Reapertura desde archivo SQLite conserva todos los registros y auditoría.
5. Vincular cobro/pago a registros financieros conserva exactamente dos movimientos y rechaza repartos que excedan sus importes.

Se aprobó además un caso seleccionado de escenario básico con municipio de trámite separado: sobre $1,000, $105 estatal y $10 municipal; total $115. Esto es un escenario de prueba con clasificación asumida, no una determinación de tasa por nombre de oferta.

ESLint y TypeScript pasaron. El presupuesto se cerró en diez casos, incluyendo el primer fallo Android; los casos anteriores de revisión/exportación no se repiten ni se reinicia su contador.

## Resultados móviles

| Plataforma | Procedimiento y ejecución | Resultado |
| --- | --- | --- |
| iOS simulado | 33ccc43; [43130563956](https://github.com/dieliza/edumoney/actions/runs/43130563956), job 130893369891, artefacto 13904488775 | Aprobado: 75 comandos completados; fuentes/vigencia, abrir/cancelar oferta y proveedor en blanco, reabrir titular |
| Android emulado, Wi-Fi y datos desactivados | 48121a6; [43131299392](https://github.com/dieliza/edumoney/actions/runs/43131299392), job 130895829167, artefacto 13906010861 | Aprobado: 62 comandos completados y ocho ramas omitidas; mismo alcance |

Escenario exclusivo business-obligations-navigation, con aplicaciones de 42948943240 y código 905d96f, sin cambios de aplicación. La suite general se omitió y solo inició un caso testHttpServer iOS, sin las pruebas internas adicionales de clasificación.

Se inspeccionaron las capturas de oferta/proveedor vacíos de ambas plataformas, las fuentes iOS y la reapertura Android. No se guardaron ofertas, proveedores, pagos ni remesas desde este recorrido; únicamente el perfil de titular ficticio. Las pruebas de SQLite cubren los registros financieros y su reapertura, sin afirmar que se hayan capturado por la interfaz móvil.

En iOS se confirmó cabecera cifrada, rechazo de SQLite sin clave, exclusión de respaldo automático e igual huella al reabrir: 24094b0eac6d37d53e663ddcbace4e7b958aafaf1b2d93a5f3922e64f6874001, 569344 bytes. Las bases y claves no se publican.

## Primer intento Android y recuperación de prueba

El Android inicial de 43130563956, job 130893370147, artefacto 13904084154, falló en la bienvenida: el aviso «Quickstep isn't responding» del lanzador tapó EduMoney. La captura identifica Quickstep; no se había entrado en Negocio ni creado registros financieros.

48121a6 permite reconocer solo ese aviso Android, cerrar únicamente el proceso señalado por el diálogo y exigir después la bienvenida exacta. No se ignoran avisos de EduMoney ni se relajan las aserciones de navegación. La repetición aprobó sin que reapareciera el aviso; las dos condiciones internas Quickstep quedaron omitidas. El manejo del aviso está preparado, pero no se afirma haber reproducido su recuperación activa. iOS aprobado no se repitió.

## Presupuesto y archivos

**Diez casos ejecutados conservadoramente:** seis casos de código aprobados, un intento Android fallido, un recorrido Android aprobado, un recorrido iOS aprobado y un caso del servidor XCTest. No se ejecutan más casos de este bloque. Los pasos Maestro y las ramas omitidas no son casos adicionales. TypeScript y ESLint pasaron localmente y en los trabajos Android.

Se añadió .maestro/business-obligations-navigation.yaml, su escenario exclusivo en .github/workflows/planilla-validation.yml, este informe y evidencia. No fue necesario corregir funciones financieras ni el catálogo.

[Capturas, resultados y recuento](evidence/business-obligations-validation/README.md).

## Próximo bloque

Introducir y reabrir desde la interfaz móvil los pagos de contratistas $300/$400 y los cobros/remesas de IVU, con importes realmente retenidos/remitidos separados del simulador. También quedan relevos, casos incompletos y dispositivos físicos. Este bloque no acredita emisión oficial ni radicación. QA-NEGOCIO-02 del bloque de exportación sigue pendiente; aquí no se repitió ese escenario ni se reinició su contador. Main permanece intacto y no se publica.
