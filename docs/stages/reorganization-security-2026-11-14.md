# Reorganización y seguridad — EduMoney, 14 de noviembre de 2026

Solicitud autorizada: ordenar los temas, reunir deudas, centralizar configuración, mejorar seguridad y captura de fotos, compactar los menús y mantener las gráficas con formatos alternos. Se amplía la arquitectura existente; no se reconstruye la aplicación ni se cambian precios, cálculos contributivos, registros financieros o autenticación por email. No se contratan servicios ni se activan recargas.

## Organización implementada

| Sección | Responsabilidad y accesos |
| --- | --- |
| Mi dinero | Disponible, ingresos, gastos, gráficas y transacciones. Transferencias propias conservan su formulario. El botón principal dice Deudas. La vista de próximas facturas muestra las generales. |
| Deudas | Deudas, calendario, simulador de pagos, plan de 30 días, avisos y herramientas. Incluye facturas vinculadas y sus recordatorios, préstamo/auto/vivienda, aprendizaje sobre deudas y movimientos de préstamos o pagos sin vínculo. |
| Mis metas | Metas existentes y entradas a simuladores de ahorro y fondo de emergencia. |
| Aprende | Contenido general; los consejos y las cinco lecciones de deuda/crédito/préstamos/auto/vivienda se presentan desde Deudas. Identificadores, versiones, preguntas y progreso se conservan. |
| Mi progreso | Reconocimientos, avance y revisiones existentes. Los consejos del ciclo se contabilizan entre todos los temas. |
| Negocio | Conserva sus perfiles, proyectos, contabilidad, obligaciones y nómina. |
| Configuración | Engranaje circular junto al selector claro/oscuro; pestañas Seguridad, API e IA, Datos, Apariencia, Privacidad y Ayuda. Contraseñas separadas de API. Copias, sincronización y Reiniciar quedan en Datos. |

Los pagos reales de una deuda se registran desde su ficha. Otros movimientos conserva el registro contable genérico de préstamos recibidos/pagos no vinculados: no se afirma que reduzcan automáticamente un saldo. Todos los movimientos siguen en el historial general y en los mismos cálculos; se reorganiza la navegación, no los importes.

Las facturas de deuda usan la ruta existente con `scope=debts`; las generales permanecen en Mis facturas. Los datos no se eliminan ni se trasladan a tablas diferentes. Las series y su programación mantienen el servicio existente. Las pestañas usan desplazamiento horizontal y los accesos nuevos combinan tarjetas rectangulares e iconos circulares. La flecha de regreso y la X de las fichas se conservan. Las barras grandes de Sincronizar y Bloquear se retiran del encabezado global: sus funciones están en Datos y Seguridad, respectivamente, para compactar el espacio y centralizar los ajustes.

## Gráficas

El botón de formato en el recuadro alterna círculo, barras horizontales y columnas verticales. El botón de capas sigue cambiando entre ingresos/gastos, distribución y categorías. Los importes provienen del mismo modelo mensual; no se recalculan ni se alteran los totales. Los formatos de una categoría usan los mismos diez movimientos más recientes y aclaran que el total incluye todos. Las cifras, etiquetas accesibles y vistas vacías permanecen disponibles.

## Fotos

- Indicador de actividad y barra de color indeterminada mientras se analiza: no se inventa un porcentaje de avance.
- La animación de la barra respeta movimiento reducido. El estado aclara que el usuario revisa antes de guardar; no se publica ni se confirma un pago automáticamente.
- Repetir foto desde la revisión conserva el formulario si se cancela el selector. Solo una nueva captura válida reemplaza la propuesta.
- Errores de una nueva lectura son visibles también dentro de la ficha; repetir selección permite reintentar el mismo archivo.
- Se impiden lecturas simultáneas en el flujo de documentos. Los resultados de una pantalla abandonada se ignoran. La pausa de la app al abrir la cámara del sistema no descarta la captura: se separó el control de captura del de dictado.
- El lector Anthropic, modelo, interpretación, consentimiento y almacenamiento de imágenes se conservan. No se realizaron llamadas reales facturadas en las pruebas.

