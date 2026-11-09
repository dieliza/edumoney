# Evidencia Negocio 5

Todos los datos son ficticios. El PDF y CSV se generan mediante las funciones reales del módulo, en el test `genera evidencia ficticia conciliada para revisión` de `tests/business-payroll.test.ts`.

- [Borrador imprimible](nomina-ficticia.pdf): un pago ficticio de $2,200, retención PR $54.91, SS $136.40, Medicare $31.90, SINOT $6.60 y neto $1,970.19. Costo patronal calculado $2,473.90 con tasas patronales de prueba explícitas, no tasas asignadas a un negocio real.
- [CSV](nomina-ficticia.csv): mismos acumulados y conciliación por agencia. Ningún depósito se presume pagado.
- `web-light.png` y `web-dark.png`: vista informativa del navegador, sin empleados ni datos laborales reales. No muestran ni validan los formularios móviles.

Las pruebas incluyen también dos pagos, depósitos parciales, correcciones, diferencias reales/calculadas y recuperación local; véase [informe](../../NEGOCIO-05.md).
