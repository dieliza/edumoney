# Negocio 4 — Resultado, efectivo, reservas, escenarios y calendario

Continuación sobre la misma aplicación, después de cerrar IOS-QA-10 en el recorrido de persistencia de entrevista. Rama `negocio-04-panel-escenarios`. Se conserva la navegación, los temas y el almacenamiento SQLCipher. Sin fusión de main ni publicación de la aplicación.

## Implementación

Desde cada titular se abre «Panel y escenarios», con tres secciones: Resultado y efectivo, Comparar escenarios y Calendario. Cada año conserva configuración y registros propios, con fecha de corte. Los formularios monetarios empiezan en blanco; cero se introduce cuando se confirma.

**Ganancia:** resultado de las operaciones registradas antes de depreciación y ajustes contributivos. Las ventas usan bruto menos comisiones/devoluciones y separan IVU. Los gastos usan su parte comercial; desconocidos quedan pendientes. Se distingue operación, equipo/activo, contribución, financiación, capital y pendiente. Es necesario clasificar cada registro o confirmar expresamente que los restantes son operación. La clasificación queda vinculada a la versión del registro y debe revisarse si este cambia. No se determina renta tributable ni deducibilidad.

**Efectivo:** saldo inicial declarado al comenzar una fecha del año, más entradas y salidas posteriores hasta el corte. Una compra con crédito afecta el resultado operativo cuando corresponde, pero no efectivo hasta liquidarla. Préstamos, principal, capital, liquidaciones y pagos de activos pueden vincularse a movimientos existentes sin volver a incluir compras registradas. Un método «Otro», movimiento cambiado, pago sin conciliar o falta de confirmación de integridad deja el saldo pendiente. No se presenta como saldo bancario confirmado.

**Reservas:** se reutilizan las reservas manuales de contribuciones, IVU y nómina. No son gastos ni transferencias. Si falta una reserva se solicita importe o cero confirmado; si su última fecha es posterior al corte, no se trata como reserva histórica. El disponible después de reservas no incorpora obligaciones todavía no registradas. No se asigna automáticamente toda la reserva contributiva a una sola jurisdicción: se declara la parte que corresponde a la proyección.

**Estimadas y proyección:** registros de pagos por año y jurisdicción PR/federal, con estados pendiente o realizado, importe, fecha, referencia y tratamiento del efectivo. Un gasto vinculado debe coincidir completo con el pago y se excluye de operación como contribución; el efectivo solo se cuenta en el gasto original. Un pago separado se descuenta una vez. Un pago anterior a la fecha inicial queda incluido en ese saldo inicial, aunque siga contando como estimada del año. Confirmaciones duplicadas y cruces de titular se rechazan. Las anulaciones conservan motivo e historial.

La contribución anual proyectada y otros créditos/retenciones se introducen con fundamento; el panel resta las estimadas registradas del alcance elegido y calcula cuánto faltaría reservar. No se aplica una tasa genérica a ganancia, no se anualiza automáticamente ni se desarrolla aquí otro motor contributivo. La clasificación correspondiente, el fundamento y la integridad de pagos/créditos deben conocerse para presentar un saldo completo; los cálculos parciales siguen disponibles. El cambio del perfil exige revisar la proyección, y editar efectivo no ratifica su fundamento anterior. No se exige validación de CPA para calcular. El importe anual aportado no se valida como determinación legal de la obligación del titular o socios.

**Escenarios:** cambios independientes de ventas, gastos comerciales, cobros, pagos operativos, costo/pago de equipo y efecto contributivo supuesto. La compra de equipo afecta efectivo por lo pagado; no se presume deducción inmediata ni depreciación. La diferencia costo/pago es un importe pendiente/financiado hipotético, sin crear préstamo real. Se muestran cambios, resultado, efectivo, disponible, saldo y reserva faltante del supuesto. Varios escenarios pueden guardarse y editarse con auditoría; se recalculan frente a los registros actuales y el corte, sin modificar finanzas ni reservas. Se corrigió el formato de centavos negativos al editar cantidades.

