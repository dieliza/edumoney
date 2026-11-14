# Flecha común de regreso — 2026-11-14

El usuario aclaró que se refería al botón Back de todas las páginas. `Screen` mostraba la flecha solo cuando cada pantalla pasaba `back`; faltaba en las pestañas principales y administración. Ahora la muestra por defecto en todas las secciones (la bienvenida inicial no requiere regreso), arriba a la izquierda, únicamente con símbolo y etiqueta accesible. Las fichas conservan su X.

Usa el historial existente. Cuando una sección se abre directamente sin historial, lleva a Mi dinero; desde Mi dinero sin historial lleva a la bienvenida para evitar un botón sin efecto. Conserva `beforeBack` (por ejemplo, cancelar lectura pendiente de fotos). No se añade botón central ni texto Back.

Cambios: `src/ui/components.tsx`, `src/ui/buildVersion.ts`. Versión 2026.11.14.10. TypeScript, ESLint, compilación web, diff y sintaxis del Worker correctos. No se repiten suites ni se añaden pruebas que solo reflejen este cambio visual reversible. No se realizó prueba física iPad; navegador compartido no disponible. GitHub main sin cambios.
