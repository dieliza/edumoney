# Aplicación de la referencia visual — 2026-11-14

Versión de aplicación 2026.11.14.16. Rama web-edumoney.

## Diagnóstico corregido

La captura del propietario sí mostraba el rediseño funcional publicado (saldo, gráfico y menú), pero conservaba una composición distinta del boceto: selector de sección dominante, espacios amplios, gráfico centrado sin leyenda lateral y accesos/Top 3 debajo del primer pantallazo. No era suficiente atribuir esa diferencia a la caché. Esta entrega cambia la composición y sus componentes visuales.

## Implementación

- MoneyOverview: saludo y período compacto, tarjeta de saldo con degradado verde, icono de cartera y texto blanco, anillo de ingresos/gastos con leyenda lateral y diferencia, cuatro accesos compactos en una fila, Top 3 con iconos, porcentajes y barras. Sin el selector grande «Sección de Mi dinero» en Resumen. Historial y análisis conservan accesos directos; la administración de categorías sigue disponible desde análisis.
- Adaptación a iPad: ancho útil de hasta 1040 px; saldo y resumen gráfico en dos columnas a partir de 820 px y con escala de texto normal. En teléfono siguen uno debajo del otro. Con texto ampliado se conserva una columna.
- Encabezado de Mi dinero: menú a la izquierda, logo oficial completo, nombre EduMoney y selector de tema. Sin campanas, perfiles u otros controles ficticios.
- Top 3: mantiene el orden y los importes existentes. Iconos y colores son presentación, nunca clasificación automática. Colores consistentes con el anillo de categorías; categorías personalizadas conservan su identidad.
- Gráficas y categorías: título «Ingresos y gastos», controles más compactos, calendario de referencia desplegable, tendencias comparadas con columnas, evolución de categoría con línea, valores exactos mensuales desplegables. Desglose con anillo y todas las categorías, sin repetir el Top 3.
- Escaneo: área central de cámara con marco y círculo, accesos Buscar en fotos y Dictar datos, filas Mis documentos y Configurar lector; búsqueda/fechas/listado se despliegan desde Mis documentos. La nota de revisión permanece y los detalles de privacidad se despliegan. No muestra nombre de IA ni estado ficticio de conexión.
- Cámara y galería mantienen campos separados y activación síncrona desde el toque, con capture=environment exclusivamente en cámara. El flujo OCR/Anthropic, cancelación, autorización y conservación de imágenes no cambia.
- Nueva transacción: pestañas Gasto/Ingreso, categorías al comienzo con la rueda existente, fecha e importe juntos donde corresponde, controles contables secundarios desplegables, acción Guardar gasto/ingreso. Se mantienen los campos de bruto/retención y las reglas de guardado. La forma de introducir importes y la validación siguen siendo las existentes.
- Tarjetas, separaciones, encabezados y menú lateral comparten el estilo compacto. Menú oscuro con Cerrar sección destacado en rojo; ese cierre conserva su funcionamiento seguro anterior.

## Diferencias deliberadas frente a la ilustración

Se usa el logo oficial suministrado por el propietario. Se conserva «saldo disponible estimado», no saldo bancario confirmado. No se inventa el nombre del usuario ni se añaden botones de avisos/perfil sin funcionalidad. No se muestra el proveedor de IA en el selector de fotos. No se incorpora un interruptor de gasto recurrente porque ese mecanismo no existe en el formulario actual; se conserva la recurrencia real de ingresos. En el iPad se aprovechan columnas, en lugar de ampliar literalmente un teléfono. No se afirma equivalencia píxel a píxel.

## Conservación

No hay migraciones, dependencias nuevas, cambios de API, autenticación, claves, fórmulas financieras, suscripciones ni precios. No se escribieron datos del propietario. Las opciones de uso y revisión contable conservan sus estados al desplegar/cerrar. Al cambiar de Gasto a Ingreso se limpia la categoría y se evita conservar el método crédito, que no se ofrece para ingresos; no se modifica ningún registro guardado.

## Pruebas y límites

47 casos automatizados aprobados, sin suite completa:

- monthly-charts.test.ts: 4.
- receipt-web-capture.test.ts: 8.
- theme.test.ts: 4.
- final-redesign.test.ts: 7.
- ledger.test.ts: 15.
- receipt-photo-buttons.test.ts: 6. El mock del nuevo componente visual evita cargar módulos nativos en Node; este archivo prueba los campos/selección y la variante compacta, no los píxeles del nuevo bloque de cámara.
- expense-segments.test.ts: 3.

TypeScript, ESLint y compilación Expo web/PWA aprobados. Presupuesto inferior a 100 casos. Las pruebas verifican regresiones financieras, selección, persistencia, captura y estructura; no sustituyen la comparación visual.

Este entorno no dispone de navegador interactivo soportado ni iPad físico. No se generó una captura falsa, no se probó Face ID ni la cámara física y no se afirma haber comparado la interfaz renderizada con el boceto. Queda pendiente la comprobación visual en el dispositivo del propietario: Mi dinero, gráficos, cámara y Nueva transacción, tanto en teléfono como en iPad.
