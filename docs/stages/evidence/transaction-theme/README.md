# Tema de la aplicación y Nueva transacción

Fecha: 2026-11-22. Rama: ui/nueva-transaccion-redesign. Sin publicación.

El formulario nuevo tenía una paleta oscura fija. Ahora utiliza el nombre de tema resuelto por ThemeProvider, igual que Screen, la navegación, ChartSurface y RecordSurface. Sus fondos, encabezados, etiquetas, enlaces, errores y selectores cambian en Claro/Oscuro/Automático sin desmontar el formulario. Los botones semánticos conservan vino/azul/verde y texto blanco legible. Los campos claros conservan su estilo compatible existente.

También se corrigió Body(canvas): antes siempre mostraba texto claro, incluso sobre pantallas claras. Ahora consulta el tema. La regla para todas las páginas y modales se documentó en AGENTS.md. No se cambiaron preferencias, almacenamiento financiero, cálculos ni lógica de guardado.

Verificación (14 casos, sin suite completa):

- 9 unitarios: preferencias de tema, formulario e historiales, cambio de gasto/ingreso y registro personal.
- 2 casos de contraste: texto, etiquetas, enlaces, errores, campos y botones en ambos temas, relación >=4.5:1.
- 3 recorridos Chromium: Claro, Oscuro y Automático. Se verifican pantalla compartida y formulario, conservación de borrador al alternar, persistencia tras recargar, guardado del importe y cambios del tema del dispositivo. Capturas de teléfono 390x844 y tableta 820x1180.
- TypeScript aprobado; ESLint sin errores, con el aviso previo de req sin uso en scripts/patch-home-controls-site.cjs.
- git diff --check aprobado.

Capturas y results.json en esta carpeta. Reproducir con scripts/transaction-redesign-preview.mjs y scripts/verify-transaction-theme.mjs. Revisión local con datos ficticios y adaptadores descritos en ../transaction-redesign/README.md; no constituye prueba de cada ruta en un dispositivo físico. No se ha probado Safari físico ni desplegado producción.
