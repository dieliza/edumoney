# Capturas y guardado — 2026.11.16.1

Incluye la separación compatible de ingresos y gastos documentada en income-expense-form-separation.md.

## Cambios
- Revisión de capturas sin selector de categoría ni pregunta repetida sobre el origen. El origen queda registrado automáticamente. Talonarios usan Salario existente; no se crean categorías Foto/Dictado.
- Capturas nuevas: datos únicamente. DocumentStore fuerza keepImage=false incluso si un llamador solicita conservar la foto. No se crean contenidos de imagen ni se incluyen fotos nuevas en respaldos. Previsualización temporal liberada al guardar/cerrar.
- Se mantienen imágenes históricas y originales de la fototeca. No cambia la política de retención del proveedor externo.
- Botón Guardar con validación visible, protección de doble pulsación y confirmación Guardado exitosamente tras persistencia. Un fallo al refrescar la lista no invalida un guardado confirmado.
- Regla documentada en AGENTS.md. Sin migraciones, cambios de autenticación/API ni cambios de cálculos financieros.

## Validación
- Bloque anterior de separación: 21 ejecuciones.
- Primer bloque de capturas: 11 ejecuciones (10 correctas; un fixture intentó duplicar Salario existente, corregido).
- Suite enfocada final: 36 correctas, documentos, capturas solo datos, interfaz de dirección y confirmación de guardado.
- Después de mejorar el mensaje de importe obligatorio y liberar la imagen de cheques al persistir: 5 pruebas de interfaz correctas.
- Total conservador combinado: 73 ejecuciones, inferior al máximo de 100.
- TypeScript, ESLint y compilación web se verifican antes de publicar.
- No se ejecutaron llamadas facturadas a Anthropic ni se accedió a datos personales.
- Pendiente validación manual en dispositivos físicos Safari/iPhone/iPad, Android y PWA. Este entorno no ofrece comprobación visual en navegador.
