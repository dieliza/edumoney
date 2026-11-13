# Apariencia del boceto aprobado

Rama: `cierre-edumoney`. No se modifica `main` ni se publica en tiendas.

## Cambios

- Bienvenida con logo original completo, fondos suaves y entrada local sin cuenta.
- Panel nativo Mi dinero: disponible estimado, ingresos y gastos, cuatro tarjetas de acción, próximas facturas ordenadas por vencimiento, acceso al contable y gráfica con total central.
- Ingreso y gasto abren MovementForm; recibo abre documentos con cámara, dictado y revisión; ordenar pagos abre deudas. Facturas, contable, respaldo e historial conservan sus rutas y formularios existentes.
- Detalle del cálculo del disponible desplegable; selector de mes conserva meses personalizados.
- Metas prioriza tarjetas de progreso; Aprende alterna tarjetas menta, azul y violeta; Mi progreso destaca el reconocimiento inicial.
- Se conserva Negocio, los dos temas, el tamaño de letra del dispositivo y los almacenes cifrados. No se añaden cuentas, servicios de cobro ni datos ficticios a los registros nativos.
- El navegador sigue siendo una demostración identificada; los formularios financieros reales funcionan en la aplicación instalada.

## Verificación de este bloque

- TypeScript y ESLint: aprobados.
- Preferencias de tema: 4 casos aprobados.
- Playwright: 3 recorridos aprobados (navegación y persistencia; contraste WCAG AA y anchos 320–1024; bienvenida y acciones de demostración).
- Capturas inspeccionadas en `evidence/dashboard-design/web/`.
- Recorrido Android dedicado: apertura de ingreso y gasto sin guardar datos, documentos, deudas, pestañas y temas. Aprobado en el recorrido Android 43327768204 (39 acciones completadas, una condición omitida).
- APK ARM64 actualizado: compiló correctamente; la entrega posterior con Cheque está en [capas y selectores](CAPAS-Y-SELECTORES.md).

Consumo inicial: 7 casos locales y 1 recorrido móvil programado (máximo 100). No se repiten las pruebas contributivas ni las etapas cerradas. La prueba móvil usa emulador; cámara y voz físicas requieren el dispositivo.
