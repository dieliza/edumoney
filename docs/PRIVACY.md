# Privacidad de EduMoney

EduMoney conserva los registros financieros y las copias elegidas en una base local cifrada con SQLCipher. La clave se guarda en el almacén seguro del dispositivo y no se exporta. No exige cuenta en línea, no sube automáticamente información a servidores. En la web se puede activar, de forma opcional, el lector Claude Haiku 5.5 (Anthropic) descrito abajo. No se implementan notificaciones push; los recordatorios son locales.

La cámara, la voz, el calendario y los avisos se solicitan cuando se usan. El reconocimiento es local cuando el dispositivo ofrece esa capacidad; si no está disponible se ofrece entrada manual. Las fotos originales de la biblioteca del usuario permanecen bajo su control.

El usuario decide qué exportar y a qué aplicación o ubicación enviarlo. PDF, CSV y JSON de revisión son legibles; sus notas y descripciones pueden contener datos personales. Las copias de evidencias se incluyen solo por selección. El destino elegido por el usuario puede conservar lo recibido. Los temporales propios se eliminan al cerrar y se limpian al iniciar después de una interrupción.

El respaldo de recuperación es diferente: se cifra con una contraseña elegida por el usuario mediante AES-256-GCM y PBKDF2-HMAC-SHA256. EduMoney no guarda ni puede recuperar esa contraseña. El respaldo incluye todos los registros y documentos locales y no incluye la clave de SQLCipher. La recuperación reemplaza los datos locales solo tras selección, descifrado, revisión y confirmación expresa.

La revisión de reglas y resultados puede registrarla el usuario. No se exige que sea CPA para usar los cálculos disponibles. No se afirma certificación oficial ni se radica una planilla. Los campos o reglas no cubiertos se identifican en los resultados y documentos.

Esta documentación debe completarse con los datos del responsable de la aplicación, contacto y declaraciones de las tiendas antes de la publicación. Negocio cuenta con perfiles, registros, obligaciones, panel y nómina locales. Las pruebas físicas, los recorridos nativos comerciales aún no cubiertos y la preparación de distribución siguen pendientes; la distribución nativa en tiendas sigue pendiente; la web ya está publicada.

## Web app y sincronización opcional

En la web, la base funciona en memoria y se guarda cifrada en IndexedDB mediante AES-256-GCM y una contraseña local. El navegador puede eliminar su almacenamiento; es necesario conservar respaldos y contraseña.

Si el usuario activa el enlace y pulsa Sincronizar ahora, se envía una copia cifrada a su servicio de EduMoney. El secreto de acceso y la clave de descifrado son independientes; la clave de descifrado no se envía al servidor. Se guardan el objeto cifrado y metadatos técnicos de versión, tamaño y conexión. El proveedor de alojamiento procesa las conexiones HTTPS según su servicio. La sincronización no envía registros legibles. El lector opcional Anthropic es un flujo separado y envía únicamente la foto autorizada para su lectura.

El código privado de enlace permite acceder a las copias: se comparte únicamente con dispositivos propios. Se puede desvincular el dispositivo o retirar la copia remota desde la app. Las exportaciones PDF/CSV/JSON de revisión siguen siendo legibles y se descargan solo cuando el usuario las solicita. La captura web mantiene la revisión manual. Anthropic añade lectura remota solo tras activación y autorización recordada en ese dispositivo y navegador; el dictado no se envía a este lector.

## Acceso compartible sin cuenta de ChatGPT

Por petición del usuario, el código de la web se ofrece mediante enlace público, sin autenticación de ChatGPT. El alojamiento continúa en Sites (dominio chatgpt.site). Compartir la dirección no comparte el espacio local cifrado ni el código de sincronización. Cada navegador mantiene su propio espacio y contraseña; en un mismo perfil de navegador se trata del mismo espacio local. El servidor de sincronización sigue exigiendo el secreto privado de enlace y entrega únicamente su copia cifrada. No hay listado público de registros ni de copias.


## Lector opcional Claude Haiku 5.5 (Anthropic)

Por elección expresa del usuario, Anthropic sustituye a Google Gemini en la web. El lector remoto utiliza únicamente `claude-haiku-5-5` mediante Messages API. No se envían fotos a Google ni OpenAI. La clave propia se introduce una vez en Configuración → Conectar o gestionar lector de fotos, separada del cambio de contraseña local. Activar comprueba acceso al modelo con Models API, sin enviar una foto ni generar un mensaje; esa comprobación no verifica saldo. Tras verificarse, la clave se guarda cifrada con AES-256-GCM en una entrada independiente de IndexedDB, protegida por la clave de cifrado del espacio local y datos autenticados específicos. Se recupera en memoria al desbloquear EduMoney y no entra en registros financieros, respaldos, sincronización ni URLs. Desconectar elimina la clave guardada. El cambio voluntario de contraseña local recifra también esa entrada de forma atómica; restablecer un espacio no hereda la API anterior y conserva solo su copia cifrada de recuperación. Borrar los datos del navegador o cambiar de navegador requiere configurar la API nuevamente.

La primera lectura requiere una autorización recordada para Anthropic. No se hereda la autorización anterior de Google. Se conserva solo una marca versionada en localStorage, sin foto ni clave. Se puede retirar en la configuración, lo que activa lectura local. Otro navegador/dispositivo o borrar los datos requiere autorizar de nuevo. Si el navegador bloquea el almacenamiento, solo puede autorizarse esa lectura.

La foto preparada y la clave pasan por HTTPS al endpoint de EduMoney y desde allí a Anthropic. El código no guarda estos contenidos en el servidor ni los escribe en logs. Utiliza una solicitud sin conversación previa, sin Files API ni herramientas, validación de respuesta y revisión manual antes del guardado local. El proveedor y el alojamiento procesan sus conexiones según sus condiciones. Anthropic indica eliminación de entradas y salidas dentro de 30 días, con excepciones (servicios con otra retención, acuerdos, cumplimiento de políticas y ley); no se promete retención cero. El prompt omite transcribir SSN, cuentas bancarias e identidad del empleado, pero la foto enviada puede contenerlos.

La API es de pago por uso, independiente de una suscripción de Claude. No hay reintentos automáticos, proveedor alternativo ni otro modelo si falla una lectura. La clave, el acceso, el saldo y la cuota se comprueban al solicitar la lectura; EduMoney no activa facturación ni adquiere créditos. Los importes y campos ilegibles permanecen pendientes; no se calculan cifras ausentes ni se guardan pagos automáticamente. La sincronización cifrada y los respaldos mantienen sus reglas existentes y no contienen la clave de API.

Fuentes oficiales: https://platform.claude.com/docs/en/about-claude/models/overview , https://platform.claude.com/docs/en/about-claude/pricing , https://platform.claude.com/docs/en/build-with-claude/structured-outputs , https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data .

## Acceso y recuperación web

La contraseña se solicita una vez para abrir el espacio local; remontar una pantalla reutiliza la conexión ya abierta. No se guarda la contraseña ni se conserva una sesión desbloqueada después de bloquear o recargar. El formulario usa autocompletado de acceso y permite revisar lo escrito. «Olvidé mi contraseña» no restablece ni borra el espacio: la recuperación por email todavía requiere configurar cuentas, correo y recuperación de las claves de datos. Conectar un dominio no descifra los datos locales por sí mismo.
