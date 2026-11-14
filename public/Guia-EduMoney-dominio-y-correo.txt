# EduMoney: dominio propio y recuperación por correo

## Qué hay listo y qué falta

EduMoney ya es una web app: https://edumoney-web.diegoluissantospabon.chatgpt.site . El dominio propio le dará una dirección de tu marca; no exige instalar una APK. Safari/iPad, iPhone y Android pueden usar la misma dirección y añadirla a su pantalla de inicio.

Propuesta: **https://edumoney.prbudget.org** para la aplicación y **EduMoney <acceso@prbudget.org>** para mensajes de acceso. Si controlas prbudget.org, no necesitas comprar otro dominio. Compartir el dominio principal no mezcla las aplicaciones ni sus datos: EduMoney debe tener su propio despliegue, almacenamiento y servicio de cuentas.

Hoy el acceso protege una base local cifrada, sin cuenta de correo. Corregimos el campo y la repetición del acceso, pero todavía no se envían emails de recuperación. El botón «Olvidé mi contraseña» da información sin borrar, crear un espacio vacío ni pedir escribir RESTABLECER.

## 1. Antes de cambiar la dirección

1. Conserva el enlace actual funcionando.
2. Desde la sesión actual, crea un respaldo cifrado de EduMoney y comprueba que conservas su contraseña. Si usas sincronización, conserva también tu código privado de enlace.
3. Revisa qué proveedor administra DNS de prbudget.org y qué registros usa PR Budget. Conserva su lista antes de cambiar nada.
4. Usa únicamente un subdominio libre para EduMoney. No sustituyas la web principal ni los registros de Vercel, correo o verificación de PR Budget.

**El cambio de dirección no traslada los datos locales automáticamente.** Cada dominio tiene su propio almacenamiento. En el dominio nuevo se debe restaurar el respaldo o recibir una copia mediante sincronización. No borres el navegador ni el enlace antiguo hasta verificar datos, imágenes, deudas y talonarios en la nueva dirección. La clave de Anthropic se vuelve a configurar una vez en el navegador del dominio nuevo; no va en el respaldo.

## 2. Publicar un alojamiento independiente

Ruta preparada: Cloudflare Workers con archivos estáticos y R2 para las copias de sincronización cifradas. Así se reutilizan los endpoints actuales sin convertirlos a otro servidor. La configuración de ejemplo **no ha sido desplegada** ni cambia la publicación actual.

Archivos preparados:

- `deploy/cloudflare/worker.mjs`: enruta sincronización, lectura y activación de Anthropic; sirve la web desde ASSETS.
- `wrangler.example.jsonc`: ejemplo de despliegue sin credenciales y sin dominio activado.

Pasos para quien configure el alojamiento:

1. Crear un proyecto independiente de EduMoney en tu cuenta de Cloudflare. Revisar precios y límites del plan antes de habilitar servicios de pago.
2. En el repositorio EduMoney, trabajar sobre la rama de desarrollo aprobada; no cambiar GitHub main ni el proyecto PR Budget para este paso.
3. Instalar Wrangler como dependencia de desarrollo y autenticarlo con tu propia cuenta. No pegar tokens en chats ni subirlos al repositorio.
4. Copiar `wrangler.example.jsonc` a una configuración local `wrangler.jsonc`. Ajustar nombre de Worker y bucket si ya existen recursos con esos nombres.
5. Crear un bucket R2 privado para EduMoney, por ejemplo `edumoney-sync`, y asociarlo al binding `BUCKET`. **No habilitar acceso público al bucket.** No reutilizar el de PR Budget ni asumir que contiene las copias del alojamiento actual.
6. Ejecutar `npm run build:web` para generar `dist-web`.
7. Revisar la configuración y desplegar con `npx wrangler deploy --config wrangler.jsonc` desde la raíz del proyecto. No utilizar el Worker grande con archivos embebidos generado para Sites: este ejemplo sirve los archivos como assets separados.
8. Abrir la dirección de prueba del Worker y comprobar: acceso, guardar/reabrir un registro ficticio, fotos, rutas internas, recarga, activación de Anthropic y sincronización en dos navegadores. La prueba real de Anthropic requiere tu clave/saldo y autorización de foto.

Los endpoints `/api/*` deben ejecutar el Worker antes del fallback de la web; no deben responder con index.html. El servidor sigue recibiendo únicamente la clave de Anthropic del solicitante, sin una clave central pública. No habilitar una credencial central hasta implementar autenticación y cuotas por usuario.

## 3. Conectar edumoney.prbudget.org

