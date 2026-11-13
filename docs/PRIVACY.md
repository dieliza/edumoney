# Privacidad de EduMoney

EduMoney conserva los registros financieros y las copias elegidas en una base local cifrada con SQLCipher. La clave se guarda en el almacén seguro del dispositivo y no se exporta. No exige cuenta en línea, no sube automáticamente información a servidores. En la web se puede activar, de forma opcional, el lector Google Gemini descrito abajo. No se implementan notificaciones push; los recordatorios son locales.

La cámara, la voz, el calendario y los avisos se solicitan cuando se usan. El reconocimiento es local cuando el dispositivo ofrece esa capacidad; si no está disponible se ofrece entrada manual. Las fotos originales de la biblioteca del usuario permanecen bajo su control.

El usuario decide qué exportar y a qué aplicación o ubicación enviarlo. PDF, CSV y JSON de revisión son legibles; sus notas y descripciones pueden contener datos personales. Las copias de evidencias se incluyen solo por selección. El destino elegido por el usuario puede conservar lo recibido. Los temporales propios se eliminan al cerrar y se limpian al iniciar después de una interrupción.

El respaldo de recuperación es diferente: se cifra con una contraseña elegida por el usuario mediante AES-256-GCM y PBKDF2-HMAC-SHA256. EduMoney no guarda ni puede recuperar esa contraseña. El respaldo incluye todos los registros y documentos locales y no incluye la clave de SQLCipher. La recuperación reemplaza los datos locales solo tras selección, descifrado, revisión y confirmación expresa.

La revisión de reglas y resultados puede registrarla el usuario. No se exige que sea CPA para usar los cálculos disponibles. No se afirma certificación oficial ni se radica una planilla. Los campos o reglas no cubiertos se identifican en los resultados y documentos.

Esta documentación debe completarse con los datos del responsable de la aplicación, contacto y declaraciones de las tiendas antes de la publicación. Negocio cuenta con perfiles, registros, obligaciones, panel y nómina locales. Las pruebas físicas, los recorridos nativos comerciales aún no cubiertos y la preparación de distribución siguen pendientes; la distribución nativa en tiendas sigue pendiente; la web ya está publicada.

## Web app y sincronización opcional

En la web, la base funciona en memoria y se guarda cifrada en IndexedDB mediante AES-256-GCM y una contraseña local. El navegador puede eliminar su almacenamiento; es necesario conservar respaldos y contraseña.

Si el usuario activa el enlace y pulsa Sincronizar ahora, se envía una copia cifrada a su servicio de EduMoney. El secreto de acceso y la clave de descifrado son independientes; la clave de descifrado no se envía al servidor. Se guardan el objeto cifrado y metadatos técnicos de versión, tamaño y conexión. El proveedor de alojamiento procesa las conexiones HTTPS según su servicio. La sincronización no envía registros legibles. El lector opcional Gemini es un flujo separado y envía únicamente la foto autorizada para su lectura.

El código privado de enlace permite acceder a las copias: se comparte únicamente con dispositivos propios. Se puede desvincular el dispositivo o retirar la copia remota desde la app. Las exportaciones PDF/CSV/JSON de revisión siguen siendo legibles y se descargan solo cuando el usuario las solicita. La captura web mantiene la revisión manual. Gemini añade lectura remota solo tras activación y autorización recordada en ese dispositivo y navegador; el dictado no se envía a este lector.

## Acceso compartible sin cuenta de ChatGPT

Por petición del usuario, el código de la web se ofrece mediante enlace público, sin autenticación de ChatGPT. El alojamiento continúa en Sites (dominio chatgpt.site). Compartir la dirección no comparte el espacio local cifrado ni el código de sincronización. Cada navegador mantiene su propio espacio y contraseña; en un mismo perfil de navegador se trata del mismo espacio local. El servidor de sincronización sigue exigiendo el secreto privado de enlace y entrega únicamente su copia cifrada. No hay listado público de registros ni de copias.


## Lector opcional Google Gemini

Por elección expresa del usuario, la web permite usar Gemini con una clave propia de Google AI Studio. El modo inicial sigue siendo OCR local. La clave se introduce en Configuración → Lector de recibos y talonarios, permanece solo en memoria y se borra al recargar/bloquear/cerrar o volver a modo local. No se integra una clave compartida en el código ni se incluye en respaldos, registros financieros o URLs.

La primera lectura solicita autorización para enviar esa foto y las futuras fotos seleccionadas para Gemini. La elección se recuerda en ese navegador hasta retirarla o borrar sus datos. La foto preparada y la clave pasan por HTTPS al endpoint de lectura de EduMoney; el servidor las mantiene solo en la memoria de esa solicitud y envía la foto a Google, con la clave en un encabezado. El código no guarda imagen ni clave en almacenamiento del servidor ni escribe sus contenidos en logs. El alojamiento y Google procesan sus conexiones según sus servicios. La aceptación del nivel gratuito no significa retención cero por parte de Google: sus condiciones permiten usar datos para mejorar productos. No se envían fotos a Anthropic ni OpenAI.

Se utiliza gemini-2.5-flash, con nivel gratuito sujeto a límites y disponibilidad. EduMoney no activa facturación ni hace reintentos automáticos o cambios a modelos de pago. El usuario debe usar un proyecto sin facturación habilitada si desea mantenerse en el nivel gratuito. La app no puede comprobar la configuración de facturación del proyecto. Al agotarse la cuota, se informa el error y se conserva el formulario; el modo local sigue disponible por elección.

El resultado estructurado se valida y se muestra para revisión; no confirma que un pago haya ocurrido ni registra movimientos automáticamente. Los vacíos se conservan como desconocidos y no se calculan importes ausentes. Si se confirma el guardado, se conservan localmente los campos y, solo si se elige, la copia cifrada. Las exportaciones y sincronización mantienen sus reglas existentes. La respuesta no incluye campos estructurados de SSN/cuentas bancarias/nombre del empleado; la imagen autorizada puede contenerlos, por lo que el usuario puede recortar lo innecesario antes de enviarla.

Fuentes de configuración y condiciones: https://ai.google.dev/gemini-api/docs/pricing , https://ai.google.dev/gemini-api/terms , https://aistudio.google.com/api-keys .

La autorización de Gemini se conserva en localStorage, separada de la clave y de los datos financieros. No contiene fotos ni claves. Se puede retirar desde la configuración del lector; al hacerlo se activa el lector local. Otro navegador, dispositivo o borrar los datos requiere autorizar de nuevo. Si el almacenamiento está bloqueado, la elección solo se aplica a la lectura actual.
