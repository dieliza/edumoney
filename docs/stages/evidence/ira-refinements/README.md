# IRA: correcciones, eliminación y residencia contributiva

Solicitud: explicar Corregir, permitir eliminar dentro de Editar, verificar múltiples cuentas y evitar repetir la configuración contributiva. No se cambia el tratamiento de nómina ni el origen del balance inicial.

## Cambios

- Se reutiliza MeaningHelp en Registrar corrección y Corregir mediante reversión. Una corrección modifica la valoración restringida; una reversión anula el efecto de una transferencia equivocada. Se conservan los originales y no se ejecutan operaciones bancarias.
- Editar cuenta IRA incluye Eliminar cuenta IRA, con confirmación en el mismo formulario. Se reutiliza money_funds.archived: no requiere migración ni borrar movimientos. Solo se permite con saldo restringido cero; una cuenta con saldo muestra el motivo del bloqueo. No se simulan retiros para eliminarla.
- Eliminación atómica con revisión de versión, registro en ira_audit y pausa de aportaciones programadas. Las cuentas eliminadas dejan de aparecer en el selector; se mantienen para límites combinados, impuestos e historial. Se bloquean operaciones y cambios a transferencias de cuentas eliminadas.
- Crear cuenta IRA y el selector existentes ya soportan múltiples cuentas; no se duplica ninguno.
- Residencia contributiva se guarda una vez para todas las IRA del usuario. Residencia y trabajo son conceptos diferentes; no son la ubicación del banco. Si existe perfil, se muestra el resumen con el control existente convertido en Editar residencia contributiva. El formulario solo reaparece al editar. Si la investigación falla después de guardar, se mantiene el perfil guardado y se informa el error.
- No cambia la investigación oficial mensual ni la aprobación de reglas por el propietario.

## Archivos funcionales

- src/modules/ira/IRAScreen.tsx
- src/modules/ira/store.ts
- src/modules/ira/types.ts
- src/modules/jurisdiction/JurisdictionPanel.tsx
- src/modules/funds/store.ts

## Verificación

83 ejecuciones de casos consumidas de un máximo de 100, contando repeticiones:

1. tests/ira.test.ts: 19/19 aprobados.
2. tests/ira.test.ts + tests/funds.test.ts + tests/jurisdiction.test.ts: 48/50 aprobados. Dos pruebas antiguas esperaban schema22 o simulaban schema18 sin retirar las tablas posteriores; se corrigieron exclusivamente esas pruebas.
3. Repetición filtrada de esas dos pruebas: 2/2 aprobados.
4. Nueve verificaciones del paquete aprobado: hashes de fuente, cinco módulos afectados, ausencia de módulos nuevos, 1,462 módulos protegidos, caché y aliases de service worker, recursos precargados, regla mensual y respuestas HTTP del Worker para la página IRA, su service worker y recursos de entrada. Todas aprobadas.
5. Comprobación HTTP de producción: primer intento Python bloqueado por el proxy (403); se repitió con el cliente configurado para el proxy de este entorno. Página IRA y /sw.js devuelven200 y contienen la versión nueva. Tres intentos contados conservadoramente.

Resultados vigentes: los 50 casos distintos pasan (21 IRA, 21 fondos, 8 jurisdicción). Incluyen múltiples cuentas, correcciones, transferencias atómicas, eliminación sin saldo, bloqueo de eliminación con saldo, conservación de historial contributivo y restauración de respaldos con estado eliminado. TypeScript, ESLint de archivos afectados y git diff --check aprobados. Sin migraciones nuevas (se conserva schema23).

No se realizó una prueba visual en navegador ni en dispositivos físicos en este bloque: no está disponible la herramienta de vista previa administrada. No se afirma compatibilidad visual comprobada en iOS/Android. El paquete conserva íntegramente los módulos no afectados, las rutas históricas y los manejadores del service worker; la publicación usa una caché nueva.

Los registros utilizados son ficticios y locales; no se ejecutaron pruebas destructivas sobre datos de usuarios.

Publicación completada: versión158, source0979d70f5571b917223406754c69b624c8c63d70. Se conserva acceso público y env revision4. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site . Recibo: publication.json. Comprobación HTTP: production-http.json.
