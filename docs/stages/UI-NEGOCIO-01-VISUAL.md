# UI-NEGOCIO-01 — Comprobación visual en nuevas compilaciones

Rama `negocio-etiquetas-validacion-visual`, sobre la corrección de etiquetas `905d96f`. No se modifica main ni se publica.

## Presupuesto autorizado

El usuario amplió el máximo de esta comprobación visual de cinco a **diez casos en total**, incluidas repeticiones y controles del controlador. No se repiten las tres pruebas de código aprobadas en el bloque anterior.

Plan acotado: un recorrido Android y uno iOS con el guion comercial existente, que exige Recibido en botón y ficha. El controlador iOS se filtra a su único servidor XCTest, sin ejecutar la suite interna de clasificación. Se impide una segunda invocación automática del controlador dentro del mismo trabajo. Presupuesto inicial reservado: tres casos nuevos. Se cuentan además una vez los tres casos de código ya aprobados: seis casos en total conservador, de un máximo de diez. No se permiten más de siete casos nuevos en este seguimiento. Antes de repetir se revisará el consumo observado.

## Compilaciones y procedimiento

Escenario específico `receipt-labels` del workflow registrado: omite `npm test`, mantiene las comprobaciones estáticas existentes y compila paquetes nuevos con el cambio de texto. No se usa `artifact_run` ni binarios históricos que mostraban received. La caché de compilación incorpora el hash del código de aplicación.

El selector XCTest se basa en el objetivo `maestro-driver-iosUITests` y clase/método `maestro_driver_iosUITests/testHttpServer`, documentados por el código del controlador. El script exclusivo de CI `scripts/limited-ios-driver/xcodebuild` solo aplica durante ese escenario, delega las demás órdenes a Xcode y permite una sola ejecución del servidor; no se incluye en EduMoney.

## Estado

Compilaciones y recorridos iniciados; no se declaran aprobados hasta comprobar capturas y resultado. [Registro y presupuesto](evidence/receipt-status-visual/execution.json).

La comprobación se realiza en emulador/simulador, con datos ficticios introducidos por interfaz. No sustituye revisión en teléfonos físicos. No se cambian importes, códigos documentales persistidos ni reglas contributivas.


### Seguimiento de arranque iOS

La ejecución [42948943240](https://github.com/dieliza/edumoney/actions/runs/42948943240) compiló ambas aplicaciones. El trabajo iOS se detuvo al iniciar Xcode porque `-test-iterations 1` no es válido: Xcode exige más de una iteración cuando se usa esa opción. No comenzó ningún caso XCTest ni el recorrido de la aplicación. Se cuenta conservadoramente como un intento fallido adicional.

Se elimina esa opción y se conserva el filtro `only-testing` y el marcador de una sola invocación. El reintento [42951147933](https://github.com/dieliza/edumoney/actions/runs/42951147933) reutiliza la aplicación actual compilada en esa misma ejecución; no reutiliza el binario histórico anterior a la corrección de etiquetas. Android sigue en su primer recorrido. Presupuesto conservador reservado incluyendo los tres casos previos: siete de diez.
