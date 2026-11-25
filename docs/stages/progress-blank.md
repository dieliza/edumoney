# Pantalla blanca al abrir Mi progreso

Fallo reportado después de la versión 112. Reproducido con el módulo exacto publicado, ejecutando el efecto de apertura.

Causa: el adaptador de dependencias del módulo 856 no incluía AppState de react-native. La pantalla renderizaba inicialmente, pero al montar intentaba llamar AppState.addEventListener y lanzaba una excepción. La prueba anterior inspeccionaba el contenido inicial con datos, sin ejecutar ese efecto.

Corrección mínima: añadir AppState → módulo 214 en ese adaptador. La comprobación del paquete exige que sea la única diferencia del módulo; conserva byte por byte las otras 1,416 fábricas y los manejadores del servidor y de actualización. No hay cambios de datos, esquema ni cálculos.

Prevención: el generador ahora verifica que cada importación nativa usada por un componente esté conectada. La validación de Mi progreso ejecuta apertura, carga, refresco por datos guardados, retorno de la aplicación, pérdida de foco y limpieza de suscripciones; también comprueba un fallo de almacenamiento visible dentro de la pantalla.

Pruebas dirigidas: 1 reproducción del fallo, 1 comprobación de cambio único y 3 recorridos del ciclo de vida corregido. Las cinco pasan. Incluyen carga sin metas, avance real de 25% a 60%, refresco y limpieza, y mensaje de error de almacenamiento. TypeScript y ESLint sin errores; permanece la advertencia anterior de req sin usar. Compilación aprobada. No se atribuye a estas comprobaciones una navegación visual en Safari o dispositivo real.

Commit candidato: 7ad505746ab5158a4e51ba96da4cf79411c17c43. Publicación de la corrección en curso; autorización de publicar sin esperar confirmación se conserva de la sesión.