## Seguridad implementada y comprobada

### Contraseña y acceso

El acceso sigue siendo local, con cifrado AES-GCM y derivación PBKDF2 de 600000 iteraciones existente. Una contraseña incorrecta muestra un mensaje claro con recomendación de verificar el ojo. Un error criptográfico también puede indicar alteración de la copia; no se oculta esa posibilidad ni se elimina el espacio.

Después de tres intentos fallidos se ofrecen alternativas, sin bloqueo ni borrado. Se comprobó que la contraseña correcta sigue abriendo los mismos datos. No hay intentos de enviar contraseñas por email ni una palabra de confirmación que permita sustituirlas sin recuperar el cifrado.

Bloqueo por inactividad opcional: manual (predeterminado), cinco o quince minutos. Interacciones y desplazamiento mantienen la actividad. Al bloquear se recarga y protege la sesión; los formularios sin guardar pueden perderse, como advierte el ajuste. No se impuso un bloqueo nuevo por defecto.

### Face ID, huella o verificación del dispositivo en la web

Se implementó WebAuthn con autenticador de plataforma, verificación del usuario requerida y extensión PRF. El sistema puede elegir Face ID, huella o su método de verificación disponible; EduMoney no recibe datos biométricos. Primero se verifica la contraseña actual localmente para habilitar la opción.

La salida secreta PRF protege con AES-GCM una envoltura de la contraseña en un IndexedDB separado de la base financiera. Solo el autenticador puede dar la clave necesaria; no basta simular un botón de autenticación. No se transmite al servidor ni se incluye en respaldos/sincronización. El nombre de la credencial es genérico, sin email. Un navegador que verifica identidad pero no entrega el secreto PRF no queda anunciado como activado; la contraseña sigue disponible.

Cambiar la contraseña invalida y retira la envoltura anterior. Un espacio restablecido no hereda biometría. Cada navegador/PWA y dominio requiere su propia configuración; borrar su almacenamiento o cambiar de dominio no se repara con la huella. La cancelación no borra la configuración y conserva la alternativa de contraseña.

Las pruebas usan WebCrypto real y un autenticador simulado: verifican cifrado, persistencia de datos, verificación requerida, reapertura, cancelación, falta de PRF e invalidación. **No sustituyen la prueba física en iPad, Safari/PWA, Android y sus versiones de navegador.**

La APK nativa existente mantiene el almacén seguro del sistema. No se añadió una barrera nativa sin alternativa que pudiera dejar datos inaccesibles al cambiar huellas. Una habilitación biométrica propia de esa APK requiere una compilación e integración nativa compatibles; la pantalla distingue esta limitación de la web. No se ha entregado una APK nueva en esta etapa.

### API y administración

La configuración del lector reutiliza el componente existente y su clave cifrada; no monta campos de cambio de contraseña en la pestaña API. Las claves y la credencial del dispositivo administrador siguen fuera de respaldos y sincronización. No se reduce la autorización de servidor para administración ni se usa la contraseña local como prueba de propiedad de un servidor compartido. No se modificaron secretos, permisos ni el estado del generador de consejos en esta etapa.

### Correo y recuperación: estado real

No se envió ningún mensaje. La solicitud de ayuda abre un borrador de correo a `acceso@prbudget.org` que la persona revisa y envía con su aplicación. El texto no incorpora contraseñas, claves de API ni documentos financieros. La interfaz no afirma que haya llegado ni que se haya restablecido una contraseña.

Inspección de infraestructura existente, solo lectura:
- Resend: `prbudget.org` verificado, envío habilitado, recepción en Resend desactivada.
- DNS MX público: `mx1.spacemail.com` y `mx2.spacemail.com`. La recepción del dominio apunta a SpaceMail; que Resend no reciba no demuestra que el dominio carezca de correo.
- Falta confirmar que el buzón `acceso@prbudget.org` existe, permite recepción y alguien puede consultarlo. No se cambió DNS, MX ni servicios de PR Budget.

