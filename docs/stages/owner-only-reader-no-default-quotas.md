# Corrección de instrucciones — 2026.11.15.15

## Alcance solicitado
Anthropic automático para usuarios comunes, sin ver ni poder operar su configuración. Solo el propietario administra o desconecta. Retirar las cuotas impuestas sin autorización y consultar antes de añadir restricciones o cambios fuera de alcance.

## Cambios
- Pestaña API e IA visible únicamente tras verificar al propietario mediante el endpoint administrativo existente. Un enlace directo a esa pestaña no muestra controles a usuarios normales.
- Retirado del menú lateral el acceso al lector de fotos. Ruta antigua /receipt-reader protegida: usuarios normales vuelven al inicio; solo el propietario puede abrirla. El componente de configuración también verifica propietario.
- El servidor conserva autorización de propietario para activar, desactivar, retirar claves o establecer una cuota. No se distribuyen claves ni se piden claves/activaciones a los usuarios. Captura y lectura automática permanecen.
- Estado predeterminado dailyLimit=null: sin cuota diaria o por IP de EduMoney. No se crean ni consultan contadores por IP.
- Valores diarios antiguos sin autorización explícita (incluido 200) se ignoran. No se borran configuraciones, claves ni datos; solo una acción administrativa explícita limit marca limitSetByOwner=true.
- Campo de cuota solo para propietario, vacío por defecto; vacío guardado elimina una cuota explícita. Sin techo diario arbitrario adicional. Se mantienen validaciones técnicas y límites propios del proveedor, que EduMoney no controla.
- Regla añadida a AGENTS.md para impedir nuevas cuotas no autorizadas y exposición de controles a usuarios comunes.

## Verificación
13 casos aprobados, una ejecución por caso, sin repeticiones. Incluyen API normal oculta aun con enlace directo, API visible solo al propietario, rechazo de todas las acciones administrativas a visitantes, lectura predeterminada automática, clave cifrada y no devuelta, desactivación exclusiva del propietario, cuotas solo explícitas, retirada de cuota y más de 200 reservas del mismo origen sin límite ni contadores por IP. Sin llamadas reales/facturables a Anthropic.
TypeScript, ESLint y compilación web/PWA correctos. Sin migraciones, cambios financieros, autenticación, sincronización o facturación. Pendiente comprobación visual en dispositivos físicos; no hay navegador disponible en este entorno. No se ejecutó suite general ni receipt-labels.
