# Presentación compacta global y conservación mensual — 2026-11-14

Aplicación 2026.11.14.19.

## Más de 50 movimientos

Se conserva la arquitectura existente: todos los movimientos se guardan en la base cifrada; 50 es el lote inicial del historial, no un máximo de almacenamiento. No se crea un segundo archivo, una cola ni otro gasto para el excedente. monthlySummary recibe el snapshot completo y filtra por el mes y el estado vigente, por lo que incluye los registros que aún no se han desplegado. El cálculo se actualiza al cargar/reabrir y al guardar; no se inventó un cierre mensual programado en el servidor.

Se añadió una explicación visible en el historial. El contador y Mostrar más conservan su comportamiento, igual que el cambio de período, los filtros y las correcciones.

## Apariencia de toda la app

RecordSurface y Card row ofrecen fondo transparente, texto sobre el color nativo, separador fino y distribución horizontal con ajuste de línea cuando el ancho no alcanza. Altura táctil mínima de 48 px. Body permite encogimiento y limita el ancho para evitar desbordamientos de textos largos.

Aplicado a listados y bloques informativos en facturas/pagos, deudas/avisos/calendarios, metas/aportaciones, documentos, cheques y talonarios, revisión y exportación contable, titulares/proyectos y movimientos de Negocio, IVU/contratistas, nómina, planificación, simuladores, aprendizaje/logros, progreso, configuración y respaldo. Se mantienen gráficos y barras de progreso, enlaces, acciones de edición, reversión, consulta y exportación.

Los formularios, entradas y grupos de controles conservan su estructura; en particular se mantienen las superficies de edición de contraseñas y clave del lector. No hubo cambios de autenticación, API, base de datos, fórmulas, permisos, precios ni suscripciones. Las tarjetas gráficas ya transparentes conservan su presentación. En pantallas pequeñas los campos pueden continuar en la línea siguiente para conservar legibilidad y acceso; no se promete una fila rígida con texto cortado en todas las secciones.

## Verificación

Dos casos de final-redesign-persistence.test.ts aprobados: el caso existente de categorías y persistencia; y un nuevo caso con 128 movimientos ficticios en SQLite real, cierre y reapertura de la base. Confirma:

- Se conservan los 128 registros aunque la vista tome 50.
- Noviembre incluye 125 gastos guardados, excluye una anulación y conserva ingreso separado: gastos vigentes 124.00 USD, ingresos 200.00 USD.
- Diciembre conserva sus 20.00 USD sin mezclarlos con noviembre.
- Los resúmenes históricos usan todos los registros vigentes del mes.

La migración existente se ejecutó solo en una base temporal ficticia de prueba; no se creó migración ni se modificó la base del propietario.

TypeScript, ESLint y compilación Expo web/PWA aprobados; sin suite completa. Los cambios de estilo no tienen pruebas que solo repitan el marcado. Este entorno no dispone de recorrido visual soportado ni de iPad físico; las interacciones y la apariencia real en esos dispositivos quedan pendientes de comprobación.

## Publicación

Sites versión 37, despliegue succeeded appgdep_6af8f03c0bfc819191bfbb38d0cd9fcc. Fuente de alojamiento 9416386edd2c02765b4a09839e9057d3af878388. Implementación en web-edumoney ba06b2a; GitHub main no modificado. Audiencia pública y variables de servidor conservadas, revisión 1.

Dos solicitudes HTTP verificaron el HTML con el registrador 2026.11.14.19 y el archivo común del cliente, idéntico byte por byte al compilado con RecordSurface. Verificación de entrega de código, sin afirmar recorrido visual en iPad. Cinco comprobaciones funcionales/de entrega en este bloque: dos casos automatizados, dos solicitudes y una comparación de artefactos; sin suite completa.

Enlace: https://edumoney-web.diegoluissantospabon.chatgpt.site/money?build=2026.11.14.19
