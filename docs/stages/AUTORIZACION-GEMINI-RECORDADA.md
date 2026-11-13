# Autorización recordada para Gemini

La primera lectura solicita autorización explícita para esa foto y futuras fotos seleccionadas para el lector Gemini. Se guarda únicamente una marca versionada en localStorage, sin fotos ni clave. Las siguientes lecturas consultan esa marca y no vuelven a mostrar el diálogo, incluso tras recargar o cerrar el navegador.

Configuración del lector permite retirar la autorización y activa el OCR local, eliminando la clave de sesión. Otro navegador/dispositivo, borrar los datos o almacenamiento bloqueado requieren preguntar de nuevo. La clave de Gemini continúa siendo temporal; esta mejora no la persiste.

Pruebas: 10 casos aprobados (consentimiento y cliente), incluidos persistencia al recargar módulo, revocación, cancelación, almacenamiento bloqueado y ausencia de envío sin autorización. Sin pruebas físicas ni envío real a Google. No se modificaron registros financieros ni GitHub main.
