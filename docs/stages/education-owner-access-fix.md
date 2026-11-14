# Acceso del propietario — 2026-11-14

El usuario indicó que se detenía en «Abrir acceso de propietario». El enlace anterior sí redirigía al acceso de OpenAI (302, destino de login 200), pero su estado de retorno apuntaba a `/` en vez del panel. Se confirmó con una solicitud sin iniciar sesión que `?return_to=%2Feducation-admin` conserva como destino el panel administrativo.

Cambios compatibles y acotados:
- Botón visible «Iniciar sesión de propietario» con enlace normal, navegación superior y retorno explícito al panel.
- Alternativa para abrir el panel en otra pestaña e instrucciones para Safari/Chrome fuera del visor de ChatGPT.
- Revalidación del acceso al regresar a la ventana; no modifica la contraseña local ni la configuración de API.
- Al perder autorización, limpia el estado administrativo mostrado.
- App `2026.11.14.08`.

Comprobaciones de este bloque: dos recorridos HTTP sin credenciales (redirección y retorno), TypeScript, ESLint, compilación PWA, sintaxis Worker y diff correctos. Sin nuevas suites ni intentos de iniciar sesión por el usuario. Safari/iPad requiere confirmación del propietario; el navegador compartido no está disponible. No se elimina ni se reduce la autorización administrativa. GitHub main intacto.
