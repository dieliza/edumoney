# EduMoney: fondos y transferencias — versión de prueba

Fecha: 2026-11-25. Rama: `feat/funds-trial`. Base de la aplicación: `0918187`. Base web pública conservada: versión 108, commit `03a7449658b58361aa39ed3c9653cb34d2ade7e1`.

## Resultado

- Home tiene saludo por hora local y primer nombre, tarjeta «Resumen de tu dinero» con cinco accesos, balance disponible/total y reservas separadas. El primer nombre se configura en Configuración → Seguridad → Tu perfil, dentro del espacio cifrado; los espacios anteriores no tenían nombre registrado. Sin nombre, aparece únicamente el saludo horario, sin nombres inventados ni apellidos.
- Cuatro acciones con simbología: monedas/flecha, recibo enmarcado, micrófono y flechas opuestas. Distribución adaptable de cuatro columnas o dos por dos en pantallas estrechas. Se conserva el selector personal/comercial y el acceso a Transacciones.
- «¿En qué gastaste más?» conserva el cálculo de tres categorías acumuladas, cantidades, porcentajes y barras del período; no usa las tres transacciones recientes.
- Administración de fondos: crear, consultar y editar; añadir/retirar mediante transferencias confirmadas; historial con corrección por versión y reversión auditada. Ubicaciones bancarias, cooperativas, efectivo, cuentas digitales y otras ubicaciones editables.
- Simulaciones de ahorro/emergencia pueden convertirse en planes con objetivo, aportación prevista, frecuencia, fecha y ubicación. Empiezan con cero ahorro realizado: ni el capital ni intereses simulados se convierten automáticamente en dinero real.
- Presupuestos planificados y reservas efectivas se distinguen. El editor mensual abre la administración de su reserva; guardar un límite no reserva dinero. Las metas anteriores se conservan y sus aportaciones se integran sin sumarlas dos veces.
- Se puede eliminar/restaurar un escaneo desde su ficha y desde la edición del documento. Es una eliminación lógica con historial: no elimina su ingreso/gasto ni borra imágenes históricas o la fototeca.
- Búsqueda universal y explicaciones incluyen fondos. Modales y textos responden al tema seleccionado.

## Integridad y datos

Migración aditiva 19: `money_locations`, `money_funds`, `fund_transfers`, `fund_events` y `local_profile`. No reemplaza registros anteriores ni cambia autenticación/permisos. Nuevas tablas incluidas en respaldo cifrado/sincronización; importaciones antiguas siguen aceptadas. Validación final evita restauraciones con fondos de otra cuenta.

Dinero expresado en centavos enteros seguros. Transferencias transaccionales, identificadores idempotentes, versiones optimistas, eventos de auditoría y comprobación cronológica de disponibilidad. No generan filas de ingreso/gasto; no ejecutan operaciones bancarias. No se admite reservar dinero inexistente ni gastar un fondo negativo. Un balance disponible negativo causado por gastos reales sí se muestra, sin ocultarlo.

Los fondos son existencias acumuladas hasta la fecha seleccionada; las gráficas de ingresos/gastos siguen mostrando flujos del mes. Reservas previstas, facturas futuras y presupuestos planificados no se confunden con dinero efectivamente apartado. Aperturas de metas anteriores se conservan como dinero ya indicado por el usuario, no como ingresos nuevos. Participaciones mixtas personal/comercial se distribuyen una sola vez conservando el registro original para edición.

Ejemplo verificado: total $2,000; disponible $1,200; ahorros $400; emergencia $300; presupuesto $100. Reservar $20 adicionales deja $1,180/$420 y mantiene $2,000. Editar y revertir recalcula el reparto sin duplicar registros.

## Archivos principales

