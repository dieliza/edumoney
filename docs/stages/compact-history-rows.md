# Historial en filas compactas — 2026-11-15

Versión de aplicación 2026.11.14.18 (continuación de la serie de versiones existente).

Solicitud: retirar las tarjetas blancas por movimiento y usar texto horizontal para admitir muchos gastos. Se conserva el fondo de la app.

- MovementRows muestra columnas Fecha, Concepto, Tipo, Categoría, Método e Importe, sin tarjetas ni fondo opaco. Separadores finos, texto con contraste según tema y filas de al menos 48 px para pulsación.
- Cada fila abre el mismo detalle de movimiento y conserva corrección, historial, eliminación lógica y restauración existentes. Los nombres largos se acortan visualmente; su contenido completo permanece en la etiqueta accesible y en el detalle.
- En pantallas estrechas se permite desplazamiento horizontal para conservar todas las columnas. En tabletas se aprovecha el ancho.
- Los filtros existentes están recogidos en Filtrar historial. Fechas activas y estado siguen visibles; contador «mostrados de total». Se mantienen los 50 iniciales y Mostrar más movimientos, sin recortar registros almacenados.
- Ninguna modificación de base de datos, autenticación, API, fórmulas financieras ni política de conservación.

Conservación comprobada en el código: MoneyStore.snapshot lee los movimientos guardados ordenados por fecha descendente; los filtros y slice de la pantalla solo afectan la vista. setDeleted marca deleted_at y conserva revisiones, con restauración. No hay borrado automático por antigüedad ni archivado anual automático. Los datos alimentan resúmenes mensuales, categorías, tendencias y las herramientas de revisión/exportación contable. Se mantienen en el almacenamiento cifrado existente; la sincronización opcional intercambia copia cifrada. Los respaldos existentes permiten conservar otra copia.

Verificación: TypeScript, ESLint, diff y compilación Expo web/PWA correctos. Cambio reversible de presentación: no se añadieron pruebas que reproduzcan el marcado ni se ejecutó la suite completa. No hubo recorrido físico en iPad ni navegador interactivo soportado; la comprobación visual en el dispositivo queda pendiente.
