# Centavos automáticos y aportaciones de gastos anuales

TransferEditor utiliza el Field monetario compartido: muestra 0.00 y desplaza automáticamente los centavos (100 → 1.00 USD), tanto al crear como al corregir transferencias de las distintas categorías.

AnnualExpenses ya no asigna hoy silenciosamente como vencimiento al crear un gasto. Solicita explícitamente la fecha del próximo vencimiento, y muestra en vivo importe por aportación, frecuencia, número de aportaciones, fechas primera/última, cantidad ya reservada y última cuota ajustada al centavo. Si el vencimiento es hoy o anterior, explica por qué no hay semanas para repartir y permite corregir la fecha. No mueve vencimientos existentes ni altera registros reales automáticamente. La frecuencia anual del gasto es distinta de la frecuencia semanal/quincenal/mensual/anual de aportación.

Se reutilizan Field/moneyInput, ContributionFields, contributionRecommendation, AnnualExpenses y TransferEditor. No se modifican cálculos monetarios del motor, fondos, movimientos, autenticación, datos ni SQL. El empaquetado conserva el diccionario compartido de rutas de la publicación anterior y verifica su reconstrucción.

Se ejecutan pruebas de integración, calendario, redondeo, centavos, TypeScript, ESLint, compilación y entrega pública. Sin navegador interactivo ni Safari/iPhone físico; esta validación no sustituye una prueba física.
