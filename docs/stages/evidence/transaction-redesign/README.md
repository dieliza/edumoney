# Nueva transacción — revisión sin publicación

Rama: `ui/nueva-transaccion-redesign`. Base: `dfe529b`. Fecha: 2026-11-22.

Implementación del diseño aprobado: encabezado con cierre, Gasto vino/Ingreso azul (solo activo resaltado), selector compacto neutro Personal/Comercial, encabezado dinámico, categoría desplegable y enlace Crear categoría, importe, fecha, método y único guardado verde al final. Historial y edición conservados mediante enlace discreto. Cheques, recurrencia, descripción y titular de negocio conservados en Más opciones; la elección obligatoria de negocio se mantiene visible cuando es necesaria.

## Archivos

- `src/modules/money/MovementForm.tsx`: distribución y acceso discreto al historial/opciones.
- `src/modules/money/CategoryPicker.tsx`: presentación desplegable opcional; conserva presentación anterior para otros formularios.
- `src/modules/money/TransactionFormUI.tsx`, `TransactionFormWebStyles.tsx`, `TransactionFormWebStyles.web.tsx`: contenedor y controles propios, ajuste al viewport/teclado y estilos web limitados al formulario.
- `src/ui/transactionFormStyle.ts`: paleta del formulario.
- `src/modules/money/fields.tsx`, `src/ui/DateField{,.web}.tsx`, `src/ui/SelectControl{,.web}.tsx`: presentación opcional del formulario; valores predeterminados de otros consumidores preservados.
- `tests/entry-direction-ui.test.ts`, `tests/transaction-history-ui.test.ts`: adaptación de pruebas a la nueva interfaz.
- `scripts/transaction-redesign-preview.mjs`, `scripts/verify-transaction-redesign.mjs`, `tests/fixtures/transaction-redesign/`: revisión local aislada, registros ficticios y SQLite en memoria; no servicios nuevos de la aplicación.

## Verificación

27 casos unitarios aprobados:

- `npm test -- tests/account-zone.test.ts tests/commercial-category.test.ts` — 18.
- `npm test -- tests/transaction-history-ui.test.ts` — 4.
- `npm test -- tests/entry-direction-ui.test.ts -t 'manual entry|personal income accepts'` — 2.
- `npm test -- tests/form-inputs.test.ts -t 'mueve los centavos|conserva céntimos|activa calendario'` — 3.

17 recorridos de navegador finalmente aprobados, 19 ejecuciones contando dos repeticiones: cuatro combinaciones gasto/ingreso y personal/comercial, persistencia y balance mediante stores reales sobre SQLite en memoria, confirmación, categoría nueva/almacenada, validación, pulsaciones repetidas, edición desde historial, restricción comercial preexistente, recurrencia, cinco tamaños (320, 360, 390, 820, 1280 px) y simulación de reducción del viewport al abrir teclado. Sin errores JS en los recorridos. Una captura adicional de gasto en teléfono y escritorio. Las dos repeticiones corrigieron un selector de prueba (heading) y repitieron la edición tras un cambio del fixture durante la primera ejecución; no requirieron cambios financieros.

Presupuesto conservador: **56 de 100** ejecuciones, incluyendo 9 intentos de arranque de la revisión local (ajustes de resolución de dependencias Expo en Vite), 27 unitarios, 19 recorridos y 1 captura final. No se ejecutó la suite completa ni CI.

- `npm run typecheck`: aprobado.
- `npm run lint`: sin errores; conserva un aviso previo por `req` sin uso en `scripts/patch-home-controls-site.cjs`.
- `git diff --check`: aprobado.
- Comparación AST/texto con la base: `MovementForm.submit` y `CategoryPicker.create` idénticas. Sin cambios en stores, cálculos, migraciones, APIs, autenticación, sincronización ni otras pantallas.

Resultados: `results.json` (primer recorrido, incluye los dos fallos de prueba) y `retry-results.json` (ambos aprobados). Capturas: `expense-phone.png`, `expense-desktop.png`, `phone.png` (ingreso), `keyboard-simulation.png`.

Reproducir localmente en dos terminales, sin desplegar:

```sh
node scripts/transaction-redesign-preview.mjs
node scripts/verify-transaction-redesign.mjs
```

## Incidencias y límites

1. **Restricción previa de edición comercial**: `MoneyStore.saveCommercial` rechaza cambiar el importe de un registro ya asignado a Negocio. El formulario conserva esta validación y muestra su error; no la corregimos porque requiere cambiar lógica financiera, fuera de la autorización UI/UX. La prueba confirma que no altera ni duplica el registro rechazado. La edición personal sí fue verificada.
2. Comprobación visual en Chromium con tamaños de móvil/tableta/escritorio, no en iPhone/Safari o Android físicos, iPad real ni instalación PWA. El teclado es una simulación de visualViewport, no el teclado de iOS real. Se conservan controles nativos/compatibles y el hook de viewport existente.
3. La revisión usa el formulario y stores reales, pero adapta router, preferencias, criptografía y proveedores ajenos al formulario; no prueba sincronización remota ni el host de producción. No se enviaron datos a servicios externos ni se modificó producción.

**Pendiente aprobación del propietario antes de publicar o desplegar.**
