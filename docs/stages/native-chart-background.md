# Gráficas sobre el fondo nativo — 2026-11-14

Aplicación 2026.11.14.17. Solicitud: retirar el fondo blanco de todas las gráficas y ampliar su tamaño.

- Card admite presentación chart mediante ChartSurface: sin relleno, borde ni sombra de tarjeta. El degradado original de la pantalla queda visible, incluido el centro de los anillos.
- Aplicado a resumen de Mi dinero, Top 3, desglose por categorías, tendencias, gastos individuales, presupuestos y gráfico de demostración.
- El tema de gráficas queda limitado a esos bloques. Ajusta texto, etiquetas y guías para el fondo nativo claro u oscuro; no cambia las demás tarjetas ni la preferencia guardada. Los colores de ingresos/gastos se intensifican en oscuro.
- Anillo de categorías: de 212 px a tamaño adaptable de hasta 420 px. En teléfono se adapta al ancho.
- Resumen circular: de 132 px a 210–250 px; en pantallas estrechas la leyenda baja para no comprimir la gráfica. Vista circular completa de hasta 380 px.
- Tendencias de 230 px a 300–360 px, con eje y columnas adaptados al ancho. Columnas individuales de 180 a 260 px y barras horizontales de 18 a 24 px.
- Datos, importes, escalas relativas, selección del período y cálculos financieros existentes conservados. Sin migraciones, dependencias, API ni cambios de autenticación.

Verificación: 11 casos existentes aprobados (monthly-charts: 4; expense-segments: 3; theme: 4). TypeScript, ESLint y compilación Expo web/PWA aprobados. Sin suite completa ni nuevas pruebas que dupliquen cambios de estilo. Este entorno no permite comparación visual en un navegador soportado ni en iPad físico; no se afirma haber realizado esa comparación.
