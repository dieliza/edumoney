# Seguimiento de nómina — interacción móvil

Entrega en `negocio-05-validacion-movil`, sin cambios en main ni publicación. El límite solicitado de 100 casos, incluidas repeticiones y CI, queda registrado en AGENTS.md.

## Cambios y alcance

- Botón accesible para ocultar el teclado dentro de las fichas modales, fuera de su contenido desplazable.
- Identificadores estables de campos y acciones para verificar los formularios de registros comerciales.
- Recorrido sin perfiles precargados: crear un titular ficticio en la interfaz, guardar nombre/código/salario/notas de un empleado, reiniciar y volver a abrirlo.
- Escenario `payroll` en el flujo nativo existente, que omite expresamente la suite general en CI.
- Ajuste del desplazamiento de la prueba iOS para seleccionar la forma jurídica fuera del encabezado y comprobar la selección antes de guardar.
- Corrección del comando Android: el emulador ejecuta cada línea en un shell distinto; la selección del archivo de prueba se resuelve directamente en el comando, sin una variable que se pierda entre líneas.

No cambia las reglas de nómina, los datos reales ni el formato de emisión oficial.

## Resultados y presupuesto

**39 casos ejecutados:** 36 pruebas de nómina y tres recorridos móviles (el primer recorrido iOS fallido y las verificaciones finales de iOS/Android). Los fallos de descarga/configuración que no iniciaron un recorrido no se cuentan como casos ejecutados. No se lanzó la suite completa.

- `npm test -- tests/business-payroll.test.ts`: **36 aprobadas**, una sola ejecución.
- TypeScript y ESLint aprobados. YAML y diferencias revisados.
- [Android: ejecución 42667613717](https://github.com/dieliza/edumoney/actions/runs/42667613717): recorrido aprobado, Android API 35, con Wi-Fi y datos desactivados antes de abrir la aplicación.
- [iOS: ejecución 42667453343](https://github.com/dieliza/edumoney/actions/runs/42667453343): **todos los comandos del recorrido completados**, iPhone 17 Pro/iOS 26.4. Las capturas y los controles de cifrado/reapertura se completaron y se subieron como artefactos.

La ejecución iOS figura **cancelada**, porque se solicitó detenerla al interpretar su duración como un atasco; la solicitud coincidió con la limpieza final, después de completar las comprobaciones y subir los artefactos. No se presenta ese estado de GitHub como una ejecución verde. La evidencia de comandos, capturas y cifrado confirma qué verificaciones sí terminaron. No se repitieron pruebas ya completadas para cambiar el estado de la ejecución.

En ambas plataformas se comprueban el salario **$2,200.00**, el código y la nota exacta `NOTA-FICTICIA-PERSISTE` después de reiniciar. Los campos contributivos desconocidos permanecen pendientes y no impiden guardar el perfil.

## Trazabilidad

Código de aplicación compilado: `3f03c59`. No hay diferencias posteriores en `src`, configuración nativa, dependencias, plugins o assets. iOS reutiliza el paquete de 42664986263; Android, el APK de 42665307671. Los commits posteriores ajustan únicamente el procedimiento y la documentación.

- [42664986263](https://github.com/dieliza/edumoney/actions/runs/42664986263): Android recibió HTTP 500 al descargar Gradle, antes de las pruebas. iOS compiló; el recorrido detectó que no se había seleccionado la forma jurídica. Se corrigió la automatización.
- [42665307671](https://github.com/dieliza/edumoney/actions/runs/42665307671): APK compilado; el comando de selección del recorrido perdió su variable entre shells y no inició casos. Se corrigió y reutilizó el APK.
- iOS final usa procedimiento `364dab0`; Android final, `66476fd`.

En iOS, `ios-smoke.sh` confirma cabecera cifrada, rechazo de lectura con SQLite sin clave, idéntica huella antes/después de reabrir y exclusión de respaldo automático. Los JSON y capturas se conservan en [evidencia](evidence/business05-mobile/README.md).

## Pendientes conservados

Esta comprobación cubre el formulario de **empleados**, navegación, teclado y reapertura. Quedan por verificar en dispositivos las fichas de tasas patronales, preparación/confirmación de pagos, depósitos y el diálogo de compartir. Las 36 pruebas de lógica/SQLite cubren cálculos y persistencia de esos registros, pero no sustituyen su interacción móvil. Tampoco constituye validación de emisión oficial del comprobante ni una compilación para distribución en tiendas.
