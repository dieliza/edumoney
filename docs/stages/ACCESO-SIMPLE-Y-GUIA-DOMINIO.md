# Acceso web y guía de dominio

## Cambios

El campo de acceso usa ahora un input HTML estable con etiqueta enlazada, tamaño mínimo de 56 px, tipografía de 18 px, nombre de formulario y autocomplete current-password. El botón Ver no envía el formulario. Crear un espacio usa new-password y confirmación inicial; entrar a uno existente muestra una sola contraseña. Mientras se consulta el almacenamiento se presenta un indicador, sin campos que cambien mientras se empieza a escribir.

El envío lee FormData para recoger también autocompletados de Safari que no notificaran onChange. Un ref impide dos aperturas por doble toque antes de actualizar React. La contraseña permanece si falla la apertura y se retira tras abrir. StorageGate consulta isWebVaultUnlocked al montarse y reutiliza la conexión abierta, evitando otra petición de contraseña por remontar la navegación. Recargar o bloquear reinicia la sesión y exige el desbloqueo normal: no se guarda la contraseña ni se debilita el cifrado.

«Olvidé mi contraseña» ya no conecta con el restablecimiento local ni solicita la palabra RESTABLECER. Muestra ayuda y el estado real: el correo de recuperación no está configurado, no se envía un email ni se cambia o vacía la base. El método interno anterior se conserva para compatibilidad y sus pruebas, sin exponerlo como recuperación por correo. SecuritySettings actualiza su explicación.

## Instrucciones entregadas

- docs/WEBSITE-Y-RECUPERACION.md y copia pública Guia-EduMoney-dominio-y-correo.txt: subdominio edumoney.prbudget.org, separación de PR Budget, preparación del alojamiento, traslado de datos entre orígenes, acceso@prbudget.org, DNS SPF/DKIM/DMARC, autenticación y recuperación real de claves de cifrado.
- deploy/cloudflare/worker.mjs y wrangler.example.jsonc: ejemplo de alojamiento compatible con los endpoints existentes y R2 privado. Sintaxis del Worker comprobada. No se desplegó este ejemplo, no se cambiaron DNS ni se crearon servicios, cuentas o correo.
- Marcador 2026.11.14.04.

La recuperación por email requiere servicio de cuentas, correo y mecanismo para recuperar también los datos cifrados. Un dominio no proporciona estas funciones automáticamente. La guía identifica estos pendientes sin prometer que cambiar una contraseña por correo descifre los registros actuales.

## Verificación

21 ejecuciones de casos aprobadas, incluida una repetición dirigida tras ajustar el efecto para ESLint; máximo de 100 respetado. 12: acceso, campos web y conservación de API cifrada; 8: regresiones de bóveda, contraseña, enlace, restablecimiento interno y foto/deuda; 1 repetición: remontar la pantalla ya desbloqueada. Sin suite general ni CI.

Se probó login con un campo, autocompletado en el envío, doble toque, error y reintento sin borrar contraseña, sesión ya abierta, ayuda sin restablecimiento y ausencia de campo prematuro. Los campos se verificaron mediante render estático y los eventos de acceso con componentes básicos simulados; bóveda y cifrado con IndexedDB de prueba y WebCrypto.

No se probó Safari/iPad físico ni PWA instalada; no hay herramientas de navegador Sites disponibles. No se afirma reproducción visual del fallo en el dispositivo. No se envían correos ni fotos y no se modifica GitHub main.

TypeScript, ESLint, git diff --check y compilación web correctos. La guía pública coincide con el documento escrito; se empaqueta como texto UTF-8. No se realizó despliegue de Cloudflare ni cambio de dominio.

Publicada el 14 de noviembre de 2026 a las 01:58 UTC. Versión alojada 22, marcador 2026.11.14.04. Fuente 0c20ff98d3e06e8f82e455191fe82c18dfc3f465; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_d1200cf8afe081918703ac3ae59c272c; despliegue appgdep_6af7c04da7448191aa7db529a986b791, succeeded. Audiencia pública conservada. Guía https://edumoney-web.diegoluissantospabon.chatgpt.site/Guia-EduMoney-dominio-y-correo.txt .
