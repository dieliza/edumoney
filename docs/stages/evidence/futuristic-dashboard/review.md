# Dashboard Futurista — EduMoney

## Implementación
- Selector Dashboard: Original/Futurista, dentro del selector existente de apariencia. Preferencia versionada y persistente mediante el mismo almacenamiento de configuración; independiente de Claro, Oscuro, Automático y Crash Boat.
- Original mantiene los mismos elementos, importes y destinos. El nuevo diseño consume los mismos valores calculados y callbacks de FundsSummary; ninguna escritura financiera ni fórmula nueva.
- Total en círculo digital, balance disponible destacado, Ahorros, Fondo de emergencia, Presupuesto mensual, Mis metas e IRA. Se conservan logo oficial, saludo de primer nombre, ayuda contextual, acciones de captura, controles Personal/Comercial/Transacciones y navegación existentes.
- Paisaje ilustrativo de El Morro generado para esta interfaz, optimizado en WebP640px/42,544bytes y1280px/148,150bytes. Sin nombres, balances ni datos del usuario incrustados en las imágenes.
- Horarios solares calculados localmente para San Juan mediante ecuaciones NOAA: https://gml.noaa.gov/grad/solcalc/calcdetails.html . Amanecer y atardecer varían diariamente. La refracción y condiciones atmosféricas pueden desplazar unos minutos el horario observado.
- Transición gradual de iluminación, luces nocturnas y haz suave del faro. Independientes del tema; colores de la interfaz responden a ThemeProvider. Movimiento reducido elimina animación/transición; pestaña oculta detiene reloj y pausa el haz. Actualización del reloj por minuto, sin sondeos de red.
- Diseño adaptado por media queries a teléfonos, tabletas y escritorio, foco visible, nombres accesibles y contraste reforzado detrás de fecha y notas.

## Integridad
Sin migraciones ni cambios de permisos, saldos, fondos, aportaciones, transferencias, historiales, recibos, autenticación o lógica contributiva. El paquete verifica módulos financieros no modificados y conserva todos los recursos/rutas previos y los manejadores del service worker.

## Validación
17 pruebas unitarias dirigidas aprobadas (11 de esta implementación y6 de temas). Una suite histórica approved-home no pudo cargar por la sintaxis Flow de dependencias nativas; no ejecutó casos. Se documenta este arranque fallido y no se modifica esa suite ajena al cambio.

Comprobación adicional del paquete: comparación exacta del árbol Original contra la versión163, igualdad de valores, conservación de todos los destinos, cambio mediante el selector, separación comercial, ausencia de mutación de la proyección y bytes de imágenes/precache. Ver runtime.json al finalizar.

TypeScript y ESLint sin errores. No hay herramienta de navegador disponible en este entorno: no se efectuó una inspección visual interactiva ni una medición en dispositivos reales. Las verificaciones de renderizado y acciones son pruebas automatizadas del código empaquetado, no una navegación manual.

Las8 comprobaciones finales del paquete aprobaron. Se verificaron1,466 módulos ajenos sin cambios; las únicas modificaciones respecto a la versión163 son FundsSummary/ThemePicker y cinco módulos nuevos de presentación/configuración. Tamaño final del Worker66,867,081bytes, dentro del límite63.9MiB. Sin migraciones.

## Publicación
Versión164 publicada correctamente. Las cinco comprobaciones HTTP en producción aprobaron: HTML y protecciones vigentes, service worker canónico y build correcto, JavaScript compartido con el selector/nuevo diseño y los dos WebP con bytes idénticos a los assets validados. Fuente df2ef733c9ea300e030cf301e5a0d3020db55156; se mantienen público y revisión4 del entorno.39 de100 ejecuciones consumidas, incluidas repeticiones y el arranque fallido de la suite histórica.

Para activarlo: Temas → Dashboard → Futurista. Original sigue disponible. No se requiere borrar almacenamiento ni datos financieros. La comprobación visual interactiva en navegadores/dispositivos reales queda pendiente por falta de la herramienta en este entorno.
