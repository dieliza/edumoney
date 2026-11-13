# Privacidad de EduMoney

EduMoney conserva los registros financieros y las copias elegidas en una base local cifrada con SQLCipher. La clave se guarda en el almacén seguro del dispositivo y no se exporta. No exige cuenta en línea, no utiliza servicios externos de IA y no sube automáticamente información a servidores. No se implementan notificaciones push; los recordatorios son locales.

La cámara, la voz, el calendario y los avisos se solicitan cuando se usan. El reconocimiento es local cuando el dispositivo ofrece esa capacidad; si no está disponible se ofrece entrada manual. Las fotos originales de la biblioteca del usuario permanecen bajo su control.

El usuario decide qué exportar y a qué aplicación o ubicación enviarlo. PDF, CSV y JSON de revisión son legibles; sus notas y descripciones pueden contener datos personales. Las copias de evidencias se incluyen solo por selección. El destino elegido por el usuario puede conservar lo recibido. Los temporales propios se eliminan al cerrar y se limpian al iniciar después de una interrupción.

El respaldo de recuperación es diferente: se cifra con una contraseña elegida por el usuario mediante AES-256-GCM y PBKDF2-HMAC-SHA256. EduMoney no guarda ni puede recuperar esa contraseña. El respaldo incluye todos los registros y documentos locales y no incluye la clave de SQLCipher. La recuperación reemplaza los datos locales solo tras selección, descifrado, revisión y confirmación expresa.

La revisión de reglas y resultados puede registrarla el usuario. No se exige que sea CPA para usar los cálculos disponibles. No se afirma certificación oficial ni se radica una planilla. Los campos o reglas no cubiertos se identifican en los resultados y documentos.

Esta documentación debe completarse con los datos del responsable de la aplicación, contacto y declaraciones de las tiendas antes de la publicación. Negocio cuenta con perfiles, registros, obligaciones, panel y nómina locales. Las pruebas físicas, los recorridos nativos comerciales aún no cubiertos y la preparación de distribución siguen pendientes; el proyecto no se ha publicado.

## Web app y sincronización opcional

En la web, la base funciona en memoria y se guarda cifrada en IndexedDB mediante AES-256-GCM y una contraseña local. El navegador puede eliminar su almacenamiento; es necesario conservar respaldos y contraseña.

Si el usuario activa el enlace y pulsa Sincronizar ahora, se envía una copia cifrada a su servicio de EduMoney. El secreto de acceso y la clave de descifrado son independientes; la clave de descifrado no se envía al servidor. Se guardan el objeto cifrado y metadatos técnicos de versión, tamaño y conexión. El proveedor de alojamiento procesa las conexiones HTTPS según su servicio. No se envían registros legibles ni se usan servicios externos de IA.

El código privado de enlace permite acceder a las copias: se comparte únicamente con dispositivos propios. Se puede desvincular el dispositivo o retirar la copia remota desde la app. Las exportaciones PDF/CSV/JSON de revisión siguen siendo legibles y se descargan solo cuando el usuario las solicita. La captura web propone una imagen para revisión manual; no añade reconocimiento remoto ni dictado en servidores.
