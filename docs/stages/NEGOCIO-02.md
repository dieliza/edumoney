# Negocio 2 — Ingresos, gastos, recibos y exportación

## Resultado

Se revisó la primera entrega y se continuó en la misma aplicación, con sus temas, navegación y conexión SQLCipher. Nueva ruta desde cada titular: Movimientos y recibos. No se fusiona main ni se publica. IOS-QA-10 permanece diferida por instrucción del usuario.

## Implementación

- Crear cobros netos positivos y gastos; vincular movimientos previos de Mi dinero sin crear otro pago. Un movimiento financiero tiene una sola ficha comercial y conserva su identificador.
- Reparto completo entre proyectos del mismo titular. Se impiden cruces de titular tanto en el servicio como mediante claves foráneas compuestas. Las cantidades se guardan en centavos y los productos/repartos usan BigInt.
- Uso comercial, personal, mixto o pendiente. Un mixto guarda porcentaje en puntos básicos, justificación y estado declarado de revisión del CPA. La revisión pendiente no bloquea guardar ni calcular; no se determina deducibilidad.
- Parte comercial de un mixto redondeada al centavo; reparto por restos mayores con desempate estable por identificador. Se conserva también la parte personal.
- Ventas brutas, comisiones, devoluciones descontadas, IVU registrado y depósito neto separados. Con desglose completo se exige conciliación. Los componentes se reparten por neto y el bruto por proyecto se reconcilia al centavo. Se puede registrar un neto conocido con componentes pendientes; los desconocidos se muestran/exportan null y no se sustituyen por cero.
- Vistas por titular y proyecto, con totales y lista de movimientos. Los cambios de importe/tipo/versión en Mi dinero exigen conciliación comercial; los registros afectados o eliminados se excluyen de totales, manteniendo referencias y pendientes. Corregir la clasificación conserva historial y no duplica el movimiento.
- Recibos adjuntos al movimiento mediante DocumentStore. Entrada manual, cámara o imagen elegida; revisión expresa y elección de conservar copia SQLCipher. El total y fecha confirmados del recibo son independientes del neto del movimiento y pueden quedar pendientes. Se conservan versiones corregidas y referencias documentales.
- Expediente JSON para CPA con filas, totales, reservas, pendientes, referencias y comprobantes seleccionados; copias de imágenes opcionales. CSV suplementario con centavos USD, indicador de inclusión en totales y protección contra fórmulas de hoja de cálculo. Compartir es una acción explícita; los archivos legibles temporales se retiran al cerrar o fallar el diálogo.
- Reservas manuales del titular separadas para contribuciones, IVU y nómina. Se registra el importe total elegido, motivo y versión, sin crear gastos ni transferencias.
- Migración atómica 10→11 y respaldo que incluye las nuevas tablas. Restauración de esquemas 9 y 10 admitida con advertencias sobre los datos ausentes que se reemplazan.

## Archivos

`src/modules/business/ledger{Types,Domain,Store}.ts`, formularios `BusinessEntryForm`, `BusinessReceiptForm`, `BusinessReserveForm`, `BusinessExportForm`, `BusinessLedgerScreen`, rutas y exportación nativa. `src/storage/schemaV11.ts`, migración, módulo backup y enlace desde BusinessScreen. Pruebas en `tests/business-ledger.test.ts`, exportación nativa en `tests/tax-export.test.ts` y navegación en `tests/browser/business.spec.ts`.

## Pruebas y alcance verificado

- 228 pruebas de lógica/SQLite/servicios aprobadas: 204 anteriores + 20 de esta entrega y 4 de exportación comercial.
- Gasto compartido, recibo mixto con copia, depósito neto, redondeo de centavos, desconocidos, cruces de titular, vínculos existentes, correcciones, concurrencia, reservas, rollback y recuperación de respaldo.
- Reapertura real desde archivo SQLite conserva movimientos, repartos y reservas.
- Exportación de los tres casos combinados conciliada con los totales de pantalla y con una lectura independiente del CSV.
- TypeScript y ESLint aprobados. Empaquetado JavaScript web, Android e iOS aprobado; no equivale a compilaciones firmadas APK/IPA.
- Cinco recorridos de navegador aprobados, con navegación, temas, contraste y tamaños. La web es informativa y no guarda registros financieros.

Sigue pendiente la interacción de estos formularios en simuladores/teléfonos, permisos de captura y destinos reales de compartir. No se declara resuelta IOS-QA-10 ni se requiere un CPA para habilitar cálculos. Este bloque registra y organiza; no calcula tasas/exenciones de IVU, retenciones de contratistas, estimadas ni nómina. Las devoluciones del desglose corresponden al mismo cobro neto positivo; flujos independientes de devoluciones quedan fuera de este bloque.

[Ejemplo ficticio, JSON, CSV y capturas](evidence/business02/README.md).

## Próximo bloque

Flujos separados de IVU y contratistas, después de verificar fuentes oficiales vigentes. Esta entrega se detiene aquí, según el orden solicitado.
