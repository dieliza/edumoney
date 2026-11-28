# Revisión de seguridad y rendimiento — 2026-11-28

Alcance: login por correo, recuperación, sesiones, permisos administrativos, aislamiento de claves, políticas de acceso y recorridos de datos de Facturas/sincronización. No es una garantía de invulnerabilidad ni una prueba de penetración exhaustiva.

## Hallazgos
- Los intentos públicos sin sesión, con token falso, origen ajeno y cabeceras administrativas falsificadas fueron rechazados. Se exige correo confirmado y permisos administrativos verificados en servidor.
- Supabase: RLS habilitado; acceso al estado de cuenta limitado a columnas propias; funciones administrativas reservadas a service_role. Asesor de rendimiento sin observaciones. Protección contra contraseñas filtradas DESACTIVADA: pendiente de habilitar por el propietario en Auth. No existe herramienta autorizada de configuración para activarla en esta sesión.
- No se modificaron usuarios, contraseñas, balances, datos financieros, permisos o cuotas. No se enviaron correos.

## Cambios
- Política HTML contra incrustación por sitios ajenos, cambios de URL base y objetos incrustados. Conserva integración con ChatGPT, caché y streams de API.
- Consulta de identidad y estado con plazo de diez segundos por solicitud; error controlado y acceso cerrado si Auth falla; UUID estricto. Claves de usuario permanecen separadas.
- Facturas: lectura sin series pendientes evita una transacción, exportación completa y guardado cifrado innecesarios y su notificación de respaldo. Las operaciones reales siguen siendo transaccionales y cifradas.

## Validación
45 pruebas Vitest aprobadas; 9 login, 8 recuperación, 9 administración y 8 claves de espacio aprobadas. Ocho comprobaciones HTTP iniciales. Un arranque fallido de fixture por __dirname corregido, sin modificar producto para resolverlo. TypeScript y ESLint sin errores. Máximo autorizado:100 casos incluidas repeticiones.

No se pudo realizar una navegación visual ni medir tiempos en dispositivos reales: el entorno no ofrece la herramienta de navegador requerida. No se atribuyen porcentajes de aceleración. Recomendación posterior: medir navegación con cuentas ficticias en Safari/iOS, Chrome/Android y escritorio, y habilitar protección de contraseñas filtradas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Empaquetado
Se conserva cada ruta y payload estático, incluidos alias históricos. La expansión de la compresión se comparó byte por byte; no se eliminan funcionalidades. El único módulo frontend modificado es BillsStore1118; los controles de eliminación de deudas y los demás módulos permanecen iguales. Sin migraciones.

## Publicación
El primer intento (versión162) fue rechazado por el límite descomprimido de63.9MiB de la plataforma. No sustituyó la versión161. Se prepara un ajuste adicional de transporte Z85 que conserva los bytes de los recursos; la publicación final y su comprobación quedan pendientes hasta completar la validación.

## Estado al detener validaciones
La versión161 sigue en producción; la versión162 quedó guardada pero su despliegue falló. No se publicaron estas mejoras. Se completaron100 ejecuciones contando comprobaciones, repeticiones y arranques fallidos;93 aprobadas y7 fallos de fixtures/empaquetado documentados y corregidos parcialmente. Las79 pruebas funcionales dirigidas aprobaron. El paquete aún supera el límite y requiere otro ajuste de empaquetado y validación. Se solicitó ampliar el límite a120, pendiente de respuesta. No se ejecutaron comprobaciones adicionales después de alcanzar100.
