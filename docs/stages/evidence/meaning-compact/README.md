# Ayuda «¿Qué significa?» compacta

Base publicada151. Cambio visual global en MeaningHelp, compartido por formularios, fechas, selectores, simuladores y ayuda de secciones.

El contenedor exterior es transparente. El fondo y el relleno del botón se ajustan únicamente a su texto, conservando44px de altura mínima y un ancho máximo limitado por la pantalla. La explicación se abre en su propio espacio y conserva texto, contraste, apertura/cierre, nombre accesible y exclusiones de Negocio. No cambian entradas de formularios ni datos.

Se modifica únicamente el estilo de tres elementos del módulo publicado20014: contenedor, botón y explicación. Las funciones, condiciones, mensajes y eventos publicados permanecen intactos. Los1454módulos restantes se conservan exactamente.

Validación: prueba existente de apertura/cierre aprobada; escenario del paquete aprobado en seis contextos de campo por Claro/Oscuro, ayuda sobre fondo verde, exclusiones de Negocio y campo sin explicación.16escenarios agrupados. TypeScript, ESLint y build aprobados. No hubo navegador QA disponible; no se afirma inspección visual manual en dispositivos. Migraciones: ninguna.

El primer paquete excedió el tamaño del alojamiento. Se aplicó al diccionario de prefijos de rutas la misma compresión sin pérdida del diccionario estático, verificando todas las rutas y cargas originales. El lector interno admite el formato anterior y el compacto. No se eliminan URL, módulos, datos ni funcionalidad para reducir tamaño. Worker66962933bytes. El SW conserva push, precarga y activación segura con una caché nueva. Compilación local en memoria y empaquetado remoto al guardar por falta de espacio en disco para exportar el archivo completo.

Contador conservador22/100:1prueba existente,16escenarios,2paquetes,1build,1comprobación pública y1comprobación estática del parche. Ver tests.log, runtime.json, validation.json, package.json y publication.json.
