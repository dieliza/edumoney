# Pagos externos — registros manuales

Datos exclusivamente ficticios; no se ejecuta ninguna transferencia ni se confirma una transacción con bancos o Hacienda. Los formularios guardan lo que el usuario declara haber realizado fuera de EduMoney.

## Android aprobado

- [Simulación: retención real todavía pendiente](android/manual-payment-simulation-not-confirmed.png).
- [Dos pagos conservados después del reinicio](android/manual-payments-reopened.png).
- [Segundo pago y depósito externo confirmado tras reabrir](android/manual-deposit-reopened.png).
- [Resultado y valores comprobados](android/result.json).

Se inspeccionaron las tres capturas enlazadas. La simulación conserva datos reales pendientes hasta introducirlos manualmente; el depósito registrado no borra la retención histórica. Las imágenes muestran partes visibles de pantallas desplazables; las aserciones verifican los importes restantes y el recuento de dos pagos.

No se incluyen bases, claves ni comprobantes reales. Esta prueba de contratistas no amplía por sí sola la validación anterior de nómina. El presupuesto final es de siete casos, incluidos los dos controladores iOS y el primer fallo de localización del botón inicial.


## iOS aprobado

- [Simulación con retención real pendiente](ios/manual-payment-simulation-not-confirmed.png).
- [Dos pagos recuperados después de reiniciar](ios/manual-payments-reopened.png).
- [Depósito externo declarado por el usuario, separado de retención](ios/manual-deposit-reopened.png).
- [Resultado y controlador único](ios/result.json).
- [Cifrado](ios/database-check.json) y [reapertura con la misma huella](ios/database-reopened-check.json).

Se inspeccionaron las tres capturas iOS enlazadas. La palabra Confirmado corresponde a la declaración del usuario, no a una verificación bancaria ni de Hacienda. No se ejecutaron pagos externos.

[Recuento de siete casos](execution.json) · [Primer intento iOS](ios-first-result.json) · [Botón visible que el controlador no localizó](ios-profile-save-locator.png). Los comandos Maestro son pasos del recorrido y no casos adicionales.
