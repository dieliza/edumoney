# Evidencia de cierre

Datos completamente ficticios. [Informe y alcance](../../CIERRE-APP.md).

| Carpeta | Evidencia |
| --- | --- |
| web/ | Vistas informativas en ambos temas; siete casos de producción aprobados y bienvenida de desarrollo aprobada |
| android-partial/ | Escenario incompleto reabierto, finanzas originales sin cambios |
| android-complete/ | Estimada pagada declarada, efectivo, reservas, proyección y escenario reabiertos |
| android-export/ | CSV/JSON recibidos localmente; gasto $55, parte comercial $27.50, dos repartos y un movimiento |
| ios-complete/ | Panel completo y escenario reabiertos; cifrado y huella estable |
| ios-partial/ | Escenario incompleto, calendario y reapertura; cifrado y huella estable |
| ios-*-first/, ios-partial-second/, ios-partial-diagnostic/ | Intentos fallidos conservados para diagnóstico; no se presentan como resultados aprobados |

Las capturas son originales. Los campos fuera del área visible se comprueban mediante aserciones y desplazamientos. `result.json` de cada carpeta contiene ejecución, artefacto, procedimiento, estado y capturas revisadas cuando corresponde. `execution.json` conserva los 95 casos/intentos conservadores, incluidos fallos y controladores. No se incluyen binarios, claves, bases de datos ni comprobantes reales.

`logic-results.json`, `browser-diagnostics.json` y `ci-replaced.json` explican las comprobaciones de código, los problemas de entorno y el reemplazo de CI. El receptor Android es una herramienta de pruebas aislada, no un componente de la aplicación distribuida. No se realizaron cobros, transferencias, pagos ni radicación.

`android-device-build.json` documenta el APK interno arm64, su huella y comprobaciones de paquete; no añade casos ejecutados ni afirma uso físico verificado.
