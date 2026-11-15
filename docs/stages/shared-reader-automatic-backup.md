# Anthropic compartido y respaldo automático — 2026.11.15.14

## Resultado y arquitectura
- El lector público usa la API exclusivamente desde el servidor. No se incrusta ni entrega la clave en JS, APK, URL, respuesta HTTP o código compartido.
- Por defecto reutiliza la API ya cifrada en el servidor de EduMoney. Se comprobó mediante la herramienta de estado, sin leer ni imprimir la clave: keyConfigured=true. No se modifica la generación educativa.
- Administración en Configuración → API e IA, solo si el servidor confirma al propietario con los controles existentes. Permite guardar una API específica del lector, reutilizar la API guardada del propietario, activar, desactivar, retirar y configurar máximo diario. Las acciones son autenticadas en el servidor; ocultar controles no es la barrera de seguridad.
- Nuevos usuarios no introducen API ni reciben diálogo de activación o consentimiento para cada lectura. La acción explícita de seleccionar/tomar foto envía la imagen a Anthropic; la pantalla y privacidad lo informan. No se afirma retención cero ni se oculta el procesamiento externo.
- Mantiene claude-haiku-5-5, esquema y revisión manual. Sin conversación ni almacenamiento de fotos en el endpoint. Desactivar impide nuevas llamadas compartidas. Sin conexión o servicio desactivado se conserva OCR local/manual; un fallo durante una llamada Anthropic no dispara reintentos de pago ni cambia de proveedor.
- Protección inicial: 200 reservas diarias globales, límite configurable de 1 a 10000 por el propietario, y máximo adicional de 40 por IP/día. Reservas atómicas R2 antes de llamar al proveedor; no se almacenan IP sin transformar, fotos o texto en el contador. Estos límites son de solicitudes, no un límite monetario verificado. No se activaron recargas, suscripciones o facturación nueva.

## Respaldo
- Conserva el guardado local cifrado y añade disparador después de COMMIT exitoso. El disparador nunca puede hacer fallar un guardado local.
- Cada espacio nuevo genera su propio código privado aleatorio de acceso y cifrado. Se guarda cifrado en el vault web o en SecureStore del dispositivo nativo. Nunca se utiliza un código común para distintos usuarios.
- Envía un snapshot de las tablas ya existentes, incluidos registros, categorías, reglas y comprobantes almacenados en esas tablas, mediante el protocolo existente de respaldo cifrado AES-256-GCM/PBKDF2 y R2. Excluye claves de API, claves locales y credenciales administrativas.
- Agrupa cambios durante 1,8 segundos, serializa envíos, conserva cambios que ocurran mientras sube una copia y reintenta pendientes cada 30 segundos, al volver a la aplicación o recuperar conexión.
- Intenta vaciar pendientes al pasar a segundo plano, ocultar o salir. Los navegadores y el sistema operativo pueden interrumpir ese envío; la seguridad depende de respaldar después de guardar y reintentar al volver, no de prometer una transferencia al cerrar.
- Solo muestra éxito remoto tras respuesta satisfactoria con versión ETag. Conserva precondiciones If-Match/If-None-Match. El respaldo automático no restaura ni reemplaza una copia divergente: solicita revisión en Sincronización. La recepción/reemplazo manual conserva confirmaciones existentes.
- Estado pendiente/error/conflicto visible, con acceso a Sincronización y fecha de última copia confirmada. Desvincular/desactivar no se revierte automáticamente al siguiente inicio. Una respuesta antigua no debe reactivar un código reemplazado o desvinculado.
- Límite remoto existente: 16 MB cifrados. Si se supera, queda pendiente sin borrar registros. No se respaldan campos de formulario que todavía no se guardaron.

## Recuperación y uso del propietario
1. Configuración → API e IA: revisar el estado compartido; el propietario verá su administración. Los demás solo ven información, nunca la API.
2. Configuración → Datos → Sincronización: revisar la última copia confirmada y mostrar/copiar el código privado. Cada persona debe conservar SU código fuera del dispositivo.
3. Para otro dispositivo o una instalación nueva, crear/desbloquear su espacio, introducir el mismo código en Sincronización y revisar las copias. Si hace falta recibir la remota, usar la confirmación existente. Conservar antes una copia local que se necesite.
4. No se añade recuperación automática por email ni recuperación sin código/contraseña. Si se borra todo el almacenamiento y no se conserva el código privado, no se promete acceso al respaldo remoto.

