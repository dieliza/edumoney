# Corrección de pantalla en blanco de Mis metas

La versión 142 empaquetaba los módulos individuales de React Native Web como espacios de nombres. Sus componentes y AppState se exportan mediante default. React recibía un objeto en lugar de un componente y abortaba el renderizado. La prueba sobre la fábrica Metro publicada reprodujo «Element type is invalid ... got: object».

Se corrige exclusivamente el adaptador de importación de la fábrica 805 y el generador para futuras publicaciones. La prueba de regresión ejecuta esa fábrica con la forma real de exportación de los módulos nativos, verifica la suscripción AppState y renderiza la lista vacía, una meta seleccionada, su pista y la celebración. Una ejecución intermedia del nuevo controlador necesitó completar su dependencia de fechas; la ejecución final usa los módulos publicados reales de dinero/calendario y pasa.

Se conservan byte por byte las otras 1442 fábricas, los fondos, las migraciones y la simulación presupuestaria. No hay cambios de esquema ni operaciones sobre registros de usuarios. Se preservan rutas anteriores, manejadores push y activación segura; se cambia el nombre de caché y se mantienen coherentes los alias de /sw.js.

TypeScript, ESLint de src/tests y ESLint de los CJS modificados aprobados. ESLint general detecta errores previos en evidencias importadas y scripts Node/Deno ajenos; no se modifican esos archivos. No hay navegador interactivo disponible: se verifica renderizado mediante el paquete real y React SSR, sin afirmar prueba física de Safari.

El archivo de publicación no cabe en el almacenamiento persistente (menos de 4 MB libres); se validó la compilación en memoria y se utiliza la compilación remota del mismo commit exacto.
