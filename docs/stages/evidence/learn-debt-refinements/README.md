# Aprende y navegación de Mis deudas — ajuste acotado

Base publicada:150.

- Se mueve el bloque general de cinco lecciones, contador y ejercicios, desde la columna izquierda al final de la columna derecha. La izquierda conserva los consejos financieros. La derecha conserva sus contenidos de deuda y añade el bloque movido, sin duplicarlo ni cambiar los identificadores o avances de las lecciones.
- Se elimina el encabezado adicional del contenedor derecho y se renombra «Consejos sobre deudas» a «Aprende sobre deudas». Queda un solo encabezado en esa columna.
- Se retira Plan de30días del menú y de su contenido de pantalla, incluidos los controles que lo crean o actualizan. No se borran registros históricos ni se modifica la base de datos.
- Los seis accesos restantes usan tarjetas de igual altura132 y la misma anchura en cada fila, iconos, degradados y esquinas redondeadas, sin el contenedor blanco anterior. En anchos pequeños se distribuyen en varias filas. Se preservan sus acciones, selección y colores diferenciados.

Se reutilizan ThemeProvider, LinearGradient, Ionicons, deudaViewOptions y los componentes de aprendizaje existentes. El parche conserva búsqueda por tema y las celebraciones publicadas. No hay nuevas rutas ni migraciones ni cambios de fórmulas, ingresos, pagos, fondos o almacenamiento.

Pruebas:5 casos existentes aprobados;12 escenarios del paquete aprobados (distribución0/5/5 de lecciones, búsqueda exclusivamente en la columna correspondiente, seis acciones uniformes, ausencia del plan, anchos320/390/820/1440, Claro/Oscuro). TypeScript, ESLint y build aprobados. Ver runtime.json y tests.log. No hubo navegador QA disponible; no se afirma revisión visual manual en dispositivos.

Empaquetado: se comparte sin pérdida el prefijo parcial entre cadenas del diccionario estático, conservando exactamente cada carga y cada URL anterior. El lector de artefactos admite ambos formatos de diccionario. Se verifican todas las cargas, recursos precargados, alias SW y módulos no modificados (1449). Caché nueva; push y activación segura conservados. No se cambia la lógica de autenticación ni se eliminan archivos o datos. Worker66917347bytes. El build se ejecuta localmente en memoria y el guardado usa empaquetado remoto por falta de espacio para exportar el archivo de despliegue completo.

Contador conservador del bloque:22/100 (5 pruebas existentes,12 escenarios,1 empaquetado,1 build,1 entrega pública,2 comprobaciones de parches). Revisión React: hooks incondicionales; campos y ejercicios conservan estado al variar el ancho o tema; iconos decorativos y nombres accesibles; búsquedas del bloque movido se atienden en su nueva columna.
