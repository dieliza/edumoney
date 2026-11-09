# Tasas y exportación de nómina — evidencia móvil

Datos exclusivamente ficticios, introducidos mediante la interfaz.

- `expected-ficticio.json`: valores esperados, no resultados medidos.
- `execution.json`: casos ejecutados, repeticiones y comprobaciones internas del controlador; máximo 100.
- `android-policy-assertions.json` e `ios-policy-assertions.json`: comprobaciones de valores guardados al reiniciar. Incluyen el fallo posterior de exportación del intento de origen, identificado en sus diagnósticos.
- `android-policy-reopened-first.png` e `ios-payroll-policy-reopened.png`: formulario reabierto con nota/fuente ficticias. Los porcentajes se verifican en las aserciones.
- `android-export-result.json` y `android-export-assertions.json`: recorrido breve aprobado de CSV y PDF.
- `android-payroll-received-*-local.png`: archivo leído por el receptor local sin red ni almacenamiento persistente.
- `*-diagnosis.json` y capturas de diagnóstico: intentos fallidos y causas observadas, no recorridos aprobados.

[Informe, ejecuciones y límites](../../NEGOCIO-05-TASAS-EXPORTACION-MOVIL.md).