- `src/modules/funds/*`, `src/app/funds.tsx`: modelo, administración, transferencias, ubicaciones y conversión de simulaciones.
- `src/storage/schemaV19.ts`, `migrate.ts`, `modules/backup/store.ts`: persistencia y compatibilidad de respaldos.
- `src/ui/FundsSummary.tsx`, `MoneyOverview.tsx`, `HomeBalancesAndCharts.tsx`, `HomeVoiceEntry.tsx`, `NeonActionButton.tsx`, `ExpenseTopThree.tsx`: nuevo Home y símbolos.
- `src/modules/profile/*`, `settings/SettingsScreen.tsx`: primer nombre y saludo local.
- `modules/goals/*`, `progress/store.ts`, `money/ChartsScreen.tsx`, `ui/TransactionOverview.tsx`: metas, progreso, presupuestos y gráficas.
- `modules/money/scopedMovements.ts`, `store.ts`, `accountScopeData.ts`: separación de cantidades por cuenta, preservando el original editable.
- `modules/documents/store.ts`, `DocumentsScreen.tsx`, `money/MovementForm.tsx`: eliminar/restaurar escaneos.
- `modules/search/{load,model}.ts`, `ui/meaningCatalog.ts`: acceso y ayuda para fondos.
- `web-enhancements/funds-trial/*`: integración progresiva en el paquete público 108, sin reemplazar premios/fuegos artificiales, controles nativos web, acceso/biometría, vínculos de cuenta o notificaciones existentes.

## Verificaciones

69 escenarios únicos cubiertos; presupuesto conservador de 97 ejecuciones de 100, incluyendo repeticiones y arranques. No se lanzó la suite completa ni CI.

- 21 casos de fondos: reparto, idempotencia, retiradas, correcciones, reversión, cronología, falta de saldo, negativos reales, separación comercial/mixta, metas previas, planes, ubicaciones, reservas, respaldo/restauración y migración desde 18.
- 8 casos de saludo: límites horarios locales, ausencia de nombre, primer nombre y normalización.
- 3 casos de eliminación de escaneo: conserva balances/transacción, restauración/versiones e impide usarlo para dictados.
- 19 casos existentes de metas y 5 de respaldos. Se actualizaron tres expectativas de texto obsoletas; los tres casos se repitieron y pasaron.
- 5 casos de renderizado estático: tarjeta en ambos temas, cinco accesos/importes, símbolos, saludo, invitación de simulación y contraste de formulario.
- 8 comprobaciones sobre el paquete web final: identidades/dependencias, ruta real, migración/respaldos, transferencias SQLite/idempotencia/reversión, render inicial de Home/Metas/Fondos, eliminación/perfil, temas/símbolos y grafo/caché/aislamiento. Un primer intento detectó una función de notificación ausente en el adaptador de prueba; se completó ese adaptador y las ocho comprobaciones pasaron.
- TypeScript sin errores. ESLint sin errores; advertencia anterior en `scripts/patch-home-controls-site.cjs` por variable `req` sin usar.

Las expectativas de esquema de los tests de educación/lecturas se actualizaron a 19; esas suites completas no se ejecutaron para respetar el límite. Se preservó el módulo web de premios/fuegos artificiales en la integración.

## Alcance de la prueba y pendientes

Proyecto privado de prueba: `appgprj_6b070495eb5481918c579fa02cb7441a`, independiente del EduMoney público. No se copian datos, contraseñas ni secretos del sitio actual. Utilizar datos ficticios; para probar el saludo, completar Tu perfil. Los servicios que necesitan secretos externos no se reconfiguraron en este proyecto.

Pendiente validación visual/interactiva en Safari iPhone, Android, iPad y PWA real: el entorno no ofrece el controlador de navegador requerido, por lo que no se improvisó otro ni se afirmaron esas pruebas. También queda pendiente una sincronización real entre dispositivos en este origen de prueba; se verificó el formato persistido/restaurable con SQLite y respaldo.

No se actualiza el sitio público hasta que el usuario valide esta versión y apruebe producción. La publicación privada se registrará abajo al confirmar su estado.

## Publicación privada confirmada

Estado: succeeded. Enlace: https://edumoney-fondos-prueba-20261125.diegoluissantospabon.chatgpt.site

