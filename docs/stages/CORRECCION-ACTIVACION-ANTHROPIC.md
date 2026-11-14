# Activación de clave Anthropic

La captura del usuario mostraba «Confirma tu cuenta y el cobro por uso antes de activar»: el botón sí ejecutaba su acción, pero una selección desplegable independiente mantenía el valor pendiente. Se elimina ese requisito oculto y la confirmación explícita se realiza mediante el propio botón Activar, con texto contiguo que explica la facturación por uso y que activar no envía fotos ni genera una lectura.

ReceiptReaderSettings.web.tsx conserva clave en RAM, ojo de visibilidad, retirada de clave y autorización recordada. Al corregir el campo se limpia el error anterior; una clave incompleta conserva lo escrito. El aviso de éxito explica cómo probar una foto y distingue formato válido de acceso/saldo reales, que solo se comprueban en la primera lectura. La clave se retira del campo tras activar, permaneciendo en memoria de la sesión.

Pruebas: 9 casos aprobados (4 nuevos sobre eventos reales del componente renderizado con hooks y componentes básicos simulados, 5 regresiones del cliente). Se ejercita pegar/activar sin selector, error sin perder la clave, corregir/reintentar, retirar clave y ausencia de red durante activación. No se usó una clave real ni se enviaron fotos; no se verificó Safari físico/PWA instalada por falta de herramientas de navegador. No cambian datos financieros, API de lectura, autenticación ni GitHub main.

Marcador 2026.11.14.02. La clave sigue siendo temporal y se debe reintroducir al recargar o bloquear. La revisión/captura no cambia.

TypeScript, ESLint, git diff --check y compilación web correctos.
