# Negocio 1 — Titulares, DBA y proyectos

## Alcance

Se revisó la etapa 10 y se registró la incidencia de automatización iOS como [IOS-QA-10](../ISSUES.md), diferida por instrucción del usuario. Esta entrega implementa únicamente el primer bloque de Negocio. No se fusiona main ni se publica.

La quinta pestaña usa Expo Router, los componentes y temas existentes, y el mismo almacenamiento SQLCipher protegido por el dispositivo. No requiere cuenta, IA ni almacenamiento automático remoto. La vista web informa que los registros se utilizan en iOS/Android y no guarda datos comerciales.

## Implementación

- Formulario inicial vacío: nombre legal, forma jurídica, municipio y número de comerciante como texto, conservando ceros iniciales.
- Varios titulares; varios DBA y proyectos por titular. Un proyecto puede vincularse a un DBA de su mismo titular o directamente al titular.
- Para LLC: jurisdicción de constitución y uno/varios miembros o estado pendiente.
- Clasificaciones separadas de Puerto Rico y federal, ambas con Pendiente de confirmar. No se calculan ni se infieren por cantidad de miembros. Entidad ignorada se ofrece como clasificación federal de la LLC; no se copia a Puerto Rico.
- Crear, volver a abrir y editar perfiles; versiones e historial de correcciones. No se trasladan identificadores de DBA/proyecto a otros titulares.
- Migración atómica 9→10; cuatro tablas nuevas. No se modifica el historial financiero anterior.
- Respaldos actuales incluyen los perfiles. Se admite restauración del esquema 9 con advertencia expresa: al reemplazar todos los datos desde un respaldo sin Negocio, se retiran también los perfiles comerciales actuales.

## Archivos principales

`src/modules/business/{types,domain,store,HolderForm,BusinessScreen,BusinessRoute}.ts(x)`, ruta `src/app/(tabs)/business.tsx`, navegación de pestañas, `src/storage/schemaV10.ts`, migración y compatibilidad del módulo backup. Pruebas en `tests/business.test.ts` y `tests/browser/business.spec.ts`.

## Validación

204 pruebas aprobadas (195 anteriores y 9 de Negocio); TypeScript y ESLint aprobados. Cuatro recorridos de navegador aprobados, incluido Negocio en ambos temas y contraste; uno de los recorridos anteriores necesitó repetición por agotar su tiempo durante el análisis de contraste. Empaquetado JavaScript Android e iOS aprobado. La reapertura usa SQLite real en un archivo temporal con datos ficticios; no simula resultados de almacenamiento. La prueba del navegador cubre navegación y temas, no ejecución del formulario nativo. Queda pendiente probar este nuevo formulario en simuladores y teléfonos; el empaquetado JavaScript no equivale a una compilación APK/IPA ni a una prueba de interacción móvil. La incidencia IOS-QA-10 sigue diferida por instrucción del usuario.

## Próxima entrega

Ingresos, gastos y recibos por titular/proyecto; reparto de gastos, uso mixto, exportación para CPA y reservas manuales. No se implementan en este primer bloque, conforme a la instrucción de detenerse al terminar cada entrega.
