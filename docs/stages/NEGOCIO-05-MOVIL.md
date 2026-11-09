# Seguimiento de nómina — interacción móvil

Trabajo sobre `negocio-05-validacion-movil`. El usuario limita la verificación a un máximo de 100 casos por bloque, incluidas repeticiones y CI; queda registrado en AGENTS.md. No se ejecuta la suite completa.

## Cambios

- Botón accesible para ocultar el teclado dentro de las fichas modales. Permanece fuera de su contenido desplazable y usa el comportamiento nativo del teclado.
- Identificadores estables para campos y acciones de los formularios de registros comerciales.
- Recorrido móvil sin perfiles precargados: crear un titular ficticio en la interfaz, guardar nombre/código/salario/notas de un empleado, reiniciar la aplicación y comprobar que se vuelven a abrir exactamente.
- Escenario `payroll` en el flujo nativo existente; omite expresamente la suite general de pruebas en CI. No cambia reglas de nómina, tablas, datos reales ni formato de emisión oficial.

## Verificaciones locales

36 casos de `tests/business-payroll.test.ts` aprobados en una sola ejecución. TypeScript y ESLint aprobados. YAML y diferencias revisados.

## Compilaciones y recorridos

Código de aplicación y recorrido: `3f03c59`. [Primera ejecución](https://github.com/dieliza/edumoney/actions/runs/42664986263): Android se detuvo al descargar Gradle (HTTP 500), antes de ejecutar pruebas. El trabajo iOS continúa por separado. El intento de repetir solo el trabajo Android fue rechazado por GitHub porque la ejecución contenedora seguía en curso; se inició una ejecución Android independiente sin cancelar iOS.

Los resultados y capturas móviles se añadirán al terminar. No se considera una compilación ni recorrido aprobado mientras esté pendiente.
