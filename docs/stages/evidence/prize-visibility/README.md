# Reparación de premio invisible — preparada, sin publicar

25 de noviembre de 2026. Base pública: versión 103, commit 958cf1638c9ca8ed25d2e13923bff9326f69723c.

La captura del usuario confirma que el mensaje sí estaba renderizado, pero heredaba texto casi blanco de NativeSurfaceTheme/Card(row) dentro de una ventana blanca. La celebración estaba después del texto y terminaba transparente, por lo que podía quedar fuera de la zona visible y ya no verse al desplazarse.

Se reemplaza exclusivamente la presentación w del premio por un contenedor con fondo y color explícitos según el tema. Se elimina el Card(row) que introducía la herencia incorrecta. Todos los textos del premio tienen color explícito; los pares verificados superan 4.5:1 de contraste. La imagen y las tres explosiones comparten una escena de 156 px, con las partículas superpuestas alrededor de la imagen. El desplazamiento sitúa el comienzo del premio en la ventana. Hay dos rondas finitas con un breve retraso inicial; al terminar permanece el destello coloreado y aparece la opción de continuar a los 4.3 s. Con movimiento reducido permanece la imagen estática de los destellos, sin animación. No se vuelve a introducir ningún botón de desactivación.

La reparación conserva el resto del módulo educativo, los diez premios/mensajes, el progreso y las reglas de notificaciones de la versión 103. El empaquetador comprueba que solo cambien las rutas de HTML, CSS del premio y service worker; agrega el nuevo bundle y stylesheet. También renueva el CSS anterior para evitar que la regla antigua display:none oculte los destellos.

Verificación: dos recorridos del script de premios (el segundo añade contraste numérico y compatibilidad con CSS anterior) sobre el módulo realmente empaquetado. Se revisaron diez premios, leído/incorrecto/repetido, siguiente lección, límite, colores claros/oscuros, escena/overlay de partículas y movimiento reducido. Se verificó sintaxis del Worker, compilación Python, TypeScript y ESLint (solo conserva req sin uso anterior). Sin suite general; menos de 60 escenarios contando ambas ejecuciones y controles estáticos.

Límite: no se pudo inspeccionar un navegador o iPhone/Safari real. El entorno tiene archivos de control de escritorio, pero no ofrece cua_repl.js; no se eludió la restricción de Sites usando otro controlador o servidor de preview. La fotografía del usuario aportó la evidencia visual del defecto y se añadieron comprobaciones explícitas de contraste y estructura que faltaron anteriormente.

Por falta de espacio compartido (<1 MB), el repositorio actual se abrió en una sesión temporal en memoria, preservando el checkout local ajeno. Los helpers de Sites no están instalados. La reparación quedó empaquetada y comprobada en esa copia, pero no se envió.

## Bloqueo de publicación

La revisión automática rechazó el comando de commit y push a origin/main. Motivo: interpreta que la aprobación anterior cubría únicamente la versión 103 y exige otra aprobación explícita para esta reparación posterior. No se eludió el rechazo. No se creó una versión pública nueva; el sitio permanece en la 103. Se conserva el módulo revisado en ../learn-prize-feedback/reviewed-visibility-panel.txt y el código de empaquetado en web-enhancements/learn-feedback.
