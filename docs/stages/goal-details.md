# Fecha final, progreso, confirmación de nombre y balance del selector

Cambios solicitados por el propietario y publicación autorizada sin esperar nueva aprobación.

- Se retiró Tipo de meta del formulario. El nombre identifica el objetivo; la clasificación interna de las metas anteriores se conserva. Una meta nueva usa la clasificación general de ahorro sin añadir dinero.
- La fecha deseada existente ya era una fecha objetivo, no de inicio. Se reutiliza ese mismo dato, ahora con el rótulo Fecha final para alcanzar la meta y un calendario explícito obligatorio. También se exige al convertir una simulación en plan. No se inventa una fecha para registros anteriores ni se crean columnas.
- Mis metas identifica la fecha como final. Mi progreso muestra nombre, dinero reunido/objetivo, porcentaje, barra y fecha final de cada meta. Se actualiza al recibir el evento de datos guardados. Los importes proceden de aportaciones y transferencias confirmadas; no de proyecciones. Para financiar una meta concreta, se elige su nombre como destino de la transferencia.
- Guardar nombre muestra Guardado exitosamente en el botón y la confirmación solo después de persistir. Se reinicia al escribir otro nombre; no muestra éxito si falla el almacenamiento. Continúa guardándose solo el primer nombre.
- Origen y Destino muestran Balance disponible con su importe actual, usando la misma proyección de la cuenta activa que la pantalla de fondos. El valor interno de la opción no cambia.

No se alteraron balances, cálculos, tablas, respaldos, autenticación ni permisos. Las metas antiguas sin fecha siguen conservadas; el formulario pide definirla al guardarlas. Se mantienen las restricciones de financiación exclusivamente mediante transferencias.

Verificaciones: 37 ejecuciones de código contando repeticiones; una comprobación del paquete; 10 casos del artefacto final. Total conservador antes de la comprobación HTTP: 48 de 100. Se corrigió una expectativa del mensaje genérico de almacenamiento en una prueba, sin cambiar el tratamiento protegido de errores. Todos los casos pasan en su última ejecución. TypeScript y ESLint sin errores; permanece la advertencia anterior de req sin usar. Compilación aprobada. Las pruebas del paquete verifican un avance real de 25%, la fecha final requerida y el balance de $125.00 en el selector.

La integración cambia ocho módulos y conserva los otros 1,409, incluyendo premios, fuegos artificiales, controles móviles y funciones de cuenta. No se realizó navegación en Safari ni una revisión visual en dispositivos reales.

Commit candidato: d3fc4c4e39e2f00ec0e0b776c6ffdf24844fd7f2, preparado sobre producción 111. Publicación en curso.
