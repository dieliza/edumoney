# Campo visible y formulario compacto — 22 noviembre 2026

Solicitud acotada: corregir desaparición del campo al escribir; quitar las frases sobre decimales y navegación del selector; reducir espacios y altura gris de categorías. La captura muestra el teclado abierto, la parte baja del selector y un mensaje de validación que añade altura sobre Guardar.

El ajuste v85 seguía el viewport pero no garantizaba que el cuerpo del formulario pudiera encogerse ni desplazaba el input enfocado. Ahora el contenedor web tiene altura disponible explícita, el cuerpo tiene flex:1/minHeight:0, y al enfocar/redimensionar se revela únicamente el input dentro de ese cuerpo, sin scroll de página, refocus, remount ni cambios al valor. Se repite la revelación después de confirmar el layout. Escucha focusin/resize/scroll con animationFrame y limpia listeners al cerrar.

Selector web: 132px (tres filas de 44px), antes 240px (cinco de 48px). Se ajustan consistentemente índice, highlight y espaciadores a la nueva geometría. Native conserva escalado accesible, mínimo 44px y tres filas. Se elimina la frase de navegación web. Padding del Card del formulario: 12px y gap 10px (antes 16px). Campo compacto: mínimo 44px. La validación decimal sigue intacta; en el formulario de transacción su mensaje se resume a «Escribe el importe.» y se limpia al editarlo. Sin modificaciones financieras ni de persistencia.

Base: v85, hosting 6905f7b04b3af473d56e1be9cdd33052f086e0ee. Parche exclusivo de factories 797, 1148 y 831; servidor y demás factories conservados. Caché compact-86-20261122, registro canónico /sw.js, aliases/precache/push/activación segura conservados.

Verificación: seis pruebas de viewport/revelación aprobadas. TypeScript aprobado. Verificador de bundle: 28 aliases de Sheet ejecutados; altura/scroll mínimos comprobados; selector real del bundle cambia categorías con teclado y scroll a 44px, viewport 132px, sin frase. Conserva todos los factories ajenos y backend. ESLint se completa antes de publicar. No hay infraestructura de navegador iPhone disponible; no se afirma reproducción física del teclado.

Presupuesto: 6 casos unitarios + 28 renders de aliases + 1 caso de selector + 1 entrega = 36/100. No se ejecuta suite completa. La primera pasada de lint detectó Buffer no declarado en el verificador previo (script de desarrollo); se corrige la importación y se repite lint, sin cambio de producto adicional.

ESLint final: aprobado. Revisión React: efectos mantienen orden fijo, cancelan animationFrame y listeners; no se remonta el input, se conserva valor/control y navegación accesible de categorías. Sin dependencias ni consultas adicionales.
Publicación v86: aplicación 8df87fc; hosting ecbdada7b56ff0559c4f7e3885c0b1ca78dc259f; versión appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_f8728735e154819190d65afefed84cbc; deployment appgdep_6b02f4d89e208191b4a4f8df0da6c9c1. Entorno conservado en revisión 4.
