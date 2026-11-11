# UI-NEGOCIO-01 — Comprobación visual completada

Rama `negocio-etiquetas-validacion-visual`, sobre la corrección de etiquetas `905d96f`. Android e iOS muestran **Recibido** en el botón y en la ficha del recibo, también después de reiniciar. Las capturas fueron inspeccionadas. No se modifica main ni se publica.

## Resultados

| Plataforma | Aplicación y recorrido | Resultado |
| --- | --- | --- |
| Android, Pixel 6 API 35 emulado | Nueva compilación en [42948943240](https://github.com/dieliza/edumoney/actions/runs/42948943240), job 130288423060 | Aprobado; botón/ficha en español, importe y nota conservados al reiniciar, sin Wi-Fi ni datos |
| iOS, iPhone 17 Pro con iOS 26.4 simulado | Aplicación nueva compilada en 42948943240, reutilizada en [42951147933](https://github.com/dieliza/edumoney/actions/runs/42951147933), job 130295486009 | Aprobado; botón/ficha en español, reinicio, cifrado y exclusión de respaldo comprobados |

Las aplicaciones incorporan el cambio de etiquetas; no se utilizaron los binarios históricos que mostraban received. El código de aplicación no volvió a cambiar durante este seguimiento. El recorrido creó datos exclusivamente ficticios mediante la interfaz. La comprobación visual concreta corresponde al estado Recibido; las demás etiquetas conservan la implementación compartida documentada en el bloque de código.

## Presupuesto final

El usuario amplió el límite de cinco a **diez casos**. Se contabilizan conservadoramente:

- Tres casos de código anteriores, contados una sola vez y no repetidos.
- Un recorrido Android nuevo.
- Un recorrido iOS nuevo.
- Un caso del servidor XCTest iOS, observado en el registro; las seis pruebas internas de clasificación no se ejecutaron.
- Un primer arranque iOS fallido, contado como intento adicional aunque no inició XCTest ni el recorrido.

**Total conservador: 7 de 10.** No quedan trabajos activos y no se ejecutan más casos de esta corrección. La suite unitaria completa se omitió; TypeScript y ESLint pasaron en CI.

## Diagnóstico del primer arranque

El trabajo iOS inicial de 42948943240 terminó al rechazar Xcode la opción `-test-iterations 1`: exige un valor mayor que uno cuando se usa esa opción. No comenzó ningún caso. Se eliminó esa opción y se mantuvieron `only-testing` y el marcador que permite una sola invocación del controlador por trabajo.

El selector `maestro-driver-iosUITests/maestro_driver_iosUITests/testHttpServer` limitó efectivamente el controlador a un caso, verificado en `ios-driver-selection.json`. El script exclusivo de CI delega las demás órdenes a Xcode y no se incluye en EduMoney. El Android de la ejecución original sí aprobó; el fallo global de esa ejecución corresponde al arranque iOS, no a la aplicación Android.

## Evidencia y límites

[Capturas, aserciones, resultados y presupuesto](evidence/receipt-status-visual/README.md). Se conservan el importe y la nota del recibo después de reiniciar. En iOS, la base presenta cabecera cifrada, rechaza lectura SQLite sin clave y conserva el mismo SHA-256 al reabrir; se verificó su exclusión del respaldo automático. No se publican bases ni claves.

Es verificación en emulador/simulador, sin certificación en teléfonos físicos ni publicación en tiendas. No se modifican importes, códigos documentales persistidos o reglas contributivas. La incidencia UI-NEGOCIO-01 queda cerrada para este alcance.
