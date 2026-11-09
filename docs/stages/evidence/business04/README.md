# Evidencia Negocio 4

Datos exclusivamente ficticios. `ejemplo-ficticio.json` se genera con `EDUMONEY_PLANNING_EXAMPLE=1 npx vitest run tests/business-planning.test.ts`, usando los registros SQLite y las mismas funciones del panel.

| Concepto | Caso base |
| --- | ---: |
| Ventas brutas | $1,000.00 |
| Comisiones | $100.00 |
| IVU cobrado, separado de ganancia | $115.00 |
| Cobro neto | $1,015.00 |
| Operación comprada con crédito | $200.00 |
| Equipo pagado, antes de depreciación | $300.00 |
| Aportación de capital | $500.00 |
| Efectivo inicial declarado | $1,000.00 |
| Estimada PR ya pagada, separada | $100.00 |
| Ganancia de operaciones antes de depreciación/ajustes | $700.00 |
| Efectivo calculado | $2,115.00 |
| Reservas: contribuciones + IVU + nómina | $365.00 |
| Disponible tras reservas registradas | $1,750.00 |
| Contribución anual proyectada declarada | $800.00 |
| Otros créditos/retenciones declarados | $50.00 |
| Saldo proyectado | $650.00 |
| Reserva contributiva asignada | $200.00 |
| Faltaría reservar | $450.00 |

Escenario: ventas +$500, gasto operativo +$100, cobros +$300, pagos operativos +$100, equipo adicional $500 con $200 de efectivo, cambio contributivo supuesto +$80. Resultado antes de depreciación $1,100, efectivo $2,115, disponible $1,750, saldo supuesto $730 y reserva faltante $530. El equipo pendiente/financiado del supuesto es $300; no se crea una deuda real.

El caso incompleto mantiene los datos registrados, pero deja el saldo proyectado pendiente por clasificación y revisión del perfil. No sustituye los datos faltantes por cero ni exige aprobación de CPA.

Las capturas `Resultado-*`, `Comparar-*` y `Calendario-*` son vistas informativas web en ambos temas. No demuestran interacción de los nuevos formularios nativos. La persistencia, las relaciones y los cálculos se prueban en SQLite; las pruebas físicas de estos formularios continúan pendientes.