1. En el Worker de EduMoney, abrir **Settings → Domains & Routes → Add → Custom Domain** y añadir `edumoney.prbudget.org`.
2. Cloudflare requiere que la zona del dominio sea compatible y esté activa en tu cuenta para esta ruta. Si los DNS actuales están en otro proveedor, revisar primero las opciones de alojamiento/DNS: no cambiar nameservers sin trasladar y validar todos los registros existentes de PR Budget y correo.
3. Cloudflare crea los registros necesarios y emite el certificado según su flujo de Custom Domains. Usar los valores que muestre el panel; no inventar un registro CNAME a workers.dev.
4. Esperar a que el dominio y HTTPS aparezcan activos. Abrir `https://edumoney.prbudget.org`, recargar una ruta interna y verificar acceso/cámara.
5. Conservar el origen anterior durante la transición y completar el traslado de datos de la sección 1. Actualizar accesos directos/PWA cuando las comprobaciones pasen.

Si se elige otro alojamiento, debe soportar tanto la web como sus tres endpoints y almacenamiento privado. Subir solo index.html a un website estático dejaría sin lectura de Anthropic y sin sincronización al proyecto.

## 4. Habilitar recuperación por email

Un dominio o un buzón por sí solos **no implementan** recuperación. Hace falta un servicio de cuentas y un servicio de envío transaccional.

1. Elegir y configurar un proveedor de autenticación administrada con email verificado, enlaces de recuperación de un solo uso, caducidad y revocación de sesiones. Crear usuarios propios de EduMoney, independientes de PR Budget.
2. Elegir el proveedor de correo transaccional; Resend es una opción. Añadir y verificar el dominio de envío. Usar los valores SPF/DKIM y la política DMARC que correspondan en su panel; no crear dos registros SPF para el mismo nombre ni reemplazar los MX del correo actual de PR Budget.
3. Configurar remitente **EduMoney <acceso@prbudget.org>** solo después de verificar el dominio. Si se usa un subdominio para aislar el envío, ajustar el remitente a ese dominio verificado. Crear o comprobar un buzón/reenvío real para recibir respuestas; verificar el dominio de envío no crea un buzón automáticamente.
4. Guardar credenciales de envío y secretos administrativos exclusivamente en el servidor. La clave pública del proveedor de cuentas, cuando aplique, no sustituye a esos secretos.
5. Registrar la URL final del sitio y una URL de retorno de recuperación exacta, por ejemplo `https://edumoney.prbudget.org/auth/recovery`. Esa ruta todavía debe implementarse. Autorizar únicamente orígenes previstos; no aceptar redirecciones arbitrarias.
6. Implementar «Olvidé mi contraseña»: pide email, responde de forma neutra exista o no, limita solicitudes y envía un enlace de un solo uso. El correo debe indicar EduMoney, propósito, caducidad y qué hacer si no se solicitó.
7. Al abrir el enlace válido, permitir establecer la contraseña nueva sin pedir la anterior ni escribir RESTABLECER; impedir reutilizar enlaces y ofrecer reenvío si caducaron.
8. Comprobar entrega real, rebotes y spam, expiración, reutilización, límites y acceso desde Safari y Android. No mostrar «correo enviado» si el backend no pudo tramitar la solicitud.

## 5. Recuperar también los datos cifrados

**Restablecer la cuenta por correo no descifra la base local protegida por la contraseña anterior.** Antes de prometer recuperación completa hay que implementar y probar cómo recuperar la clave de cifrado de los datos.

Debe elegirse un diseño explícito, por ejemplo una clave de recuperación independiente o un mecanismo de recuperación de la clave de datos aprobado por el usuario. Si se introduce custodia por servidor, debe explicarse quién podría descifrar y obtener autorización; no cambiar silenciosamente la privacidad acordada. Los enlaces de email nunca deben contener una clave de datos, de API o el código privado de sincronización.

La migración de los espacios actuales requiere abrirlos con su contraseña vigente o usar un respaldo descifrable, asociarlos a la cuenta verificada y confirmar que el mecanismo de recuperación permite reabrirlos tras un restablecimiento. Probarlo con datos ficticios antes de aplicarlo a registros reales. Un restablecimiento que cree una base vacía no satisface este requisito.

## Resultado esperado

- Dirección propia e independiente para EduMoney, sin afectar PR Budget.
- Entrar con una sola contraseña en cada acceso; sesión ya abierta reutilizada.
- Recuperar acceso por email sin pedir contraseña anterior ni palabra de confirmación.
- Datos cifrados recuperables mediante el mecanismo acordado, sin promesas falsas de recuperación.
- Anthropic separado de la contraseña del usuario, con claves protegidas y límites de consumo cuando se use una clave central.

## Fuentes oficiales consultadas

- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/wrangler/commands/
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/dashboard/domains/manage-domains

Documento preparado el 14 de noviembre de 2026. No se cambiaron DNS, dominio, cuentas, correo, recursos R2 ni facturación. El ejemplo de Cloudflare no se ha desplegado; la app continúa publicada en el enlace actual de Sites.

Destino actual de las solicitudes de ayuda de EduMoney: **info@prbudget.org**. El botón abre un borrador en la aplicación de correo del usuario; no es un restablecimiento automático ni confirma entrega. El remitente propuesto para un futuro servicio de acceso es un ajuste separado.
