# Corrección del Dashboard Futurista

Causas verificadas en el código: el encuadre móvil desplazaba el faro fuera de la pantalla (ancho110%, derecha-27%); una regla de movimiento reducido asignaba a la foto la opacidad del atardecer, pudiendo volverla invisible durante el día. Se corrigen encuadre, máscara, iluminación nocturna y regla de movimiento reducido. Los WebP conservan sus bytes.

Se completa el estilo de la barra superior (cinco accesos), Personal/Comercial/Transacciones (iconos y cápsulas), los cuatro accesos de captura (cristal compacto), los renglones de fondos e IRA (sin cajas tridimensionales), la tipografía y el dock de seis pestañas. Se conserva el estado visible de dictado activo, los indicadores de avisos y los estados de selección. El fondo exterior se integra con el diseño y se conserva la elección Crash Boat.

Solo cambia el módulo de estilos50005. Los otros1,472 módulos se conservaron exactamente, incluidos los callbacks, preferencias, balances y operaciones financieras. Ninguna migración ni modificación de datos financieros. Los estilos están condicionados al Futurista visible y se retiran al volver a Original.

Pruebas:19 casos iniciales aprobados;9 regresiones repetidas tras ajustes;1 caso adicional de contraste de dictado activo aprobado. Ocho comprobaciones del paquete verificaron Original, valores compartidos, destinos de todos los botones, selector, separación comercial, imágenes y precarga. TypeScript y ESLint sin errores. Se conserva un cómputo conservador de hasta91/100, incluyendo39 ejecuciones del bloque anterior, repeticiones, preparación y las cinco comprobaciones HTTP finales.

La codificación del diccionario estático se compactó sin pérdida para respetar el límite de publicación. El empaquetado comparó todos los recursos reconstruidos y las rutas; solo el CSS cambia su contenido.

No fue posible una inspección visual interactiva: este chat no ofrece control del navegador, aunque el entorno declara un escritorio. Se verificaron las causas mediante análisis de CSS, pruebas de regresión y el código empaquetado; no se presenta esto como una revisión visual en Safari.

## Publicación
Versión165 publicada correctamente, fuente08e8a97aa40e93c93788b578a535ee11045cc314. Se conservan acceso público y revisión4 del entorno. Las cinco comprobaciones HTTP aprobaron: HTML/build y protecciones, service worker y activación/push, JavaScript con nuevos estilos y ambos WebP con bytes exactos. El paquete solo modifica50005 y conserva1,472 módulos; tamaño66,988,591bytes dentro del límite de publicación.

Carga de actualización mediante Menú → Actualizar EduMoney; no borrar datos ni almacenamiento para cambiar de diseño. La revisión visual interactiva de Safari sigue pendiente por falta de herramienta en el chat.
