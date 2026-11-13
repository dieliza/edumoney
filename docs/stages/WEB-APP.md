# EduMoney web app

Rama de aplicación: `web-edumoney`, separada de main. Conserva Expo 58 y los módulos existentes. El usuario autorizó el 13 de noviembre de 2026 sincronización opcional de copias cifradas en un servidor.

## Arquitectura y funcionamiento

La web abre los formularios y almacenes reales, en lugar de las antiguas vistas de demostración. SQLite funciona en memoria mediante sql.js/WebAssembly; solo se persiste una imagen cifrada AES-256-GCM en IndexedDB. La contraseña local deriva la clave con PBKDF2-SHA256, 600000 iteraciones y sal aleatoria. Las claves no se guardan en texto legible. Cada escritura confirmada espera la persistencia cifrada; una escritura fallida conserva el estado anterior. Web Locks evita dos pestañas escritoras simultáneas.

Los módulos personales, Negocio, obligaciones, panel y nómina reutilizan reglas y relaciones existentes. Las exportaciones y respaldos se descargan como archivos seleccionados por el usuario. El PDF de planilla conserva los años y casos soportados; no radica ni reutiliza reglas de otro año.

La aplicación incluye manifiesto y service worker para añadirla a la pantalla de inicio. Solo se cachea el código estático y sus recursos; las rutas de sincronización y los registros financieros no se cachean. Se requiere HTTPS y un navegador moderno con WebCrypto, WebAssembly, IndexedDB y Web Locks.

## Sincronizar Android y Apple

Usar la misma web app en ambos dispositivos. Crear un espacio local y su contraseña en cada uno. En el primero, abrir Sincronizar, crear y guardar un enlace nuevo y pulsar Sincronizar ahora. Copiar el código privado al segundo, enlazar y sincronizar. El primer recibo de datos solicita revisar y confirmar REEMPLAZAR.

El código contiene un secreto de acceso y una clave de cifrado independientes. El servidor recibe el primero mediante Authorization y solo conserva una copia cifrada opaca en R2. La clave de descifrado nunca se envía. La configuración local del enlace también queda cifrada. Cada copia sincronizada se limita a 16 MB cifrados para conservar un margen de memoria seguro en el servicio; los respaldos locales mantienen su límite existente. No hay notificaciones push ni sincronización financiera sin activar y accionar por el usuario.

Las versiones ETag y las escrituras condicionales impiden sobrescrituras concurrentes. Si hay cambios distintos en ambos dispositivos, no se mezclan ni descartan silenciosamente: se muestra un conflicto y se solicita elegir y escribir REEMPLAZAR. La restauración comprueba dentro de la transacción que la copia local no haya cambiado mientras se consultaba la red. Se puede desvincular un dispositivo o retirar la copia remota confirmando ELIMINAR.

La APK anterior no incorpora este enlace automáticamente. Para compartir con ella, usar sus respaldos cifrados, o abrir la web app en Android. La sincronización de esta entrega es entre navegadores/PWA de Android y Apple.

## Diferencias de plataforma

- Cámara/archivo: selección local de imágenes JPG/PNG de hasta 4 MB; revisión manual de campos. No se añade OCR remoto.
- Voz: no se activa Web Speech Recognition porque el navegador no garantiza procesamiento local. Entrada manual disponible.
- Lectura: solo voces españolas identificadas por el navegador como locales.
- Calendario: descarga ICS genérico. Los avisos con la web cerrada no se implementan.
- Los datos del navegador pueden perderse al borrar almacenamiento o por decisiones del sistema. Conservar respaldos y contraseña; el almacenamiento persistente se solicita pero no se promete.

## Verificación acotada

1. Primer grupo: 8 casos aprobados de almacén y servidor.
2. Intercambio completo entre dos dispositivos simulados: primer intento excedió el límite de 5 segundos por las derivaciones criptográficas; se repitió con tiempo explícito y aprobó.
3. SQLite se cambió a WebAssembly embebido recomendado por sql.js; 5 casos pertinentes repetidos y aprobados, incluido el intercambio completo y los conflictos.
4. Se añadieron comprobaciones de alteración del cifrado y de cambios locales concurrentes, y se repitieron los cuatro casos del servidor tras endurecer su validación. Resultado final documentado en evidencia.

Total reservado: 23 casos/intentos, incluidas repeticiones. No se ejecutan suites completas ni recorridos nativos históricos. TypeScript, ESLint y exportación de producción se verifican antes de empaquetar.

El navegador administrado de Sites (`cua_repl.js`) no está disponible en este entorno. Conforme a la instrucción del plugin no se sustituye por otro servidor o controlador: la inspección visual web, la instalación en Safari/Chrome y la prueba física de cámara/archivos quedan pendientes. Las pruebas de sincronización usan dos almacenes SQLite reales en memoria, IndexedDB simulado y un servicio R2 simulado con control de versión; no equivalen a dos teléfonos físicos.

Sites conserva audiencia privada para este enlace de prueba. No se solicita publicación pública ni se modifica main. El sitio aloja el código de la app; su servicio almacena exclusivamente copias cifradas elegidas por el usuario.

## Enlace desplegado

https://edumoney-web.diegoluissantospabon.chatgpt.site

Despliegue privado de Sites confirmado como succeeded, con almacén R2 BUCKET. Proyecto `appgprj_6af65a2177c48191b95b917e1ca2a2f0`; fuente de alojamiento `85df66b83901c82374ef1ccfb7e0ae36fea34f40`. La aplicación está en la rama `web-edumoney`, código `20044e9`.

El acceso de prueba requiere la cuenta de ChatGPT propietaria en ambos dispositivos. Esto no crea una cuenta de EduMoney. Mantener audiencia privada; no se publica para terceros. Para instalar: abrir en Safari de iPhone/iPad y usar Compartir → Añadir a pantalla de inicio; en Chrome Android, menú → Instalar aplicación o Añadir a pantalla de inicio, según el dispositivo.

Los auxiliares de empaquetado descritos en la habilidad Sites no estaban montados en este entorno. Se mantuvo la credencial temporal exclusivamente en memoria/entrada protegida y se preparó el repositorio y tar del mismo código mediante Git estándar y tar. Dos validaciones de archivo detectaron el tipo de vínculo R2 y la estructura del archivo; se corrigieron antes de desplegar. Se conserva el mismo proyecto y audiencia. Tres intentos de empaquetado/publicación, el último correcto; conteo conservador ampliado a 26 comprobaciones/intentos si se incluyen estas validaciones junto a las 23 verificaciones de aplicación.

La confirmación del despliegue no equivale a una prueba física de Safari/Chrome ni a una inspección visual del navegador. Las funciones nativas no disponibles en web mantienen alternativas e información explícita; la APK anterior sigue siendo independiente.

## Corrección de entrega de HTML

La captura del usuario mostró bytes comprimidos como texto. Se corrigió el Worker para descomprimir los recursos en el servidor y entregar sus bytes reales sin exigir Content-Encoding al navegador o al proxy de acceso. Los datos locales y la sincronización no se modifican.

Tres comprobaciones directas del artefacto aprobadas: HTML legible con manifiesto, firma PNG del logo y JavaScript legible. TypeScript y ESLint aprobaron. La comprobación anterior que descomprimía manualmente la respuesta no detectaba este problema de entrega; esta revisión valida directamente el cuerpo que recibe el cliente. Sigue pendiente la inspección visual física del navegador.

Sitio actualizado en la misma URL, fuente de alojamiento `c91bd80967dcceb3e825a538ffae2642d7579cd4`, despliegue confirmado succeeded.
