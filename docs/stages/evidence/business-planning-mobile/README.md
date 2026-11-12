# Evidencia — panel comercial y escenario parcial

Datos ficticios. [Informe](../../NEGOCIO-PANEL-ESCENARIOS-MOVIL.md).

Android aprobado en [43149314846](https://github.com/dieliza/edumoney/actions/runs/43149314846): 95 comandos completados y 3 omitidos. Se conservan seis capturas originales. Se revisaron visualmente `scenario-partial-simulation.png`, `scenario-reopened.png` y `panel-not-modified-by-scenario.png`; cada una muestra solo la parte visible, mientras las aserciones verifican el recorrido completo mediante desplazamiento.

Ventas hipotéticas +$100, gasto operativo $0, resultado parcial $100. Cobros, pagos, equipo y efecto contributivo permanecen desconocidos. Reabrir conserva el escenario y sus supuestos; el panel conserva ganancia registrada $0 y efectivo/reservas pendientes. Las estimadas y la proyección completa solo se contrastaron con pruebas de cálculo, no se introdujeron en este recorrido móvil.

`logic-results.json` documenta cuatro casos iniciales y dos repeticiones tras corregir la fecha de prueba. Los dos archivos `*-startup-failure.json` documentan rechazo del formato de reinicio antes de comenzar el recorrido. `execution.json` cuenta nueve casos/intentos conservadores en total. No hubo casos de controlador iOS iniciados. La repetición corregida de iOS no pudo iniciarse por HTTP 401; no se declara aprobada.

Sin bases de datos, claves, binarios ni documentos reales. No se realizan operaciones de pago ni publicación.
