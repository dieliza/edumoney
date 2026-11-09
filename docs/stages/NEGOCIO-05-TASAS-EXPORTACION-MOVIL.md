# Nómina — tasas patronales y exportación móvil

Rama `negocio-05-tasas-exportacion-movil`. Sin cambios de código de aplicación respecto a `3f03c59`; se reutilizan las compilaciones Android 42665307671 e iOS 42664986263. No se modifica main ni se publica.

## Resultados comprobados

Las tasas ficticias y su nota se conservan al reiniciar en Android e iOS: SINOT 0.30%, desempleo PR 3.40%, crédito FUTA 5.40%, reducción FUTA 0.00% y CFSE 1.50%. Fuente `FUENTE-FICTICIA-TASAS-2026`; aplicabilidad pendiente en todas las agencias. No son tasas atribuidas a un patrono real. Se comprueba que guardar tasas no crea un pago.

Android comparte CSV y PDF con un receptor desechable local, que comprueba MIME, cabecera/sección del CSV y firma PDF, sin permiso de Internet ni almacenamiento persistente. [Ejecución aprobada 42688455929](https://github.com/dieliza/edumoney/actions/runs/42688455929), procedimiento `9eaa5e8`. Se vuelve a Nómina después de cada recepción. El receptor se compila e instala solo en el emulador, no forma parte de EduMoney.

iOS [42692090977](https://github.com/dieliza/edumoney/actions/runs/42692090977) aprobado, procedimiento `b21c1d1`: nombres CSV y PDF visibles en los popovers nativos, cierre por región exterior y desaparición del menú comprobada después de cada formato. Sin destinatarios ni copias seleccionadas. El control posterior confirma cabecera cifrada, rechazo de SQLite sin clave, exclusión del respaldo del sistema y hash de base idéntico al reabrir.

Plataformas verificadas: Pixel 6 emulado, Android API 35, e iPhone 17 Pro simulado con iOS 26.4. No sustituye la revisión en dispositivos físicos.

## Alcance y límites

Todos los datos se introducen mediante formularios reales, sin precargar la base. Los seguimientos breves de exportación crean únicamente un titular ficticio, sin empleados ni pagos; prueban disponibilidad e interacción con archivos vacíos de movimientos. El caso de lógica seleccionado verifica también contenidos de pagos confirmados, lectura del PDF y minimización de identidad. El registro salarial y los depósitos móviles ya se comprobaron en el bloque anterior.

El receptor Android únicamente lee la URI compartida en memoria, con límite de 1 MiB, y no tiene permisos. iOS abre y cancela los diálogos del sistema sin destinatario. No se afirma entrega a terceros, emisión oficial ni radicación. La validación oficial del formato y de los trámites Hacienda/SSA permanece pendiente; el cálculo autónomo no exige aprobación de CPA.

## Diagnósticos y correcciones

| Ejecución | Resultado y evidencia |
| --- | --- |
| 42684408082 Android | Tasas reabiertas aprobadas; selector sin aplicación receptora. Se instala receptor local de prueba. |
| 42684414704 iOS | Todos los valores reabiertos aprobados; botón CSV cubierto por encabezado fijo. Se corrige desplazamiento del procedimiento. |
| 42686391208 Android | Cancelada durante lint/TypeScript para corregir comillas de cabecera en el receptor; ningún caso ejecutado. |
| 42686526379 Android | Tasas aprobadas y CSV leído correctamente. La comprobación falló porque Android abrió directamente el único receptor, sin selector. Se admite esa variante. |
| 42687600566 iOS | Fallo de XCTest al pedir captura antes de entrar en Nómina; exportaciones no alcanzadas. `Failed to get screenshot: Timed out while requesting screenshot.` Se repite solo el recorrido breve. |
| 42688455929 Android | Exportaciones CSV y PDF aprobadas, lectura local verificada y retorno a Nómina. |
| 42689916331 iOS | CSV abierto; el selector Close no existe en el popover. Se pulsa fuera y se verifica la desaparición del menú. |
| 42692090977 iOS | CSV/PDF abiertos y cancelados; controles de cifrado/reapertura aprobados. |

## Pruebas y presupuesto

Seis casos unitarios seleccionados aprobados una vez: cálculo SS/Medicare con tasas explícitas, FUTA incompleto, vigencia, aplicabilidad desconocida, límites de tasas y contenido mínimo CSV/PDF. Otras 30 pruebas omitidas; no se ejecuta suite completa. TypeScript y ESLint aprobados. YAML y sintaxis del instalador comprobados.

Trece casos de EduMoney ejecutados, incluidas repeticiones: seis unitarios aprobados y siete recorridos móviles (cinco intentos fallidos diagnosticados y dos seguimientos finales aprobados). Se incluyen además conservadoramente 28 casos internos XCTest observados en cuatro intentos iOS (seis comprobaciones del controlador y su servidor por intento). Total conservador: 41, inferior a 100. No quedan ejecuciones activas. La ejecución sustituida no inició casos. No se repiten pruebas de lógica ya aprobadas.

## Archivos y evidencia

Nuevos recorridos `.maestro/business-payroll-policy-export.yaml` y `.maestro/business-payroll-export.yaml`; alta de titular extraída a `.maestro/business-payroll-holder.yaml`, reutilizada desde el alta de empleado; escenarios específicos que omiten la suite general en `.github/workflows/planilla-validation.yml`. Receptor exclusivo de pruebas en `tests/fixtures/android-share-receiver/` e instalador `scripts/install-android-share-fixture.sh`.

[Capturas, resultados, valores esperados y presupuesto](evidence/business05-policy-export-mobile/). Las capturas de diagnóstico conservan los fallos, sin presentarlos como recorridos aprobados. Los valores esperados están identificados como tales, separados de las comprobaciones observadas.


## Cierre

Las dos comprobaciones móviles pendientes del bloque anterior quedan cubiertas: persistencia del formulario de tasas y exportaciones CSV/PDF. Los cambios afectan procedimientos, infraestructura de prueba y documentación, sin alterar datos ni código de producción. La validación oficial contributiva, pruebas físicas y trámites de emisión/radicación siguen fuera de este bloque. No se modificó main ni se publicó.
