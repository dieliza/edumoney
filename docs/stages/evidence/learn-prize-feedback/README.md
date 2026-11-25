# Aprende: premio, texto, fuegos artificiales y próxima lección

25 de noviembre de 2026. Base pública: versión 102, commit 3c6ce1031c31dc5e00b838f6375a2c2488136020. Se conservaron los premios existentes y las demás actualizaciones públicas.

Cada uno de los diez premios por consejos incluye ahora su símbolo grande, nombre y mensaje propio. La primera respuesta correcta presenta el premio y tres explosiones con doce partículas cada una, dos rondas finitas. Al terminar (3.5 s) se muestra «Ya puedes continuar a la próxima lección» y un botón que abre el siguiente consejo pendiente de esa sección. Sin animaciones o con movimiento reducido, el premio y la opción de continuar aparecen sin demora. Si se completó toda la sección, se indica y se ofrece volver a Aprende. Una respuesta incorrecta, solo marcar leído o repetir un consejo no entrega premios adicionales.

Los cambios se limitaron al módulo EducationPanel desplegado y un CSS. Se añadió texto a los datos de premios; no se alteraron bases de datos, contabilidad, respuestas correctas ni reglas de progreso. El empaquetador comprueba que todas las rutas anteriores, salvo HTML y alias del service worker, conservan sus hashes. Se renuevan únicamente el bundle activo, CSS y caché; se conserva la activación segura de actualizaciones.

Verificaciones: script check-prize-fireworks.mjs sobre el módulo realmente empaquetado: diez mensajes/títulos exactos, orden de premios, no premiar leído/incorrecto/repetido, siguiente consejo, fin de premios al décimo, reducción de movimiento y conservación de progreso/logros anteriores. Sintaxis Node del Worker y compilación Python aprobadas. TypeScript aprobado; ESLint sin errores, con el aviso anterior de req sin uso en patch-home-controls-site.cjs. No se lanzó la suite completa. Presupuesto conservador: menos de 30 escenarios del bloque, incluidas comprobaciones de artefacto.

No se realizó comprobación visual nueva en Safari ni en navegador gestionado: cua_repl.js no estaba disponible. Se respetó la skill Sites sin arrancar otra vía de navegador.

La copia local de publicación tenía cambios sin guardar ajenos a este trabajo y el disco solo tenía unos 3 MB libres. Se dejó intacta y se clonó la rama pública actual en memoria temporal dentro de una única sesión. El empaquetado y sus pruebas se hicieron allí.

## Estado de entrega

Preparado y verificado, SIN publicar. La revisión automática rechazó el comando que crearía el commit y enviaría los cambios a origin/main: interpretó la instrucción retenida de no publicar sin aprobación como pendiente para esta corrección nueva. No se eludió el rechazo ni se hizo el commit/push remoto. Pendiente aprobación explícita del propietario para publicar. El sitio público permanece en la versión 102.

Para retomar tras autorización: abrir la última fuente pública mediante Sites, preservar actualizaciones posteriores, copiar estos cuatro archivos a web-enhancements/learn-feedback, ejecutar package-prize-fireworks.py sobre el Worker base adecuado, volver a verificar el módulo empaquetado, guardar el commit enviado y desplegar con Sites. Si cambió el módulo desde la versión 102, adaptar las coincidencias verificadas antes de empaquetar.


## Ajuste adicional: quitar desactivación

Se retiró el selector de celebraciones de Mi progreso y se ignora la antigua preferencia interna para mostrar celebraciones (se conserva la adaptación de accesibilidad del dispositivo). Se retiró Pausar bandeja; si aún no está activada, se mantiene Activar bandeja y solo permite pasar a enabled=true. Una vez aceptada, ese control desaparece. No se modificaron ni solicitaron permisos externos automáticamente. Se conservaron lecturas, reintentos y marcas de notificación.

Verificación adicional: siete pruebas de controles/bandeja aprobadas, TypeScript y compilación Python aprobadas; el recorrido de diez premios vuelve a pasar aun con la antigua preferencia animations=false. Se verificó la sintaxis del módulo de notificaciones preparado. No se cambió la lógica financiera ni se publicó. Sigue pendiente la aprobación de publicación solicitada anteriormente.
