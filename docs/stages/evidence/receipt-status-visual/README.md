# Etiquetas de recibos — evidencia de nuevas aplicaciones

Datos exclusivamente ficticios. Aplicación con la corrección `905d96f`, compilada en 42948943240; no se usan binarios anteriores a esa corrección.

- `execution.json`: presupuesto máximo 10, incluidos una vez los tres casos de código anteriores y los intentos fallidos contados conservadoramente.
- `android-result.json` y `android-assertions.json`: trabajo Android aprobado. La ejecución global incluye un fallo separado del primer arranque iOS.
- `android-business-receipt-linked.png`: botón del recibo con la etiqueta Recibido.
- `android-business-receipt-reopened.png`: ficha reabierta con Estado: Recibido, importe y nota ficticios.
- `ios-startup-diagnosis.json`: opción inválida de Xcode en el primer arranque; no se inició XCTest ni el recorrido. Se cuenta como un intento conservador y se corrige el parámetro.

El reintento iOS sigue activo. Las capturas históricas con received pertenecen a la versión anterior y no son evidencia de este cambio.

[Informe y límites](../../UI-NEGOCIO-01-VISUAL.md).