**Calendario:** respuestas por perfil para IVU, contratistas, empleados, régimen estimado PR y año calendario. Se preparan fechas nominales y advertencias; presentación y pago permanecen separados. Una LLC no hereda automáticamente un régimen por sus miembros. Las fechas específicas verificadas guardan fuente, estado y confirmación propia. Se identifican trámites anuales, municipales, fiscales o de nómina pendientes de determinar. Las filas base son una guía, no otra deuda ni una confirmación de cumplimiento. Feriados, prórrogas, elecciones especiales, año fiscal distinto y obligaciones federales/municipales específicas requieren fechas verificadas por el usuario.

## Datos y archivos

`src/modules/business/planning/` contiene modelos, dominio, validación, servicio SQLite, formularios, pantalla nativa y vista web. Ruta `src/app/business-planning.tsx`, enlaces desde Negocio y ajuste de `inputAmount` para negativos. Esquema 13: tabla de registros del panel con relaciones, tipos, claves únicas, versiones, fechas y anulaciones; las correcciones conservan su estado anterior en el historial comercial. Respaldo ampliado, compatible con esquemas 9–12 mediante advertencias del reemplazo de datos ausentes.

## Fuentes y alcance de reglas

Se reutilizan las fuentes de [Negocio 3](../tax/business-2026/SOURCES.md), con catálogo consultado el 9 de noviembre de 2026, para fechas base IVU y servicios. Para estimadas se consultó el [480.E-1 oficial, revisión 10.16](https://hacienda.pr.gov/sites/default/files/documentos/480_e-1_0.pdf), que distingue fechas nominales de individuos y corporaciones con año iniciado el 1 de enero. Se usa únicamente como referencia de fechas base, sin importar tasas ni instrucciones de canales de pago antiguos. El [calendario de Hacienda](https://hacienda.pr.gov/calendario-contributivo) exige verificar el año y los documentos enlazados: un enlace sin año no se presume vigente. No se trasladan reglas monetarias de 2025 a 2026.

El calendario y las proyecciones pueden utilizarse sin conexión; abrir una fuente externa es una elección explícita. No se envían datos, no se exige cuenta y no se incorporan IA ni notificaciones push.

## Verificación

- 309 pruebas de lógica/servicios/SQLite aprobadas: 268 anteriores y 41 del panel. TypeScript y ESLint aprobados.
- Caso con estimadas ya realizadas: resultado, compras con crédito, activo, capital, efectivo, reservas, saldo proyectado y reserva faltante contrastados con importes independientes.
- Caso con perfil incompleto: conserva resultado/efectivo y deja el saldo contributivo pendiente sin exigir CPA ni convertir datos desconocidos en cero.
- Casos de parte mixta/personal, desglose desconocido, cambios de versión, fechas iniciales/cortes, reservas históricas y cierre del día de Puerto Rico frente a timestamps UTC.
- Estimadas vinculadas/separadas/pendientes, jurisdicciones, duplicados, relaciones de titular, anulaciones y ausencia de nuevas escrituras financieras al comparar escenarios.
- Escenarios con compras de equipo, cobros distintos de ventas, cantidades negativas, cambios contributivos declarados, datos incompletos y agregados fuera de rango.
- Calendario de individuo/corporación, regímenes pendientes, confirmaciones con fuente y trámites atendidos sin registrar otro pago.
- Migración 12→13 atómica, recuperación actual y de esquema 12, rechazo de relaciones cruzadas con rollback y reapertura desde archivo SQLite con igualdad completa.
- Siete recorridos web aprobados: navegación, tres apartados del panel, temas claro/oscuro, contraste con axe y tamaños pequeños/tablet. Capturas informativas en la evidencia.
- Empaquetado JavaScript web, iOS y Android aprobado. No se declara una nueva compilación firmada ni interacción nativa de estos formularios.

[Ejemplos ficticios y capturas](evidence/business04/README.md).

## Límites y siguiente entrega

Los nuevos formularios requieren todavía pruebas de interacción y accesibilidad en simuladores/teléfonos. El empaquetado JavaScript no es una compilación firmada para distribución. IOS-QA-10 sigue cerrada en su alcance de entrevista; ese resultado no se amplía a estos formularios nuevos. La web es informativa y no admite datos financieros.

La proyección contributiva de este bloque parte de importes anuales declarados con fundamento; no calcula automáticamente todos los impuestos de un negocio ni de sus socios. Las compras de equipo no incluyen un motor de depreciación, y los escenarios no son predicciones. No hay pagos, radicación ni cambios automáticos de reservas. Se detiene la entrega aquí; nómina corresponde al siguiente bloque.
