# Negocio 2 — ejemplo ficticio revisable

[Expediente JSON](ejemplo-ficticio.json) · [CSV de movimientos](ejemplo-ficticio.csv) · [Informe de entrega](../../NEGOCIO-02.md)

Todos los datos son ficticios, generados desde las pruebas con SQLite real. No se insertan ejemplos automáticamente en la aplicación. Los archivos usan centavos USD; la tabla siguiente expresa dólares.

| Caso | Importe completo | Parte comercial | Reparto por proyectos |
| --- | ---: | ---: | --- |
| Gasto compartido ficticio | $100.00 | $100.00 | $60.00 + $40.00 |
| Recibo mixto ficticio, 37.5% comercial | $55.00 | $20.63 | $33.00 + $22.00; partes comerciales $12.38 + $8.25 |
| Cobro ficticio | Neto $965.00 | No se trata como gasto | Neto $600.00 + $365.00 |

El cobro se concilia como ventas brutas $1,000.00 − comisiones $100.00 − devoluciones $50.00 + IVU registrado $115.00 = depósito neto $965.00. No es una determinación de tasa ni obligación de IVU.

Totales comprobados leyendo también el CSV de forma independiente: gastos completos $155.00 y parte comercial identificada $120.63. La parte personal del recibo mixto es $34.37. Cada fila identifica movimiento, titular y proyecto; las filas con `includedInTotals=false` se excluyen de las sumas. Los componentes desconocidos se exportan vacíos/null, no como cero.

Reservas manuales del ejemplo: contribuciones $100.00, IVU $115.00 y nómina $0.00 confirmado. No son gastos ni depósitos, y no representan una remesa a Hacienda. El comprobante incluido es una referencia manual ficticia, sin imagen; las copias de imágenes requieren selección expresa al compartir en la aplicación.

## Vistas de navegador

Estas capturas verifican navegación, temas y contraste. No muestran el formulario financiero nativo ni prueban su interacción en teléfonos.

| Claro | Oscuro |
| --- | --- |
| ![Ruta comercial clara](web-light.png) | ![Ruta comercial oscura](web-dark.png) |
