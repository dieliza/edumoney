# Mis metas: pista de aportaciones, celebración y quincenas

Al seleccionar una meta, el detalle muestra una pista numerada que termina en Finish. Las etapas y cantidades cubiertas son verdes, las pendientes rojas y las parciales indican el dinero ya cubierto. Cada meta mantiene un color de pista derivado de su identificador y muestra su nombre. La pista usa umbrales de dinero acumulado: un depósito puede cubrir varias etapas y una retirada/reversión reduce el avance. No se crean pagos ficticios ni registros para dibujar la pista. Las pistas largas muestran 12 etapas por página y abren en el avance actual.

Al alcanzar el objetivo se muestra ¡Lo lograste!, una ilustración SVG de trofeo y vítores y las explosiones finitas de fuegos artificiales reutilizadas de Aprende. La ilustración permanece al reabrir; una marca de celebración evita repetir la animación por el mismo objetivo vigente. La comprobación de cumplimiento se hace con aportaciones reales activas y transferencias confirmadas, nunca con sugerencias. La marca no aumenta el dinero ni cambia la versión financiera de la meta.

Semanal, Quincenal (15 y fin de mes) y Mensual están disponibles en la creación/edición de metas y en el formulario de plan vinculado existente. Se reutiliza el calendario de aportaciones para calcular fechas reales y ajustar la última cuota al centavo. Ejemplo: $1,000 del 1 al 30 de noviembre produce cuatro etapas semanales de $250. La fecha inicial del plan se conserva para que el número de etapas no disminuya solo por pasar los días; cambia al modificar objetivo, vencimiento o frecuencia.

## Datos y compatibilidad

Migración local 20 → 21 aditiva: cadence_detail, track_start_date y celebrated_target_cents en goals. Se conserva la columna de frecuencia original y todos los identificadores, importes, referencias, movimientos y fondos. Las metas anteriores toman el primer aporte conocido, la creación del fondo o la fecha de actualización como inicio, ya que el esquema anterior no guardaba fecha de creación de la meta. Se admiten respaldos 9–21; los anteriores rellenan únicamente los metadatos nuevos. No se reconstruyen tablas ni se cambian balances.

El guardado y las transferencias existentes siguen siendo la única fuente de dinero real. Presupuesto mensual mantiene su aislamiento como simulación; no se cambia su lógica. Se actualizan las ayudas de frecuencia y Mis metas. No se modifica Aprende: se conserva su módulo y se reutiliza su CSS de fuegos artificiales.

## Publicación y validación

Pruebas con SQLite en memoria y datos FICTICIOS: cuatro aportaciones, parciales, retiradas, redondeo, cadencias, persistencia, creación desde fondos, celebración única, migración y reversión por fallo, respaldos 20/21, integridad de fondos y flujos existentes. Renderizado SSR en claro/oscuro, premio, paginación y actualización al confirmar aportaciones. TypeScript y ESLint. No hay navegador interactivo ni iPhone/iPad físico; no se afirma validación física.

Para respetar el límite de alojamiento sin eliminar URLs se comparten prefijos idénticos de payloads estáticos. La expansión se comprueba contra cada recurso original y se ejecuta en VM, junto con la reconstrucción de rutas y los manejadores existentes del service worker. Este empaquetado no contiene datos financieros ni modifica almacenamiento de usuarios.

Versión 142 publicada correctamente. Entrega pública del HTML, paquete y service worker comprobada. 67 casos de código distintos; 73 ejecuciones de código con repeticiones, más artefacto y entrega pública: 75 ejecuciones reales, 76 contando conservadoramente un arranque sin casos. Límite de 100 respetado. TypeScript y ESLint aprobados. No se ejecutaron pruebas destructivas con datos de usuarios. Ver source-result.json, validation.json y public-delivery.json para identificadores y resultados.
