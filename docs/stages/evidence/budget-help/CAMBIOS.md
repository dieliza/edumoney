# Ayuda contextual de Presupuesto mensual

Se incorpora un único MeaningHelp existente, debajo del selector de mes y de las pestañas Editar/Historial. Explica reservas reales, transferencias desde el disponible, conservación del total y diferencia entre recomendación y movimiento confirmado. Sigue el tema seleccionado mediante el componente compartido existente y se despliega únicamente al pulsar ¿Qué significa?.

Único archivo funcional modificado: `src/modules/budget/MonthlyBudgetCenter.web.tsx`. Se reutiliza `src/ui/MeaningHelp.tsx` sin alterarlo. No se modifican cálculos, movimientos, datos, permisos ni esquema SQL. Rama: `feat/budget-section-help`.

Validación: prueba de integración del control con contenido correcto, TypeScript y ESLint. Se verifican el artefacto, sus dependencias existentes, preservación de módulos ajenos, service worker y entrega pública. No hay navegador interactivo ni dispositivo Safari físico disponible. El primer intento de prueba no cargó por el formato Flow de React Native; se reutilizó el patrón de dobles del arnés de componentes para probar la integración, sin modificar el componente real.

Versión 137 publicada correctamente desde `36fcf55f450507b78fe8b3e6a41309d6d6c773b0`, conservando entorno 4 y audiencia pública. Entrega de HTML, bundle y service worker verificada. Tres escenarios aprobados (integración, artefacto, entrega), más un fallo inicial del arnés sin casos iniciados: 4/100 contabilizados conservadoramente. TypeScript y ESLint aprobados. Sin migraciones.
