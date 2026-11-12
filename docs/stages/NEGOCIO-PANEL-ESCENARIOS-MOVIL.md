# Negocio — panel y escenario parcial en móvil

## Alcance

Continuación de la verificación comercial, sin modificar código de aplicación, reglas ni main. Rama `negocio-panel-escenarios-movil`, procedimiento `9d1dceb`, aplicación `905d96f`. Se reutilizan los paquetes de emulador/simulador de 42948943240. No hay cobros, transferencias ni pagos desde EduMoney.

## Corrección de las pruebas de cálculo

Se ejecutaron cuatro casos seleccionados de `tests/business-planning.test.ts`: dos pasaron y dos fallaron porque las reservas se guardaban con el reloj real, posterior al corte fijo de 2026-11-09. La regla de reservas históricas correctamente devolvía pendiente. Se fijó solo Date en las pruebas a 2026-11-09T12:00:00Z, con restauración del reloj al finalizar cada caso; se conservan las expectativas numéricas y el código de producción. Los dos casos afectados aprobaron al repetirlos. ESLint y TypeScript aprobaron después del ajuste.

Cifras contrastadas: ganancia $700, efectivo $2,115, reservas $365, disponible $1,750, estimadas pagadas $100, saldo proyectado $650 y faltaría reservar $450. En el escenario completo, ganancia $1,100, mismo efectivo, saldo supuesto $730 y reserva faltante $530. Estos son ejemplos ficticios; la contribución anual parte de un importe declarado con fundamento, sin tasa genérica automática ni aprobación obligatoria de CPA.

Los otros dos casos seleccionados verifican perfil incompleto con cálculos parciales y escenario con cobros/efecto contributivo desconocidos. No se repiten porque ya aprobaron.

## Recorrido móvil

[43148887073](https://github.com/dieliza/edumoney/actions/runs/43148887073), escenario exclusivo `business-planning-partial`. Se omite la suite general y se limita el controlador iOS a un `testHttpServer` por trabajo.

Se crea un titular ficticio con clasificaciones pendientes. Se comprueban resultado de operaciones vacías $0, efectivo y reservas pendientes, y saldo contributivo pendiente. Se guarda un escenario con ventas +$100, gastos operativos $0 y supuestos ficticios, dejando cobros, pagos, equipo y efecto contributivo desconocidos. La simulación debe mostrar resultado parcial $100 y efectivo pendiente. El calendario debe solicitar confirmar régimen. Al reiniciar se comprueban nombre, resultado y supuestos; volver al panel debe conservar ganancia registrada $0 y efectivo pendiente.

El primer intento se detuvo antes del recorrido por el formato descrito abajo. Este escenario no comprueba entrada móvil de una proyección completa o de un pago estimado: esos importes se contrastan aquí solo con las pruebas seleccionadas de cálculo.

## Archivos

- `tests/business-planning.test.ts`: fecha estable para pruebas.
- `.maestro/business-planning-partial.yaml`: formularios vacíos, simulación, guardado y reapertura.
- `.github/workflows/planilla-validation.yml`: escenario selectivo y reutilización de paquetes.
- Este informe y `evidence/business-planning-mobile/`: evidencia y conteo del bloque.

Pendientes: flujo móvil con proyección completa, pagos estimados y escenarios completos; pruebas físicas y accesibilidad. El calendario conserva textos antiguos que anuncian nómina como próxima etapa, aunque el módulo ya existe; se registra para corregir el texto en un bloque de interfaz. No bloquea cálculos ni registros.

## Incidencias de arranque y acceso

La primera ejecución `43148887073` rechazó `stopApp: null` antes de iniciar comandos de aplicación en ambos sistemas. Se corrigió el formato a comandos escalares `stopApp`/`launchApp` en `6fe7609`. Se cuentan conservadoramente dos intentos fallidos, aunque no hubo casos de aplicación ni controlador iniciados.

Android corregido: [43149314846](https://github.com/dieliza/edumoney/actions/runs/43149314846), **aprobado** (95 comandos completados, 3 omitidos). El inicio del iOS corregido fue rechazado dos veces con `HTTP 401: Bad credentials` al solicitar `workflow_dispatch`. No se inició esa repetición ni se cuentan esas solicitudes como casos ejecutados. El conector permite consultar resultados, pero no ofrece iniciar un workflow nuevo; repetir el trabajo antiguo ejecutaría el formato incorrecto, por lo que no se hace. No se cambiaron credenciales ni permisos.

## Resultado final del bloque

Android aprobado: el escenario y sus supuestos permanecen después de reiniciar; el panel conserva ganancia registrada $0 y efectivo/reservas pendientes. Se revisaron tres capturas originales: simulación parcial, escenario reabierto y panel sin cambios. Las aserciones cubren las partes fuera de la porción visible. [Capturas y resultados](evidence/business-planning-mobile/README.md).

Conteo conservador **9 casos/intentos**: cuatro pruebas iniciales, dos repeticiones corregidas, dos arranques rechazados antes de abrir la aplicación y un recorrido Android aprobado. Ningún caso de controlador iOS inició. Las dos solicitudes HTTP 401 no iniciaron trabajos ni suman casos. No se ejecutaron suites generales.

ESLint y TypeScript aprobaron. iOS corregido sigue pendiente por autenticación; no se extrapola el éxito Android. Main intacto y aplicación sin publicar.
