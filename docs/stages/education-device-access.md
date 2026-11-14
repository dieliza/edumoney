# Administración con acceso local — 14 de noviembre de 2026

Solicitud: quitar el segundo inicio por email/ChatGPT y usar la contraseña habitual de EduMoney. La contraseña local sigue abriendo la misma base cifrada; no se envía al servidor, no se cambia ni se pide otra contraseña.

El panel administrativo ya no muestra enlaces de inicio con ChatGPT. Tras desbloquear el espacio, crea una credencial aleatoria de 256 bits de este navegador, guardada cifrada AES-GCM bajo la contraseña local y con AAD propia. No se incluye en la base financiera, respaldos ni sincronización. El cambio normal de contraseña recifra la credencial en la misma transacción que las otras copias; reset no la hereda.

Para evitar que cualquier visitante de la web pública pueda administrar los consejos o consumir la API del propietario, hace falta una vinculación única: el panel muestra SHA-256 de la credencial (identificador público). El propietario lo comunica por esta conversación; se configura solo ese hash como `EDUCATION_OWNER_DEVICE_HASH` mediante los secretos nativos del Site y se vuelve a desplegar una versión guardada para aplicar el entorno. No pedir contraseña, credencial privada ni API en chat. Aprobar el identificador permite que este dispositivo use el panel después del acceso local normal, sin OAuth ni email. Un hash visible no puede utilizarse como credencial. No publicar ni registrar la credencial privada.

La identidad de Sites continúa como vía interna compatible para la automatización, sin requerirla en la interfaz del propietario. El endpoint público de catálogo conserva su lectura anónima. Escritura y administración permanecen autorizadas por servidor.

Archivos: `EducationAdminScreen.web.tsx`, `vault.ts`, `web-server/education.mjs`, `buildVersion.ts`, nueva prueba `education-device.test.ts`. No se cambian registros financieros, precios, cálculos ni el lector de recibos.

Pruebas de este bloque: 16/16 correctas en `education-device`, `anthropic-key-vault` y `education-server`; cubren credencial cifrada, reapertura, exclusión de respaldos, cambio de contraseña conservando API y ajustes, reset, dispositivo autorizado sin email, rechazo de otro dispositivo y del identificador público como credencial. TypeScript, ESLint, compilación PWA y sintaxis del Worker requeridos. Sin prueba física de iPad ni acceso simulado en nombre del usuario. GitHub main intacto. Versión visible 2026.11.14.09.

Pendiente necesario: recibir el identificador público del navegador del propietario para autorizarlo. Hasta entonces el servidor mantiene cerrado el panel administrativo; la aplicación y los consejos siguen accesibles con la contraseña local existente.
