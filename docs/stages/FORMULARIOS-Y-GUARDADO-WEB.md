# Formularios y guardado web — 13 de noviembre de 2026

Versión visible: `2026.11.13.2`. Rama `web-edumoney`; GitHub main sin cambios.

## Cambios

- Los accesos «Volver a Mi dinero» usan ahora un botón Atrás con historial real y fallback a Mi dinero.
- La revisión de recibos, el movimiento manual y el vencimiento de deuda usan calendario. En web se usa el selector de fecha del navegador; el componente móvil conserva un calendario local accesible.
- Mis documentos incorpora búsqueda de comercio/descripción y un filtro desplegable Desde/Hasta, inclusivo. No se inventan fechas para documentos sin fecha; se informa sobre rangos invertidos y sobre limpiar los filtros.
- El total del recibo aparece expresamente, obligatorio para guardar una imagen. Conservar foto viene seleccionado y puede cambiarse; al conservarla desaparecen las opciones de texto original y la nota adicional del gasto. La nota sigue disponible cuando el tipo de registro es Nota.
- Se comprueba la huella de la imagen al capturar y al guardar. La misma foto abre la ficha existente sin otro movimiento. Comercio, fecha y total coincidentes también requieren revisar un posible duplicado; esto no permite garantizar reconocimiento de toda refotografía distinta. La confirmación de operación distinta corresponde solo a los valores que se están revisando.
- Se simplifica la confirmación final: pulsar Guardar información revisada confirma la revisión; ya no es necesario un segundo selector genérico. Se mantienen la elección de gasto/ingreso/factura/adjunto/nota y las validaciones financieras.
- Los importes monetarios muestran dos decimales y reciben los dígitos desde los centavos: 1 → 0.01, 100 → 1.00. Incluyen explicación y limpiar importe. Tasas y porcentajes mantienen entrada decimal normal. No se usan floats para convertir el dinero.
- El gasto manual pide elegir o crear categoría en la propia ficha, sin descripción obligatoria adicional. Las descripciones históricas se conservan al editar. La categoría aporta el concepto a los registros nuevos.
- La deuda obtiene nombre predeterminado del tipo elegido, con entidad/nombre identificador opcional. Por petición posterior del usuario se retira la fecha del saldo base de la ficha principal: solo se muestra vencimiento. Las deudas nuevas usan hoy como referencia interna explicada; las existentes conservan su referencia salvo conciliación confirmada. La fecha futura de saldo del ejemplo era rechazada por la validación; el vencimiento sí permite futuro. Los detalles opcionales de corte y cambios contractuales de APR permanecen aparte.
- La publicación incluye los cambios de Configuración y contraseñas pendientes de las sesiones anteriores: ojo, restablecimiento explícito y cambio de contraseña conservando datos. Se añade el número de versión visible en el acceso y Configuración.

## Validación

20 casos únicos verificados; 21 ejecuciones contando una repetición. Incluyen máscara monetaria, rangos, bóveda cifrada, contraseña, conservación del enlace, guardado y reapertura de foto/total/deuda, duplicación exacta, similitud, rollback al fallar el contenido y persistencia SQLite. La primera expectativa de similitud exigía la palabra «similar»; el mensaje se aclaró y esa prueba pasó al repetirse. Se corrigió también una observación de lint sobre estado derivado de confirmación, sin silenciar reglas.

TypeScript, ESLint, exportación web y empaquetado completados. Se leyeron las guías de Sites, entorno y revisión React. No había cua_repl.js ni herramienta de navegador disponible: no se afirma comprobación visual en Safari/iPad o Android físico. No se generó APK nativo en este bloque.

## Entrega

La autorización de Git de Sites volvió a estar disponible. Se publicó conservando identidad, R2, audiencia privada y datos existentes:

- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Fuente de alojamiento: `27ca1771fc2ccfeb029d9953e0690055b069c55d`.
- Deployment: `appgdep_6af6efa3b7e48191802b626784ae7965`.
- Estado: `succeeded`.

Recargar no requiere borrar almacenamiento. Restablecer una contraseña olvidada crea un espacio vacío y no descifra registros antiguos con la contraseña nueva; el flujo lo advierte antes de confirmar.

La copia del repositorio de aplicación quedó en un commit local. El push a GitHub falló por autenticación (`could not read Username for https://github.com`); esto no revierte la publicación exitosa del sitio ni la fuente de alojamiento ya subida. Queda pendiente enviar ese commit a `web-edumoney` cuando el acceso Git de GitHub se restablezca.
