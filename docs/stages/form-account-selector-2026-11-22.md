# Selector de cuenta en Nueva transacción

Cambio acotado solicitado: añadir Personal / Comercial inmediatamente después de Gasto / Ingreso y renombrar Historiales como Editar historiales. El selector reutiliza el almacén compartido de cuenta de v92, por lo que Home, capturas, gráficas y registro comercial siguen la misma selección. La persistencia, revisión CPA y clasificación contributiva comercial conservan exactamente sus servicios anteriores.

Solo se modifica MovementForm: nuevo selector, rótulo y clave del historial que incluye la cuenta para desmontar los resultados de la cuenta anterior al cambiar. Al seleccionar Comercial se usa el flujo comercial existente con su DBA/LLC y categorías reales. Pulsar de nuevo la cuenta ya elegida no modifica la recurrencia ni el formulario. Editar registros históricos mantiene su cuenta original.

Base publicada v92: hosting 58425dce0f87f395dc49552ed6ab911b73d60c6b. Se comprobó el HTML servido: registro /sw.js y build scope-92-20261122. El parche sustituye exclusivamente el contenido compilado de MovementForm (factory 831), conserva los demás factories y servidor y cambia URLs de recursos afectados y caché a form-account-93-20261122 para distribuirlo de forma segura. No borra ni reclasifica datos.

Validación: cuatro recorridos iniciales aprobados; cinco recorridos finales del artefacto aprobados: selector y guardado de gasto e ingreso en ambas cuentas, y conservación de recurrencia al pulsar Personal de nuevo. 9/100 casos usados en este bloque; sin suites generales ni CI adicional. TypeScript aprobado; ESLint sin errores y con una advertencia previa en patch-home-controls-site.cjs. Scripts válidos, servidor y factories ajenos idénticos, aliases de SW, registro canónico y precache válidos. Sin prueba visual en teléfono físico.
