# Gasto mixto y recibo manual — evidencia móvil

Datos exclusivamente ficticios introducidos por formularios reales.

- `expected-ficticio.json`: valores esperados, no resultados medidos.
- `execution.json`: casos ejecutados, repeticiones y presupuesto de 100.
- `android-result.json` e `ios-result.json`, con sus aserciones: recorridos completos aprobados en ambos simuladores.
- `android-business-mixed-total.png` y `android-business-project-one.png`: vista por titular y primer proyecto.
- `android-business-mixed-reopened.png`: total $55.00 y parte comercial $20.63 después de reiniciar.
- `android-business-receipt-linked.png` y `android-business-receipt-reopened.png`: recibo manual y nota exacta recuperada.
- `android-yaml-diagnosis.json`: fallo del primer guion antes de introducir datos; no es evidencia de fallo de la aplicación.

Las capturas `ios-business-*` comprueban los mismos importes y la nota del recibo. Los archivos `ios-database-*.json` verifican cifrado y hash idéntico después de reabrir. No se conserva imagen de cámara/fototeca en este caso.

[Informe y límites](../../NEGOCIO-MOVIMIENTOS-MOVIL.md).