## Archivos principales
Servidor: web-server/shared-reader.mjs; owner-security.mjs extrae sin cambiar los controles y cifrado existentes de education.mjs; anthropic-reader.mjs; scripts/package-web-site.mjs.
Lectura/UI: sharedReader.ts, readerEndpoint(.web).ts, SharedReaderSettings.tsx, SharedReaderAdmin(.web).tsx, ReceiptReaderSettings(.web).tsx, AnthropicConnectionHost.web.tsx, capture.ts y capture.native.ts, readerSetup.ts y DocumentsScreen.tsx.
Respaldo: storage/changeEvents.ts, money/store.ts (solo notificación tras COMMIT), web/sync.ts, syncSettings(.native).ts, syncRuntime(.native).ts, autoSyncController.ts, autoSyncStatus.ts, ui/AutoSyncHost.tsx y syncExit(.web).ts, web/SyncScreen.tsx y NativeSyncScreen.tsx, app/sync.tsx y _layout.tsx, core/http.ts.
Se actualizan textos de SettingsScreen, StorageGate.web (solo aviso informativo de respaldo, sin cambiar acceso) y buildVersion. Sin nuevas dependencias ni migraciones de esquema. Preferencias nuevas aditivas y objetos R2 cifrados separados.

## Validación y límites
- 90 ejecuciones automatizadas aprobadas (incluye repeticiones): selecciones de 47, 20, 7, 2, 13 y 1 casos. No se ejecutaron suites generales, CI ni receipt-labels. Por debajo de 100.
- Cobertura: propietario y acceso denegado, API cifrada y nunca devuelta, reutilización del secreto ya existente, activación/desactivación, reservas concurrentes, solicitud sin clave/diálogo de API, errores del proveedor sin pedir claves al visitante, lectura online/offline/local, protocolo de lectura existente y fallos, debounce, reintentos, conflictos, cambios durante envío, desactivación, bloqueo durante preparación, actualización atómica de ajustes, códigos distintos por espacio, copia cifrada de dos dispositivos con reglas/cálculos históricos, recepción manual y protección del envío automático frente a reemplazos silenciosos, regresión de educación.
- TypeScript, ESLint y build web/PWA correctos. Se corrigieron incompatibilidades iniciales de props de los componentes existentes y un problema del analizador de imports con JSON trasladando helpers sin cambiar su lógica. No hubo llamadas de generación a Anthropic durante pruebas: proveedor simulado y datos ficticios.
- Revisión React: efectos con limpieza, estado externo con suscripción, acciones del propietario protegidas en servidor y guardia contra dobles envíos, sin dependencias nuevas.
- Web y PWA se publican en el origen existente. Soporte nativo implementado en código; APK/IPA instalados anteriormente requieren una nueva compilación/distribución. No se realizó EAS ni publicación en tiendas.
- Pendientes: Safari/iPhone/iPad, Chrome Android y PWA física; interrupción real del sistema operativo; compilación y recorrido nativos. Entorno sin navegador ni dispositivos físicos.
- Reversión: revertir los commits de esta etapa, conservar objetos cifrados y códigos existentes; no se han eliminado datos ni cambiado cálculos o autenticación.

## Publicación y comprobación operativa
- Implementación: 27ff563, rama web-edumoney. No se modificó GitHub main.
- Hosting: 54cfc5ebf60ec8eedce9e6df4f5d5b1ca3111103. Sites versión 54; versión guardada appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_fdb652c8660c8191a8c18df829393cb5.
- Deployment appgdep_6afa116576fc819198c9db9bea3a88fc: succeeded. Revisión de entorno 1 y acceso público preexistente conservados. No se cambiaron variables, claves ni planes de facturación.
- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Estado real del servicio: HTTP 200, enabled=true, configured=true, dailyLimit=200, provider=Anthropic, model=claude-haiku-5-5. Consulta mediante el acceso de servicio oficial de Sites; sin fotos ni generación facturable.
- Las consultas iniciales Python con User-Agent predeterminado recibieron Cloudflare 1010 antes de la aplicación, incluso en el endpoint público. No se interpreta ese 403 como una prueba de la autorización del panel. Node fetch no pudo utilizar el transporte del entorno. Se completó la comprobación con proxy Python, User-Agent identificable compatible y cabecera oficial de servicio, sin guardar ni imprimir el token.
- La separación de permisos del administrador está cubierta por pruebas del servidor; quedan pendientes la comprobación visual y los recorridos en dispositivos físicos indicados arriba. Todas las comprobaciones automatizadas y operativas permanecieron por debajo del límite de 100.
