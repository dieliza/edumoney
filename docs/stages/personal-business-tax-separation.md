# Personal sencillo y Hacienda solo en Negocio — 2026.11.16.6

## Alcance autorizado
El propietario pidió retirar de lo personal todas las preguntas/controles contributivos y conservarlos solamente en Negocio. Las fotos personales nuevas no se guardan: solo datos. Negocio conserva automáticamente las fotos cifradas. Esta instrucción sustituye la conservación selectiva anterior y el acceso contable desde Configuración personal. No se borran registros, datos ni fotos históricas.

## Implementación
- Reutilización de IncomeDocumentsScreen en modo personal predeterminado y modo business explícito, con claves de ruta separadas para no reutilizar estado del otro contexto.
- Personal: fecha, importe recibido, pagador/referencia, método reconocido y confirmación de ingreso recibido. Sin Administrar deducciones, categorías de retención, reglas, porcentajes, estado fiscal, dirección/municipio contributivos ni cuestionario de Hacienda. El bruto/descuentos que ya estén impresos se conservan como datos, sin preguntas ni tasas nuevas.
- Nuevo ingreso personal: importe recibido directo, sin pedir bruto o retención ni inventar ceros. Para registros existentes se conservan los datos originales de bruto/retención. Los agregados y gráficas mantienen sus cálculos sobre el importe registrado.
- Negocio: accesos Para el contable y Cheques y talonarios del negocio; conserva el formulario avanzado existente, categorías, reglas, orientación y exportaciones. Retirado el acceso contable de Configuración personal.
- DocumentInput admite contexto personal/business aditivo sin columna/migración. DocumentStore impone datos solamente por defecto aunque el llamador pida keepImage=true. Solo el contexto explícito business conserva nuevas imágenes. BusinessReceiptForm y formulario comercial envían ese contexto. Identificadores, hash de duplicados, links y transacciones permanecen.
- Las capturas personales no generan nuevas orientaciones de gastos ni marcas contables automáticas. La orientación del expediente de Negocio se limita a movimientos comerciales/mixtos o vinculados a business_entries. Los eventos/perfiles históricos se conservan.
- El reconocimiento de método y los datos impresos siguen funcionando. La revisión personal de recibos ya no muestra ReadingDetailsForm ni advertencias contributivas del lector. Privacidad y AGENTS actualizados con la política vigente.
- Sin cambios de autenticación, API/modelo, cuotas, facturación, sincronización, esquema ni registros existentes. No hay borrado retroactivo de imágenes ni de originales de la fototeca.

## Verificación
65 casos correctos sin fallos: 19 en income-save-ui/data-only-capture/entry-direction-ui/expense-guide-storage; 41 en documents/entry-direction-ui/expense-guide; una regresión seleccionada de business-ledger (recibo mixto con copia, impuestos impresos y exportación), más cuatro de income-statements sobre totales, persistencia atómica, rollback y datos estructurados comerciales. Incluye SQLite real, backups sin bytes de imágenes personales, copias comerciales, separación de años/bases, conservación de bruto/neto/descuentos reconocidos, nuevos ingresos sin retenciones inventadas, idempotencia, rollback, errores y feedback de guardado. No se lanzaron suites generales ni se llamó a Anthropic.
TypeScript y ESLint sin errores/avisos. Compilación y publicación se anotan en el cierre. Dispositivos físicos Safari/iPhone/iPad, Android y PWA pendientes: no hay QA visual disponible en este entorno.

## Cierre de publicación
TypeScript, ESLint sin avisos, diff --check, compilación web y sintaxis Worker correctos. Implementación fd4ba49, rama web-edumoney. Fuente hosting 1c99847fa9e027fe47a1eb85d0fb4110481883e9. Sites versión 62: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_e52c0bc012448191a5e8a60b6e9d8e43. Despliegue appgdep_6afa82c5087481919dfd42dd38c9de5a succeeded, configuración existente conservada (env_set_revision=1). URL https://edumoney-web.diegoluissantospabon.chatgpt.site, versión visible 2026.11.16.6. Validación física de dispositivos pendiente.
