# Preparación del intérprete de imágenes para EduMoney

## Arquitectura elegida

El dispositivo toma o selecciona la foto y la prepara (orientación, JPEG, resolución máxima). Con Anthropic activado, la foto completa se envía a Claude Haiku 5.5: la IA interpreta letras, cifras, tablas y etiquetas. No depende del OCR local para producir los campos; tampoco vuelve a interpretar una transcripción como fuente de los números. El OCR local sigue disponible como modo opcional separado. No se cambia automáticamente a él si falla la IA.

Se revisaron los módulos Escaneo y documentos, Cheques y talonarios, Negocio/movimientos/recibos, Para mi contable, reglas de deducciones, obligaciones IVU/contratistas, nómina, respaldo y sincronización. El reconocimiento sirve de propuesta y evidencia: no decide clasificación contributiva, deducibilidad, titular, proyecto, pago realizado, relevo ni obligación legal.

## Campos y destinos

| Documento / sección | Interpretación preparada | Uso en EduMoney |
|---|---|---|
| Recibos | Nombre del comercio, dirección comercial, municipio, fecha, referencia, método impreso | Propuestas editables y documento vinculado |
| Compras | Subtotal, descuentos, propina, servicio, envío, total final, efectivo entregado y cambio | Importes separados; solo total confirmado crea el movimiento |
| Tax / Sales Tax / IVU | Etiqueta original de cada componente, tasa únicamente impresa, importe, tipo sales/withholding/other | Desglose revisable; no asume IVU PR ni tasa o exención |
| Productos / servicios | Descripción, cantidad, precio unitario e importe de cada partida | Evidencia editable con selector de partidas |
| Cheques | Pagador, referencia y neto; bruto solo si aparece | Cheque e ingreso neto una sola vez |
| Talonarios | Patrono, fecha de pago, inicio/fin, códigos, tarifas, horas, importes actuales, bruto/neto y deducciones | Datos directos al formulario de ingresos y desglose contable |
| Deducciones | PR, servicios profesionales PR, federal/FIT, Seguro Social, Medicare/adicional, SINOT, plan médico, dental, vida, retiro, ASUME, unión, préstamo y otras etiquetas | Categorías existentes; sin inventar reglas ni porcentajes |
| Acumulados y patrono | Bruto/neto YTD, total de deducciones impreso y aportaciones patronales | Separados del pago actual y de deducciones del empleado |
| Negocio | Importe completo del recibo y todos sus detalles estructurados | Adjuntar al movimiento existente sin duplicarlo; titular, uso y proyectos se confirman en Negocio |
| Contable / CPA | Detalle de documentos seleccionados en JSON y columna JSON del CSV | Mismos importes financieros, sin sumar impuestos o deducciones otra vez |
| Vencimiento | Fecha explícita impresa | Calendario y propuesta al elegir factura pendiente; no se deduce del día de compra |

Se conserva null para desconocidos y cero solo si fue leído/confirmado. No se copian como campos SSN, cuentas bancarias, rutas bancarias ni identidad del empleado. La foto puede contenerlos: su procesamiento sigue sujeto a las condiciones de Anthropic. Un Tax genérico se mantiene con su etiqueta y pendiente de clasificación cuando corresponda.

## Cambios de implementación

