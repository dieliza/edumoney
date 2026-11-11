# Evidencia móvil de ingresos y reservas

Datos exclusivamente ficticios, introducidos por los formularios. No se conservan bases de datos, claves ni paquetes de aplicación en este directorio.

- [Android: reservas después del reinicio](android/reserves-reopened.png).
- [Android: gasto en cero después del reinicio](android/income-reopened.png).
- [Android: ingreso y reparto reabiertos](android/income-allocations-reopened.png).
- [Android: resultado y valores esperados](android/result.json).

- [iOS: reservas después del reinicio](ios/reserves-reopened.png).
- [iOS: ingreso y reparto reabiertos](ios/income-allocations-reopened.png).
- [iOS: resultado, controlador y valores esperados](ios/result.json).
- [Presupuesto y ejecución](execution.json).

Las capturas muestran la porción visible de pantallas desplazables; las aserciones del recorrido verifican el resto del desglose. Los comandos de Maestro son pasos de un solo recorrido, no casos adicionales. El informe de etapa registra también el caso del controlador XCTest iOS.
