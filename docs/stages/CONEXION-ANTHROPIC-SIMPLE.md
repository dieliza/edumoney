# Una sola clave de API, separada de la contraseña local

## Problema y resultado

La configuración mezclaba el formulario de tres contraseñas locales con el campo de API. Además, solo retenía la API en RAM, de modo que recargar la perdía. Ahora el lector tiene una pantalla dedicada /receipt-reader con un único campo de API, mostrar/ocultar y Activar Anthropic. No pide contraseña actual, nueva ni corroboración. En Configuración el cambio de contraseña queda cerrado por defecto y solo se monta si se pulsa expresamente su botón.

Al activar se comprueba la clave en el servidor mediante GET https://api.anthropic.com/v1/models/claude-haiku-5-5, sin foto, sin Messages ni generación. Solo tras verificar acceso al modelo y guardar correctamente se indica conectado. Esto no comprueba saldo: la lectura de una foto todavía puede fallar por crédito o límites. Fallos de red/autenticación/almacenamiento conservan lo escrito y la conexión anterior. No hay reintentos o modelos alternativos.

El campo de API web es un input de texto con enmascaramiento visual, autocomplete off e indicadores para gestores de contraseñas. No es un campo de nueva contraseña: la app no invita a generar o cambiar una contraseña para conectarse. El comportamiento de extensiones o sugerencias del sistema operativo depende de su configuración.

## Persistencia y seguridad

La clave se guarda con AES-256-GCM en una entrada independiente `anthropic-key` de la bóveda IndexedDB existente, con autenticación adicional propia. No se escribe en localStorage ni en texto claro, tablas financieras, respaldo, sincronización, URLs, logs o código publicado. La copia activa se conserva en RAM tras desbloquear EduMoney normalmente. No se pide otra clave de API en ese navegador mientras permanezca guardada y válida.

La rotación voluntaria de contraseña conserva la API recifrándola en la misma transacción de la base y ajustes del enlace. Restablecer no hereda la API anterior; preserva su copia antigua cifrada junto con las otras copias de recuperación. Desconectar borra la API del navegador y vuelve a lector local; no cambia la contraseña de EduMoney. Borrar los datos o usar otro navegador requiere configurar una clave de nuevo. No se introduce una clave central ni se presta cuota de PR Budget.

## Archivos

- src/app/receipt-reader.tsx: pantalla independiente.
- ReceiptReaderSettings.web.tsx y ApiKeyField.web.tsx: formulario único, verificación, estados, reintento y retirada.
- SettingsScreen.tsx: acceso visible al lector y formulario de contraseña cerrado.
- anthropicConnection.ts / anthropicSession.ts: verificación, guardado, restauración al desbloquear y retirada.
- AnthropicConnectionHost[.web].tsx y _layout.tsx: restauración sin interrumpir el acceso a datos si falla una API guardada.
- vault.ts: entrada cifrada independiente y conservación atómica durante cambio/restablecimiento.
- web-server/anthropic-reader.mjs y scripts/package-web-site.mjs: endpoint POST /api/receipt-reader-activation, solo consulta de modelo, errores saneados.
- docs/PRIVACY.md y buildVersion.ts: condiciones actualizadas y marcador 2026.11.14.03.

Sin migración de esquema financiero ni cambios de importes o registros. El desbloqueo normal de EduMoney conserva su contraseña existente; conectarse no la cambia ni llama a su función de rotación.

## Verificación

28 ejecuciones de casos aprobadas, con datos y claves ficticios; máximo de 100 respetado. No suite general ni CI.

- 21: API de verificación simulada, método/modelo/errores/origen/clave, guardado y recuperación de conexión, conservación de conexión anterior ante error, interfaz de una clave, reintento, retirada, cliente de fotos, cifrado real WebCrypto/IndexedDB de prueba, reabrir sin otra API, exclusión de respaldos, recifrado/retirada/restablecimiento.
- 2: input único y editable sin tipo password ni autocompletado de contraseña; configuración no monta el formulario de cambio.
- 5: regresiones del código de enlace, cambio voluntario de contraseña, contraseña incorrecta, escrituras concurrentes y restablecimiento.

TypeScript, ESLint y diff check correctos. Sin clave real no se verificó una cuenta de Anthropic ni saldo o precisión real de fotos. No se envió una foto ni se generaron cargos. No se verificó Safari físico ni PWA instalada: las herramientas de navegador Sites siguen sin estar disponibles.

Compilación web correcta. Esta etapa sustituye la configuración de API temporal descrita en documentos anteriores; se conservan como historial. La clave sigue siendo propia por navegador y no una credencial central del servicio.

Publicada el 14 de noviembre de 2026 a las 01:46 UTC. Versión alojada 21, marcador 2026.11.14.03. Fuente 267ea5d70f6b232f695768627bd9cf3a3dbb0a26; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_d92de2f4300c819184f6ffc1f5a60849; despliegue appgdep_6af7bd70e3a08191925ce2277c4ba354, succeeded. Audiencia pública conservada, GitHub main sin modificar. https://edumoney-web.diegoluissantospabon.chatgpt.site
