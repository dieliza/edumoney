# Ajustes solicitados a Presupuesto mensual

Base: EduMoney Web, versión 131 (`b845014f87b41fe3bfa232555eff5f7c8d36f409`). Rama de trabajo: `fix/budget-controls-and-readability`.

## Alcance

1. Activar los accesos a transferir al fondo de emergencia y aportar a una meta aun cuando el presupuesto sea un borrador o tenga cambios sin guardar. Ambos abren el editor existente; mantiene confirmación, selección de origen, validación del disponible e idempotencia. La transferencia se guarda independientemente del borrador. No se guardan silenciosamente los cambios pendientes del presupuesto.
2. Mostrar en «Ingresos netos mensuales» el **Balance disponible de Mi dinero**, según la aclaración explícita del usuario, sin campo de edición manual. El presupuesto toma su base del registro existente. Para períodos anteriores se consulta el balance a la fecha del período. Los ingresos recibidos y programados siguen separados: el balance no se registra como ingreso adicional. Las proyecciones manuales anteriores se conservan en el original histórico; al guardar el formulario actual se usa la base disponible.
3. Distribuir la pantalla en dos columnas compactas en tabletas/escritorio, colocando los paneles secundarios bajo el círculo y los totales junto a la distribución. En teléfonos vuelve a una columna, con importes y guardado antes de los paneles secundarios. Se reutilizan los mismos paneles y accesos.
4. Corregir el contraste de etiquetas, campos y enlaces de modales usando los colores de los formularios del tema. El historial dentro de una tarjeta usa colores de superficie, y su enlace de edición tiene azul legible. Los cambios de presentación del componente compartido solo se aplican cuando el presupuesto solicita `onSurface`; las demás pantallas conservan su apariencia y sus acciones.
5. Reubicar **Gastos anuales** dentro de **Distribuye tu dinero**, junto a las categorías, una sola vez. Se conservan calendario, aportaciones, historial y fondos vinculados.

No se añaden tablas, servicios ni APIs. Se mantiene el esquema cifrado 20. No se sustituyen los motores de ingresos, gastos, fondos, transferencias, metas ni educación.

## Validación

Resultados exactos en `validation.json` y `artifact-check.json`. Las pruebas usan registros FICTICIOS en SQLite en memoria y recorridos de componentes con el arnés de React ya utilizado por el repositorio. Comprueban apertura de los dos botones con borrador, selección de meta, ingreso de solo lectura, ubicación única de anualidades, contraste de modal, fuentes de balance, reserva/reversión, conservación de movimientos y respaldo. TypeScript y ESLint son comprobaciones separadas.

El paquete se aplica a la versión publicada, verifica las huellas de sus fuentes y conserva byte por byte todos los módulos ajenos al alcance. El historial compartido se modifica únicamente en sus ramas de presentación; sus funciones de edición/eliminación no se reescriben. El actualizador conserva notificaciones y activación segura.

No se dispone aquí de navegador interactivo ni iPad/iPhone/Safari físicos; no se afirma haber realizado capturas o revisión física. Las capturas del usuario se utilizan para identificar los problemas de contraste y distribución.

El estado final de publicación se registra en `source-result.json`.

Se comprobó además que transferir con un borrador conserva los vínculos personalizados de fondos y no guarda automáticamente las cantidades pendientes. La transferencia sigue siendo un registro independiente del presupuesto.

## Resultado

Publicado en producción: **versión 132**, build `budget-refinements-9a11afcaea92`, commit Sites `5effc7ab541fb7f6c6973bc71fa853432e2335dc`.

URL: https://edumoney-web.diegoluissantospabon.chatgpt.site

Despliegue `appgdep_6b08a5268d948191aff6bde271c474c9`: `succeeded`; servicios conservados en revisión 4. La comprobación pública confirmó HTML, código actualizado y service worker.

**23 casos distintos verificados; 54 ejecuciones incluidas las repeticiones, dentro del límite de 100.** Pruebas seleccionadas, TypeScript, ESLint, compilación y comprobaciones del paquete correctos. No se usaron datos financieros de usuarios para pruebas. La revisión física en Safari/iPad sigue pendiente por falta de dispositivos/navegador interactivo en este entorno.

Código y evidencia en la rama `fix/budget-controls-and-readability` de `dieliza/edumoney`.
