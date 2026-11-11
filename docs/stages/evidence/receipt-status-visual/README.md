# Etiquetas de recibos — evidencia de nuevas aplicaciones

Datos exclusivamente ficticios. Aplicación con la corrección `905d96f`, compilada en 42948943240; no se usan binarios anteriores a esa corrección.

- `execution.json`: presupuesto máximo 10, incluidos una vez los tres casos de código anteriores y los intentos fallidos contados conservadoramente.
- `android-result.json` y `android-assertions.json`: trabajo Android aprobado. La ejecución global incluye un fallo separado del primer arranque iOS.
- `android-business-receipt-linked.png`: botón del recibo con la etiqueta Recibido.
- `android-business-receipt-reopened.png`: ficha reabierta con Estado: Recibido, importe y nota ficticios.
- `ios-startup-diagnosis.json`: opción inválida de Xcode en el primer arranque; no se inició XCTest ni el recorrido. Se cuenta como un intento conservador y se corrige el parámetro.

El reintento iOS terminó aprobado; `ios-result.json` y `ios-assertions.json` conservan los resultados. `ios-driver-selection.json` verifica un solo caso XCTest. Las capturas `ios-business-receipt-*.png` muestran Recibido en botón y ficha; `ios-database-*.json` verifican cifrado/reapertura. Las capturas históricas con received pertenecen a la versión anterior y no son evidencia de este cambio.

[Informe y límites](../../UI-NEGOCIO-01-VISUAL.md).

Recuento conservador final: tres casos de código previos, dos recorridos nuevos, un servidor XCTest y un arranque fallido contado como intento: siete de diez. No se ejecutan más pruebas de este objetivo.
