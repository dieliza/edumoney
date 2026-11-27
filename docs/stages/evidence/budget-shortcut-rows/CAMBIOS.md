# Accesos de emergencia y metas como renglones propios

Se retiran las acciones de dentro del renglón Ahorros y se colocan dos renglones propios al final de la lista, antes de Añadir categoría: Fondo de emergencia y Transferir a meta. Se reutilizan los mismos manejadores, fondo existente, selector de metas y editor de transferencias. Los accesos aparecen una sola vez; no se crean nuevas categorías contables ni fondos por este cambio de ubicación. No se duplican cantidades ni se modifican balances o datos.

Único componente de producto modificado: MonthlyBudgetCenter.web.tsx. Los importes de la lista continúan siendo de solo lectura; no cambian los centavos automáticos ni la distribución anual. Se mantienen los estilos y temas existentes.

El paquete comparte también prefijos repetidos de URL para mantener el tamaño dentro del límite del alojamiento. Se preservan y comparan todas las rutas y payloads; se ejecuta la reconstrucción del diccionario en una VM. El lector de artefactos reconoce ambos formatos. Ninguna URL publicada se elimina. No hay cambios de autenticación, permisos, SQL ni lógica financiera.

Pruebas focalizadas de posición de los renglones, apertura de emergencia y elección de meta; TypeScript y ESLint. Validación del paquete y entrega pública. Sin navegador interactivo ni dispositivos físicos: no se afirma revisión física en Safari/iPad.

Versión 140 publicada desde `ec144ee3071c5393f576d42441f54da548322336`; se mantienen audiencia pública y entorno 4. Tres casos de código aprobados, dos verificaciones de artefacto (la primera bloqueó el tamaño excesivo; la segunda pasó), una comprobación pública aprobada: 6/100 ejecuciones. TypeScript, ESLint y compilación aprobados. Reconstrucción completa de rutas verificada en VM y payloads presentes. Worker final 62.61 MiB. HTML, bundle y service worker públicos entregan `budget-shortcut-rows-6dec8e2ba8d5`. Pendiente revisión física en Safari/iPad por falta de dispositivo/navegador interactivo.