- web-server/anthropic-reader.mjs: prompt de interpretación completo, esquema details, categorías de deducciones ampliadas, normalización acotada y avisos de conciliación. El modelo sigue fijo en claude-haiku-5-5 y el envío sigue siendo Messages API con salida JSON. Se informa discrepancia, sin reemplazar totales impresos ni calcular datos ausentes.
- src/modules/documents/ai/types.ts y details.ts: modelo ampliado, validación para almacenamiento, resumen legible y copia de datos principales revisados.
- ReadingDetailsForm.tsx: selector compacto de secciones y partidas, edición de importes, tasas, cantidades, referencias y calendario.
- ReviewForm.tsx, DocumentsScreen.tsx: revisión, persistencia y reapertura del detalle aun sin conservar la foto o el texto OCR.
- IncomeDocumentsScreen.tsx: referencia/método impreso, detalle YTD/patronal separado, categorías y montos directos de la IA; rechaza recibo de compra en el formulario de talonarios. La corrección de cheques históricos mantiene su evidencia original, sin recalcular otros registros.
- BusinessReceiptForm.tsx: usa respuesta estructurada en vez de volver a analizar texto; detalle editable y fecha con calendario. Adjuntar conserva el movimiento original.
- DocumentStore / tipos: guarda el detalle JSON validado en una tabla independiente; reintentos con otro detalle se rechazan.
- BusinessLedgerStore, TaxStore y exportaciones: cargan los detalles y exportan únicamente los documentos seleccionados, sin cambiar totales ni clasificaciones.
- schemaV17 y migrate.ts: migración aditiva document_readings (document_id, record_json, recorded_at), sin cambiar documentos existentes.
- BackupStore: respaldo 17 y restauración compatible con esquemas 9–16; la sincronización utiliza ese respaldo existente. Actualizar los dispositivos a esta versión antes de sincronizar datos del esquema 17.

## Verificación y límites

Presupuesto del bloque: 87 ejecuciones de casos (incluye una repetición). 81 iniciales: 80 aprobados y un fallo en una expectativa antigua que esperaba respaldo 16. Se actualizó a 17 y ese caso pasó al repetirlo. Otros 5 casos aprobados: recibo mixto comercial, reparto, depósito neto, exportación sin perfil y exportación de impuestos seleccionados. No se ejecutó suite general ni CI; máximo 100 respetado.

Los casos nuevos cubren comercio y dirección, Tax genérico, tasas impresas sin predeterminar, subtotal/cargos/cambio, productos, deducciones ampliadas, YTD/patrono, referencia de cheque, campos ilegibles, límites, discrepancias y ausencia de propiedades sensibles fuera del esquema. También guardado/reapertura del detalle sin foto, un único movimiento, respaldo/restauración v17/v16, migración v16 y conservación de los impuestos históricos.

Todo se probó con datos ficticios y proveedor simulado. Sin clave válida no se ha evaluado la precisión real de Haiku ni enviado fotos privadas o generado cargos. No se verificó cámara física/Safari/PWA instalada; no hay cua_repl.js disponible. La tabla y sus respaldos mantienen el cifrado existente, no se introduce almacenamiento legible en el servidor de lectura.

## Configuración que falta

1. Crear/configurar la cuenta de Anthropic, saldo y límites; obtener clave propia. No pegarla en el chat.
2. Para probar esta versión: abrir Configuración → Lector de recibos y talonarios, introducir la clave y activar Haiku 5.5 en esa sesión. Autorizar una vez para Anthropic y probar documentos conocidos.
3. Validar con recibo real (comercio, fecha, subtotal, impuestos y total), cheque (referencia/neto) y talonario (actual/YTD/patronales). Corregir y guardar, reabrir y comparar exportación.
4. El esquema actual usa clave propia temporal. Una clave central de EduMoney para que los usuarios no la introduzcan exige configuración protegida del servidor, control de acceso, límites/cuotas y presupuesto. No se publica una clave central en este endpoint público ni se toman credenciales de PR Budget. Ese modo no está activado; se configurará aparte con sus controles antes de compartir consumo entre usuarios.

No se cambia autenticación, precios, módulos de obligaciones ni GitHub main. No se conecta una foto al pago de una obligación ni se calcula IVU debido desde una etiqueta; eso requiere datos de oferta/canal/perfil y revisión en sus flujos existentes.

TypeScript, ESLint, git diff --check y compilación web correctos. El texto de procesamiento no afirma OCR local cuando se usa la IA. La configuración de Anthropic y el envío real permanecen pendientes de clave/saldo.
