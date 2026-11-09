# Negocio 3 — IVU y contratistas

Entrega sobre `negocio-03-ivu-contratistas`, continuando los perfiles y registros de Negocio 2. Se revisó el bloque anterior y se conservan navegación, temas y conexión local SQLCipher. No se modifica main ni se publica. IOS-QA-10 sigue diferida por instrucción del usuario.

## Implementación

Desde cada titular de Negocio se abren dos flujos separados: IVU y Contratistas. Los formularios empiezan en blanco, salvo elecciones estructurales, y no crean datos ficticios de usuario. Las simulaciones muestran supuestos, catálogo versionado, fuentes oficiales, vigencia y hechos pendientes. No se exige autorización de CPA para calcular.

**IVU:** ofertas de productos, servicios, suscripciones o membresías, vinculadas opcionalmente a proyectos. Se registran naturaleza, cliente/destino, municipio, canal, responsabilidad de cobro, fundamento, tasas del escenario, certificados, alcance del facilitador y fechas de clasificación. La tasa no se deduce del nombre de la oferta. Las condiciones especiales quedan explícitas; no se presume que una pasarela sea un facilitador ni que la exención del vendedor se transfiera a este.

El simulador separa estatal y municipal; el escenario básico conserva el 1% municipal incluso en los cinco municipios fuera de consolidación. La regla de 73 municipios en SURI aplica desde julio de 2026; cobro y remisión se identifican por responsable. Los cobros reales no se rellenan desde la estimación. Las remesas estatal/municipal se registran separadas, con referencia, importe y confirmación. La consulta mensual muestra cobros propios, cobros por facilitadores, remesas confirmadas, datos pendientes y diferencia de registros. Esta diferencia no se presenta como deuda contributiva definitiva.

**Contratistas:** proveedor legal único con clasificación y referencia local no sensible, reutilizado entre DBA/proyectos. Se conserva el acumulado por pagador legal, proveedor y año natural. Documentos de relevo total, parcial opcional 6% o excepción estatutaria se registran con fundamento, fechas y vínculo documental opcional. Los pagos excluidos de esta retención no exigen un relevo ni una declaración jurada de excepción. Empleados, no residentes y casos especiales quedan identificados para tratamiento específico.

Cada pago separa servicios, IVU, reembolsos, retención real y neto real. El neto se concilia cuando todos sus componentes son conocidos. La simulación ordinaria aplica los primeros $500 y 10% al nuevo exceso: $300 y $400 producen $0 y $20. Una base previa pendiente no se sustituye por cero. Cada pago guarda la clasificación del proveedor y cálculo de ese momento. Añadir pagos anteriores o anular registros puede cambiar la simulación posterior; nunca reescribe lo realmente retenido. Es posible revisar un proveedor para próximos registros conservando sus instantáneas históricas.

**Obligaciones:** depósito/remesa y radicación son registros independientes. Se contemplan SC 2915, trámite municipal separado, depósito de servicios, 480.6SP-1 trimestral, 480.6SP por proveedor y 480.6SP.2 anual. Solo un pago confirmado con fecha, referencia e importe positivo entra como depositado/remitido. Se identifican fechas nominales, la alternativa trimestral condicionada de CC 19-10 y un vencimiento verificado opcional con fuente. No se inventan ajustes por feriados o prórrogas. Las anulaciones exigen motivo y conservan auditoría.

**Datos:** esquema 12, migración atómica 11→12, instantáneas, claves foráneas y prevención de duplicados. Los vínculos a cobros/gastos existentes verifican titular, vigencia y límites de los repartos conocidos, sin crear otro movimiento financiero. El respaldo cifrado incluye los registros nuevos y sigue admitiendo esquemas 9–11 con advertencias de reemplazo. Los importes desconocidos se conservan como null y los cálculos monetarios usan centavos y BigInt.

## Archivos

- `src/modules/business/obligations/`: catálogo, modelos, dominio, validación, servicio SQLite, formularios reutilizables, pantalla nativa y vista informativa web.
- `src/app/business-obligations.tsx`, enlaces desde Negocio, `src/storage/schemaV12.ts` y migración.
- Módulo de respaldos y guía de recuperación; pruebas nuevas `tests/business-obligations.test.ts`, recorrido web y actualización de fixtures de versiones anteriores.
- [Fuentes oficiales y alcance 2026](../tax/business-2026/SOURCES.md), [caso ficticio y capturas](evidence/business03/README.md).

## Validación

- 262 pruebas de lógica/servicios/SQLite aprobadas: 228 anteriores y 34 nuevas. TypeScript y ESLint aprobados.
- Caso ordinario $300 + $400 → $20; pagadores/proveedores/años separados, bases desconocidas, relevo total/parcial, documentos vencidos, no residentes y excepciones.
- Pagos anteriores y anulaciones recalculan escenarios sin cambiar retenciones reales. Instantáneas históricas conservadas al revisar un proveedor/oferta. Desglose de neto e importes reales desconocidos comprobados.
- Escenarios de IVU, 78 municipios/5 excepciones/73 consolidados, fecha de cambio, facilitadores, tasas especiales y datos insuficientes. Cobro propio, facilitador, remesa y radicación se mantienen separados.
- Prevención de duplicados/cruces de titular, vínculos a movimientos sin duplicación, límites de reparto y desglose, fechas base y confirmaciones, rollback de migración y respaldo 12/11.
- Reapertura de todos los registros desde un archivo SQLite real, con igualdad del contenido recuperado.
- Seis recorridos web aprobados, incluidos selección de los dos flujos, ambos temas, contraste con axe, anchos de 320/390/430/768 y regreso a Negocio. Las capturas son de la vista informativa, no de los formularios nativos.
- Exportación JavaScript web, Android e iOS; sin generar ni publicar APK/IPA firmados.

## Límites y siguiente bloque

Son simuladores y registros locales: no presentan formularios, no pagan en SURI ni determinan automáticamente toda exención, crédito o excepción legal. Fuentes verificadas al 9 de noviembre de 2026; escenarios de otros años/fechas indican revalidar vigencia. Los vencimientos son bases de consulta, no un calendario completo de obligaciones por perfil.

La interacción de estos formularios en simuladores/teléfonos y su accesibilidad con teclado/lector nativo sigue pendiente. El empaquetado JavaScript no es una compilación firmada APK/IPA. No se declara resuelta IOS-QA-10. La vista del navegador es informativa y no admite datos financieros.

La entrega se detiene aquí. El panel de ganancia/efectivo/reservas, escenarios y calendario por perfil corresponde al próximo bloque; nómina va después.

## Seguimiento de reparación iOS

IOS-QA-10 quedó resuelta para el recorrido de persistencia en simulador mediante la ejecución 42647274836, con texto exacto recuperado y cifrado/reapertura comprobados. Este seguimiento reemplaza el estado pendiente/diferido del informe original. [Reparaciones, evidencias y alcance](REPARACIONES-01.md). Las pruebas físicas y de publicación siguen pendientes.
