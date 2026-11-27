# Presupuesto mensual: importes alimentados por transferencias

Los renglones muestran dinero reservado real, como salidas de solo lectura. Ningún campo de importe ni aplicar recomendaciones puede aumentar el dinero mostrado. Se conserva intacta la planificación anterior en los registros; se habilita el modo `transferOnly` al abrir el presupuesto actual y al guardarlo expresamente.

Cada categoría accede al TransferEditor existente con origen Balance disponible y destino fijado. Ahorros reutiliza el fondo de ahorro existente; categorías adicionales utilizan fondos identificados de forma estable, materializados únicamente dentro de la primera transferencia confirmada. Se conservan edición, reversión, validación de balance y prevención de duplicados del FundsStore existente.

Los importes se derivan de fundSummary y de vínculos existentes, no de amountCents introducidos manualmente. Las recomendaciones solo guardan objetivo, fecha y frecuencia. La base del gráfico incluye disponible y reservado para evitar descontar dos veces las reservas; el encabezado sigue mostrando el balance disponible real. Se mantienen colores, distribución, temas y controles existentes.

Se reutilizan BudgetStore, FundsStore, TransferEditor, fundSummary, changeEvents e historial de transferencias. No se modifican autenticación, permisos, otras pantallas, datos reales ni esquema SQL. Se añade únicamente una propiedad opcional al JSON del presupuesto existente. Las configuraciones y los datos históricos se conservan.

## Validación

Pruebas con SQLite en memoria y datos FICTICIOS: importes manuales ignorados, recomendación sin financiar, creación atómica, ausencia de dinero, duplicados, edición, reversión, persistencia, cuentas personales/comerciales separadas, ahorro existente y categorías de ahorro adicionales. Se ejecutan también las pruebas existentes del presupuesto y de fondos. La prueba UI confirma outputs sin onChange y apertura del editor de transferencias.

TypeScript y ESLint requeridos. Se valida también el paquete final, preservación de módulos ajenos, precarga y alias del service worker, actualización segura y entrega pública. No hay navegador interactivo ni dispositivos físicos disponibles: no se afirma validación física en Safari/iPhone/iPad.