Commit de la aplicación: `ea990b4c9e0494720e6cc71443aab867b8d1c488`. Commit web de prueba: `833f5f391e8b9449ef2500008e390559c7af9ac2`. Despliegue: `appgdep_6b07064645c0819196f7d5bad3603728`. Compilación local aprobada; publicación con compilación remota por falta de espacio local accesible para el archivo de despliegue.

TypeScript y ESLint finales aprobados; solo permanece la advertencia anterior de `req` sin usar en `scripts/patch-home-controls-site.cjs`. El sitio público no se modificó.

## Ampliación de «¿Qué significa?»

Se añadieron explicaciones del resumen, balance disponible, total de fondos, ahorros, emergencia, presupuestos reservados, transferencias, correcciones y reversiones; ahorro proyectado frente a realizado; aportación/frecuencia/fecha objetivo; nombre del fondo y ubicación del dinero. Origen, destino, cantidad, fecha y confirmación tienen ayuda específica dentro de Transferir fondos. Las ayudas ya existentes de Negocio se conservan.

Hay accesos contextuales en la tarjeta verde, la ficha de cada fondo, el historial, el editor de transferencias y la invitación a convertir una simulación. La ayuda de la tarjeta utiliza texto claro en ambos temas. No se modificaron cálculos, registros, permisos ni tablas.

Verificación adicional: dos casos nuevos de catálogo y apertura/cierre/contraste; una comprobación del paquete real que conserva sin cambios los otros 1,409 módulos y la actualización segura. Las tres pasaron. TypeScript y ESLint sin errores; permanece la advertencia anterior de `req`. Presupuesto acumulado conservador: **100 de 100**; 72 escenarios únicos. No se ejecutaron más pruebas ni CI.

Actualización de ayudas publicada correctamente en el mismo enlace privado. Commit web: `44677b59800b13a615959dd20233bada1666bde5`. Despliegue: `appgdep_6b0707eb208881919dede084442ad685`. El EduMoney público permanece sin cambios.

## Validación solicitada y aprobación de producción

A solicitud «Valídalo», se abrió un bloque de validación separado del bloque de implementación cerrado. Pasaron **39 casos de código** (fondos 21, saludos 8, eliminación de escaneos 3, ayudas 2, render estático 5) y **8 casos del paquete exacto publicado** en la versión privada 2, commit `44677b59800b13a615959dd20233bada1666bde5`.

La verificación del paquete ahora descubre los recursos desde el HTML vigente; no usa la lista de recursos de la primera versión. Comprueba también el nombre de caché vigente y abre la ayuda actual en ambos temas.

Después, el propietario indicó que había revisado la versión de prueba, que estaba muy bien y que se publicara. Se recibió así la aprobación pendiente de producción. La aprobación visual procede del usuario; no se atribuye al agente una revisión de Safari o dispositivos reales.

La promoción conserva byte por byte los manejadores del servidor, todas las rutas anteriores y el manifiesto de producción. Solo sustituye el paquete de interfaz por el aprobado; no copia datos, contraseñas ni secretos de la prueba. La comprobación de promoción y la compilación pasaron. Bloque de validación: **48 de 100** consumidos conservadoramente (47 casos y una comprobación de promoción); no se ejecutó CI ni la suite general.

Versión pública guardada: **109**, commit `b17a1a0d64e6ee0916c174c5b9de19d8f296c836`. Publicación con compilación remota por falta de espacio local accesible para el archivo de despliegue; el estado final se registra tras confirmación del servidor.

## Publicación pública confirmada

Versión **109**, estado **succeeded**, URL https://edumoney-web.diegoluissantospabon.chatgpt.site . Despliegue `appgdep_6b070a2ae2b88191a09edfe20a50cbcb`. Se conservaron el acceso público y el manifiesto de producción.

Se verificaron por HTTP anónimo el HTML, `/sw.js` y el bundle común activo: los tres sirven la revisión aprobada `funds-help-3fb59bc0002f`. El cliente Python inicial recibió 403; la lectura anónima con agente Mozilla devolvió 200. No fue una prueba de navegador ni una operación sobre registros del usuario. Contando diagnóstico y repetición, el bloque consumió **51 de 100** conservadoramente.
