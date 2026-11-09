# Evidencia Negocio 3

`ejemplo-ficticio.json` se generó mediante `EDUMONEY_OBLIGATIONS_EXAMPLE=1 npx vitest run tests/business-obligations.test.ts`, usando registros reales de la capa SQLite y únicamente datos ficticios.

- Servicios: primer pago $300, retención $0; segundo pago $400, retención $20. Acumulado $700 por el mismo pagador/proveedor/año.
- IVU: cobro propio $115 ($105 estatal + $10 municipal), remesa estatal confirmada $105. Diferencia de registros $10, sin afirmar una deuda final. La remesa municipal no se inventa ni se marca pagada.
- Fuentes, vigencia y supuestos se conservan en el ejemplo.

Las capturas `IVU-light/dark.png` y `Contratistas-light/dark.png` muestran vistas informativas web con ambos temas. No demuestran interacción de formularios nativos ni almacenamiento SQLCipher en un dispositivo. La reapertura y el respaldo se comprueban mediante pruebas SQLite; los recorridos móviles de estos formularios quedan pendientes. IOS-QA-10 continúa diferida.