La recuperación automática completa queda **pendiente**, no activa. Para conservar el cifrado que solo los dispositivos puedan abrir, se necesita registro opcional de correo verificado más un mecanismo de recuperación (por ejemplo, una clave de recuperación guardada por el usuario o un dispositivo ya autorizado). Cambiar la contraseña por email sin recuperar la clave no descifra los datos antiguos. No se decidió almacenar en el servidor una clave capaz de descifrar las finanzas; ese cambio alteraría la privacidad aprobada.

Arquitectura de la siguiente etapa de recuperación: correo verificado y vinculado a un identificador aleatorio, enlace/token de un solo uso con caducidad, límites de solicitudes, respuestas sin revelar si una cuenta existe y una envoltura cifrada cuya apertura requiera la clave de recuperación del usuario. El servicio puede usar el remitente ya verificado cuando se configure un secreto de envío y se confirme el buzón; no hay necesidad de contratar un plan nuevo para diseñarlo. La petición de ayuda actual no suplanta este sistema.

La bienvenida también se corrigió: una instalación real no se presenta como demostración ni promete «sin inteligencia artificial» cuando existe un lector externo opcional. La descripción distingue registros cifrados, sincronización y lectura asistida opcionales.

### Riesgos existentes que se mantienen explícitos

- La copia cifrada intercambiada entre dispositivos es una base completa, no una fusión de cambios offline. Elegir una copia anterior puede retroceder datos; no se modificó ese sistema financiero.
- Un respaldo antiguo no contiene información añadida después. Se actualizó la ayuda de restauración a las versiones 9–18 y se advierte sobre progreso educativo ausente.
- La protección del navegador y su dominio sigue siendo esencial: el cifrado en reposo no protege frente a código malicioso ejecutado dentro de una sesión abierta. No se añadieron dependencias visuales ni servicios de terceros nuevos; las lecturas de imágenes siguen siendo propuestas que requieren revisión.
- Este bloque revisa los flujos tocados y sus controles; no se declara una auditoría de penetración completa ni compatibilidad biométrica universal.

## Archivos principales

`src/ui/components.tsx`, `NavigationRail.tsx`, `MonthlyCharts.tsx`, `ChartBars.tsx`, `PhotoAnalysis.tsx`, `StorageGate.web.tsx`; módulos `settings`, `debts`, `bills`, `decisions`, `goals`, `learning`, `education/topics.ts`, `money`, `documents` e `income`; `src/web/{biometrics,recoveryContact,securityPreferences,vault}.ts`; ruta `debt-lessons.tsx` y ayuda de `backup`.

Se excluyeron salidas generadas de TypeScript en `tsconfig.json`: el compilador estaba incluyendo archivos de `dist-web` que Expo reemplazaba durante la exportación. La comprobación sigue cubriendo fuente y pruebas; no analiza bundles generados como si fueran fuente.

Sin migración del esquema financiero (permanece 18). Nuevo almacén local opcional exclusivamente para la envoltura biométrica. Reversión de navegación mediante Git; antes de cambiar versiones o restaurar datos conviene conservar un respaldo cifrado. GitHub main no se modifica.

## Verificación y presupuesto

90 casos distintos correctos, 93 ejecuciones automáticas incluidas repeticiones; máximo autorizado 100. Se corrigió un fallo en el montaje de un caso de prueba que no persistía su transacción SQL; el flujo real usa transacciones separadas y el caso corregido confirmó conservación de datos. Pruebas: aprendizaje (23), metas (19), deudas (23), respaldos (5), gráficas/modelo (4), clave de API cifrada (4), biometría (7), temas (2), preferencias (2), tres intentos sin borrado (1). Repeticiones: caso de persistencia biométrica, invalidación por cambio de contraseña y reset de API. No lanzar otra suite general.

TypeScript y ESLint completos; compilación web y sintaxis del Worker empaquetado requeridas para la publicación. Sin navegador compartido administrado (`cua_repl.js` no disponible); no se instalaron navegadores como sustituto ni se afirmaron capturas visuales o pruebas físicas. Las validaciones HTTP de publicación, si se realizan, se añaden al presupuesto antes de cerrar.
