# IRA: eliminación completa de efectos y balance correcto

## Problema reproducido

La tarjeta IRA mostraba solo aportaciones menos retiros. No incluía el balance inicial ni rendimientos/correcciones, por lo que retirar un activo inicial podía mostrar una IRA negativa aunque su saldo real fuera cero. Además, la eliminación de v158 archivaba la cuenta pero sus saldos y transferencias seguían activos para el cálculo. Ejemplo ficticio: ingreso500, inicial IRA100, aportación100 y retiro200 dejaban disponible600, IRA−100 y total600 incluso después de eliminar la cuenta.

El inicial no es otro ingreso ni una transferencia desde el disponible: es un activo externo declarado. Por eso, mientras la cuenta existe, retirar ese activo puede elevar el efectivo disponible. Al eliminar por error toda la cuenta, debe anularse también ese efecto: no se debe crear un segundo retiro ni una devolución duplicada.

## Cambios

- Se elimina el bloqueo por saldo no nulo. Editar → Eliminar muestra el saldo, advierte si hay dinero y permite confirmar de todos modos.
- La advertencia muestra disponible antes/después y total después. Si eliminar revela un déficit por dinero retirado y posteriormente utilizado, se informa sin inventar fondos ni impedir la eliminación confirmada.
- Confirmar anula el efecto completo de la IRA en todos los cálculos: balance inicial, aportaciones, retiros, rendimientos y correcciones. Una aportación desde una reserva vuelve a esa reserva en los cálculos; no se devuelve dos veces al disponible.
- Una lectura financiera central excluye los registros de las IRA eliminadas. También corrige automáticamente las cuentas ya eliminadas con v158, sin nueva migración y sin una segunda eliminación.
- La tarjeta IRA muestra el saldo restringido actual: inicial + aportaciones + rendimientos/correcciones − retiros. Se cuenta una sola vez en el total y nunca como efectivo disponible.
- Las aportaciones anuladas no participan en la integración contributiva existente ni en sus límites combinados. Los ingresos/gastos originales y las demás IRA/fondos se mantienen.
- Se cancelan aportaciones programadas y se mantiene trazabilidad interna de la eliminación para auditoría e idempotencia; las filas anuladas no aparecen como movimientos financieros activos. No hay borrado parcial ni operaciones bancarias reales.
- Eliminación atómica, protección ante balances cambiados desde la advertencia y doble confirmación por pulsaciones repetidas.

## Alcance

Se reutilizan el formulario y su confirmación, MoneyStore, fundSummary, readFundData, money_funds.archived e ira_audit. Sin pantallas ni botones nuevos, sin migraciones, sin cambios de jurisdicción ni investigación contributiva mensual.

Archivos funcionales: src/modules/funds/domain.ts, src/modules/funds/read.ts, src/modules/funds/store.ts, src/modules/ira/store.ts y src/modules/ira/IRAScreen.tsx. Pruebas: tests/ira.test.ts. Empaquetado: web-enhancements/ira/deletion.cjs y verify-deletion.cjs.

## Validación

- 61/61 pruebas aprobadas: IRA32, fondos21 y jurisdicción8.
- 7/7 pruebas de presupuesto en modo simulación aprobadas.
- Total antes de producción: 77 ejecuciones de casos de un máximo de100 (68 de lógica y9 comprobaciones del paquete).
- TypeScript, ESLint de archivos afectados y git diff --check aprobados.
- Incluye: eliminación con dinero, inicial sin aportaciones, aportación y retiro total/parcial, rendimientos/correcciones, devolución al origen presupuestario, cuentas previamente eliminadas, respaldos/restauración, retiro ya revertido, concurrencia, error de escritura atómico, otras cuentas/Negocio y advertencia de balances obsoletos.
- No se probaron datos financieros reales ni se corrigió una cantidad fija en los datos del usuario. La corrección se aplica al cálculo, no resta100 arbitrariamente.
- Revisión visual interactiva no disponible: este entorno no ofrece la herramienta de navegador administrado. No se afirma prueba visual ni ejecución en dispositivos físicos.

Paquete: cinco módulos existentes modificados, cero módulos nuevos, 1,462 módulos no afectados conservados íntegros. Nueve comprobaciones aprobadas: hashes de fuente, límites del paquete, caché/alias del service worker, precarga, regla contributiva mensual y respuestas HTTP del Worker. Ver artifact-checks.json y package.json.

## Publicación

Versión159 publicada correctamente; source8b5516e62bdc6c4bc3e9da532a5d197b89219088. Acceso público y env revision4 conservados. URL: https://edumoney-web.diegoluissantospabon.chatgpt.site . Recibo: publication.json.

Comprobaciones HTTP de producción: página IRA y /sw.js devuelven200 y sirven la caché/build nuevos. Total del bloque:79 ejecuciones (68 de lógica,9 de paquete y2 HTTP), todas aprobadas. Ver production-http.json. No se afirma ejecución visual de formularios en navegador.
