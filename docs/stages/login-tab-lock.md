# Acceso y exclusión entre pestañas — 2026-11-14

Versión de aplicación: 2026.11.14.15. El propietario mostró Safari/iPad con dos pestañas de EduMoney y el error «EduMoney está abierto en otra pestaña». La verificación de rostro podía completarse, pero la apertura local fallaba al adquirir la exclusión de escritura. No es evidencia de contraseña incorrecta.

## Corrección

- Se conserva el mismo bloqueo Web Locks edumoney-vault-session, sin robarlo ni permitir dos escritores simultáneos.
- Las aperturas que fallan antes de establecer la conexión liberan su bloqueo. Antes, una contraseña incorrecta, una contraseña inicial corta u otro fallo podían mantenerlo hasta cerrar/recargar la pestaña.
- La pantalla permite esperar hasta 30 segundos a que se cierre la otra pestaña. Muestra «Esperando a la otra pestaña», instrucciones visibles y «Cancelar espera». Al liberarse el bloqueo, continúa el mismo intento con contraseña o biometría, sin repetir la credencial. Si vence o se cancela, el formulario vuelve a estar disponible.
- Los errores tienen borde visible; no se restablece la contraseña ni se borran datos.
- No se alteraron cifrado, registros, clasificación financiera, API, migraciones ni requisitos de Face ID/huella. El usuario autorizó reparar el acceso; no se eliminó la protección existente.

## Pruebas

Siete casos aprobados, sin suite completa:

- vault-tab-access.test.ts: cinco casos con Web Locks simulado: exclusión entre pestañas; liberación y reapertura; espera y continuación; cancelación sin liberar otra pestaña; timeout sin quitar la protección; apertura fallida libera el bloqueo y permite reintento (varias comprobaciones agrupadas en cinco casos).
- biometrics.test.ts, selección «verifica la contraseña, exige»: un caso de regresión. Verificación requerida, secreto cifrado y reapertura de datos sin otra contraseña; autenticador simulado, no Face ID físico.
- web-vault.test.ts, selección «crea datos reales, cifra y recupera»: un caso. Cifrado real, contraseña incorrecta rechazada y reapertura de los registros conservados.

TypeScript y ESLint aprobados. Compilación web/PWA aprobada. No se comprobó un iPad físico ni la biometría real del propietario; no hay navegador interactivo soportado en este entorno.

El uso inmediato en versiones anteriores sigue siendo cerrar la otra pestaña de EduMoney (o usar Cerrar sección en ella) y pulsar Entrar aquí. No borrar datos de Safari ni cambiar la contraseña para resolver esta exclusión.
