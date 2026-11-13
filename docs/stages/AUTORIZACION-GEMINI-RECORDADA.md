# Autorización recordada para Gemini

La primera lectura solicita autorización explícita para esa foto y futuras fotos seleccionadas para el lector Gemini. Se guarda únicamente una marca versionada en localStorage, sin fotos ni clave. Las siguientes lecturas consultan esa marca y no vuelven a mostrar el diálogo, incluso tras recargar o cerrar el navegador.

Configuración del lector permite retirar la autorización y activa el OCR local, eliminando la clave de sesión. Otro navegador/dispositivo, borrar los datos o almacenamiento bloqueado requieren preguntar de nuevo. La clave de Gemini continúa siendo temporal; esta mejora no la persiste.

Pruebas: 10 casos aprobados (consentimiento y cliente), incluidos persistencia al recargar módulo, revocación, cancelación, almacenamiento bloqueado y ausencia de envío sin autorización. Sin pruebas físicas ni envío real a Google. No se modificaron registros financieros ni GitHub main.

ESLint, TypeScript, compilación web y diff check correctos. Publicada versión 17, marcador 2026.11.13.15, el 2026-11-13 a las 23:37 UTC. Fuente 598c238a5f88a9e626f41269069b6ffebb8b1515; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_18858f3595888191a9a42987185c1118; despliegue appgdep_6af79f4c66cc8191a02be0e1c416663d, succeeded. Audiencia pública conservada.
