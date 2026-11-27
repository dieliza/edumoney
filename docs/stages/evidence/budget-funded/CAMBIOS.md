# Presupuesto mensual: importes alimentados por transferencias

Los renglones muestran dinero reservado real, como salidas de solo lectura. Ningún campo de importe ni aplicar recomendaciones puede aumentar el dinero mostrado. Se conserva intacta la planificación anterior en los registros; se habilita el modo `transferOnly` al abrir el presupuesto actual y al guardarlo expresamente.

Cada categoría accede al TransferEditor existente con origen Balance disponible y destino fijado. Ahorros reutiliza el fondo de ahorro existente; categorías adicionales utilizan fondos identificados de forma estable, materializados únicamente dentro de la primera transferencia confirmada. Se conservan edición, reversión, validación de balance y prevención de duplicados del FundsStore existente.

Los importes se derivan de fundSummary y de vínculos existentes, no de amountCents introducidos manualmente. Las recomendaciones solo guardan objetivo, fecha y frecuencia. La base del gráfico incluye disponible y reservado para evitar descontar dos veces las reservas; el encabezado sigue mostrando el balance disponible real. Se mantienen colores, distribución, temas y controles existentes.

Se reutilizan BudgetStore, FundsStore, TransferEditor, fundSummary, changeEvents e historial de transferencias. No se modifican autenticación, permisos, otras pantallas, datos reales ni esquema SQL. Se añade únicamente una propiedad opcional al JSON del presupuesto existente. Las configuraciones y los datos históricos se conservan.

## Validación

Pruebas con SQLite en memoria y datos FICTICIOS: importes manuales ignorados, recomendación sin financiar, creación atómica, ausencia de dinero, duplicados, edición, reversión, persistencia, cuentas personales/comerciales separadas, ahorro existente y categorías de ahorro adicionales. Se ejecutan también las pruebas existentes del presupuesto y de fondos. La prueba UI confirma outputs sin onChange y apertura del editor de transferencias.

TypeScript y ESLint requeridos. Se valida también el paquete final, preservación de módulos ajenos, precarga y alias del service worker, actualización segura y entrega pública. No hay navegador interactivo ni dispositivos físicos disponibles: no se afirma validación física en Safari/iPhone/iPad.

## Publicación

Versión 136 publicada correctamente. Fuente Sites: `0f1c235e0463644dc03e8ec505ff25c55d7ef684`; se mantiene la revisión de entorno 4 y el acceso público existente. HTML, bundle del presupuesto y service worker de la URL pública entregan `budget-funded-f8e32ed2ff7c`.

80 casos distintos de código aprobados en su resultado final; 82 ejecuciones de código incluyendo repeticiones. Se corrigió una expectativa del comportamiento anterior que todavía esperaba aumentar manualmente la planificación. Dos comprobaciones de artefacto: la primera detectó que el código había cambiado durante la compilación y bloqueó la subida; la segunda comprobó los hashes finales y pasó. Una comprobación de entrega pública aprobada: total conservador 85/100 ejecuciones, 82 casos distintos. TypeScript y ESLint aprobados. No se ejecutó ninguna prueba destructiva con datos reales.

Archivos de aplicación modificados: `src/modules/budget/types.ts`, `domain.ts`, `recommendations.ts`, `store.ts`, `MonthlyBudgetCenter.web.tsx`, `RecommendationEditor.web.tsx`, `BudgetDetails.web.tsx`; `src/modules/funds/store.ts` y `TransferEditor.tsx`. Pruebas: `tests/budget-transfer-only.test.ts`, `budget-refinements-ui.test.ts` y `monthly-budget.test.ts`. Evidencia y scripts de empaquetado en este directorio, `web-enhancements/budget-funded` y `scripts/*budget-funded*`. Rama: `feat/budget-transfer-only`.
