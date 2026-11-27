# Mis metas: depósito inicial y resumen independiente

Base publicada: versión 147. Implementación limitada a metas, sus fondos, resumen y acceso de Inicio.

- Depósito inicial opcional en Nueva meta con el mismo campo monetario y decimales automáticos existentes. Al guardar, crea meta y transferencia desde Balance disponible en una transacción. Identificador estable previene duplicados; saldo insuficiente revierte todo.
- Tarjeta Mis metas separada de Ahorros y fondo de emergencia. Las fórmulas contables originales de disponible/total no cambian; se separa la presentación y el historial filtrado de Ahorros. Los movimientos siguen visibles globalmente y por meta.
- Eliminado el acceso violeta Transferir de Inicio; Mis dictados ocupa su posición. Se conserva el sistema de transferencias y la lógica publicada de voz.
- Fechas de aportación en texto, con despliegue de todas las fechas, y acción explícita para activar notificaciones del dispositivo. Reutiliza calendario y servicio de avisos existentes; los avisos cubren los próximos 90 días y se renuevan al abrir la app. El permiso depende del dispositivo.
- Frecuencias semanal, quincenal, mensual y anual. Migración aditiva 22 añade `goals.cadence_yearly`, sin reconstruir tablas ni borrar registros; respaldos 9–22 compatibles.

Validación: 24 pruebas dirigidas reproducibles aprobadas (17 + 7), TypeScript y ESLint aprobados, build web aprobado y escenario de ejecución de fábricas Metro aprobado. Se corrigieron dos aserciones del simulador SSR que omitía atributos/títulos, sin modificar el producto por ello. El contador conservador incluye 62 casos iniciados antes de la compactación cuyos resultados no se retuvieron, dos paquetes, tres intentos del escenario y la comprobación pública final. No se utilizaron datos reales para pruebas destructivas.

El empaquetador verifica todos los recursos precargados, alias SW y conservación de módulos ajenos (incluido Aprende); mantiene la activación segura y el push. No hubo recorrido manual en iPhone/iPad: las comprobaciones de interfaz usan SSR y componentes simulados.

Archivos y hashes: `package.json`. Evidencia de pruebas: `tests.log`, `ui-tests.log`, `validation.json`. Estado de publicación y fuente exacta: `publication.json`.
