# Distribución recomendada por objetivo, fecha y frecuencia

Solicitud confirmada por el usuario: cada renglón usa cantidad objetivo, fecha de culminación y frecuencia elegida para calcular la recomendación. Se trabaja sobre EduMoney Web 133, repositorio `dieliza/edumoney`, rama `feat/budget-periodic-recommendations`.

## Cambios de interfaz

- Se retira del formulario actual el renglón predeterminado «Necesidades básicas» y su importe editable; se conserva «Ver pagos pendientes» como acceso independiente dentro del mismo cuadro.
- «Añadir categoría» queda inmediatamente antes de «Gastos anuales».
- «Distribución recomendada» siempre abre la configuración, incluso con balance cero. Cada categoría activa sin subcategorías tiene su propio acceso; los grupos se distribuyen mediante sus subcategorías.
- El usuario configura objetivo, fecha límite y frecuencia: semanal, quincenal, mensual o anual. Puede ajustar la primera aportación.
- Se muestra cuánto aportar, cuántas aportaciones faltan, última aportación exacta, fechas y cantidad correspondiente al mes seleccionado. Aplicar afecta solo la planificación y conserva las demás categorías.
- La acción global permite configurar las categorías y aplicar las que ya tienen configuración, sin restablecer repartos fijos ni reintroducir el renglón retirado.
- Gastos anuales reutiliza importe, vencimiento, fondo y editor existentes, añadiendo la frecuencia y el cálculo correspondiente. «Reservar dinero» sigue usando la transferencia existente con confirmación.

## Cálculos

- Importes enteros en centavos y divisiones con BigInt. La última cuota se ajusta para alcanzar exactamente el objetivo. Nunca se generan aportaciones fraccionarias menores que un centavo ni dinero adicional.
- Semanal: cada 7 días desde la primera aportación. Quincenal: primera aportación indicada y, después, días 15 y último día de cada mes. La interfaz identifica explícitamente esta regla. Mensual/anual: fecha anclada original, ajustada al último día en meses cortos y años no bisiestos.
- Se cuentan fechas reales; no se supone que cada mes tiene cuatro semanas. El cálculo usa búsqueda sobre el calendario, sin crear registros para cada fecha, incluso con plazos largos.
- Se descuenta lo ya aplicado a la categoría o reservado en sus fondos existentes. El inicio del objetivo conserva los gastos del período al copiar el presupuesto a meses posteriores. Las retiradas y las compras no duplican el mismo dinero.
- El presupuesto mensual recomendado incluye lo ya utilizado ese mes más las aportaciones aún pendientes dentro de ese mes. Cambiar una recomendación no confirma movimientos ni ejecuta transferencias bancarias.

## Integridad y compatibilidad

No se eliminan ingresos, gastos, recibos, fondos ni transferencias. Los gastos sin asignación presupuestaria continúan visibles como información de movimientos realizados, sin un nuevo renglón editable ni atribución arbitraria a otra categoría. Los originales históricos conservan su configuración anterior. Si el renglón retirado tenía subcategorías personalizadas, se conservan como categorías principales.

La clasificación existente de movimientos se reutiliza tanto para el progreso mensual como para las recomendaciones. Se conservan separación personal/comercial, compras versus pagos de tarjetas y aportaciones internas. No se añaden tablas, servicios ni otro sistema de metas/calendario: los parámetros nuevos son opcionales en el JSON del presupuesto existente, esquema cifrado 20. Se mantienen respaldos anteriores.

Archivos de aplicación: `types.ts`, `domain.ts`, `contributions.ts`, `recommendations.ts`, `ContributionFields.web.tsx`, `RecommendationEditor.web.tsx`, `MonthlyBudgetCenter.web.tsx`, `AnnualExpenses.web.tsx`, todos dentro de `src/modules/budget`.

## Validación

Resultados en `validation.json` y `artifact-check.json`. Pruebas con SQLite en memoria y datos FICTICIOS: calendario, quincenas, bisiestos, redondeo, reserva previa, importes pequeños, cuotas vencidas, fechas inválidas, copia y respaldo, eliminación segura del renglón, clasificación de gastos, frecuencia anual y botones de configuración. Se mantienen las pruebas de decimales y contraste de la versión anterior. TypeScript y ESLint son verificaciones separadas.

No hay navegador interactivo ni dispositivo Safari/iPad físico en este entorno; no se afirma una prueba física ni capturas nuevas. La entrega pública y el actualizador se comprueban separadamente al finalizar.

## Corrección del paquete de publicación

La primera publicación (versión 134) fue rechazada por superar el límite de tamaño del Worker; la versión 133 permaneció disponible. Se identificaron seis archivos de contenido compilado sin importación desde el servidor. Se retiran únicamente esos archivos y se exige que todos los archivos de ejecución retenidos, las 19,561 rutas y los 1,439 módulos de aplicación permanezcan idénticos. No se eliminan recursos de ninguna ruta publicada ni datos. Se limpia el directorio generado `dist/server` antes de compilar para evitar reintroducir archivos sobrantes. Esta corrección afecta al empaquetado, no a la lógica implementada.

## Entrega final

Versión 135 publicada correctamente y entrega pública verificada (HTML, módulo de presupuesto y service worker). Fuente Sites: `346466832375ec71af67703b01badae0bacb828a`; revisión de entorno 4 conservada. Paquete: 60.88 MiB frente al límite de 63.9 MiB. La versión 134 fallida se resolvió con limpieza de archivos compilados sin uso.

77 casos distintos aprobados, 84 ejecuciones aprobadas incluidas repeticiones, más 1 intento de publicación fallido por tamaño (85/100). TypeScript, ESLint, compilación y comprobación de entrega pública aprobados. No hubo migraciones SQL ni modificación de registros financieros de usuarios. Queda pendiente la revisión física en Safari/iPhone/iPad; no se dispone de navegador interactivo en este entorno.
