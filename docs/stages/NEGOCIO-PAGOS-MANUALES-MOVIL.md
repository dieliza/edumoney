# Negocio — registro manual de pagos realizados fuera de EduMoney

## Alcance confirmado por el usuario

EduMoney conserva registros de pagos y cobros efectuados fuera de la aplicación. No ejecuta transferencias, cargos ni pagos a empleados, proveedores o Hacienda; no requiere pasarela de cobros ni conexión bancaria. README.md recoge este alcance para evitar confundir «registrar» con «ejecutar».

Se revisaron los formularios y sus operaciones de almacenamiento. Los importes reales empiezan vacíos, se introducen manualmente y no se rellenan al simular. La confirmación de un depósito exige fecha, referencia e importe. No se añade integración financiera ni se cambia código de la aplicación en este bloque.

## Escenario ficticio de interfaz

Un titular local y un proveedor residente PR ficticios, sin relevo aplicable confirmado:

1. Registrar un servicio de $300 ya pagado fuera de EduMoney: retención real $0, neto real $300.
2. Simular un segundo servicio de $400 con retención/neto reales todavía vacíos. La estimación debe mostrar $20 y mantener los datos reales como pendientes.
3. Anotar manualmente retención realmente practicada $20 y neto realmente pagado $380; guardar. El resumen debe conservar servicios $700, retención estimada $20 y real $20, dos registros.
4. Registrar por separado un depósito de retenciones de $20 ya realizado fuera de EduMoney, con fecha, referencia ficticia y confirmación. Esto no reduce la retención histórica practicada ni genera otra transacción bancaria.
5. Reiniciar y comprobar ambos pagos, importes, recuento y depósito confirmado.

No se radica formulario ni se suben comprobantes reales. El escenario utiliza octubre de 2026 dentro del catálogo revisado previamente; no introduce reglas nuevas. La prueba de contratistas no se presenta como una prueba adicional de nómina de empleados.

## Verificaciones iniciales

Dos casos de tests/business-obligations.test.ts aprobados, 38 omitidos: retención real/neto desconocidos no copian la simulación; duplicar una confirmación no duplica la remesa y anular conserva auditoría. No se repiten los seis casos del bloque anterior. ESLint y TypeScript pasaron.

## Resultados móviles

| Plataforma | Procedimiento y ejecución | Resultado |
| --- | --- | --- |
| Android emulado, Wi-Fi y datos desactivados | fa16afb; [43133138099](https://github.com/dieliza/edumoney/actions/runs/43133138099), job 130901914188, artefacto 13906851878 | Aprobado: 195 comandos completados, diez ramas omitidas |
| iOS simulado | df57452; [43135367385](https://github.com/dieliza/edumoney/actions/runs/43135367385), job 130909315903, artefacto 13908710357 | Aprobado: 218 comandos completados, tres ramas omitidas |

El escenario exclusivo business-manual-payments omite la suite general y limita iOS a una invocación de testHttpServer por trabajo. Ambas aplicaciones proceden de 42948943240 con código 905d96f; no se cambia la aplicación ni se añade una librería financiera.

Las aserciones exactas comprobaron el segundo escenario con retención estimada de $20 y retención real pendiente antes de introducirla. Después se registraron manualmente retención real $20 y neto real $380. Tras reiniciar se conservaron servicios $700, dos pagos, netos $300/$380 y retención real $20. El depósito declarado aparte por $20 quedó con fecha, referencia y confirmación manual; la retención histórica siguió siendo $20.

Se inspeccionaron las capturas de simulación pendiente, pagos reabiertos y depósito reabierto en ambas plataformas. Las capturas muestran partes visibles de pantallas desplazables; las aserciones cubren los restantes importes. Confirmado expresa la declaración del usuario y no una consulta o certificación bancaria/de Hacienda. No se envía dinero ni se radica formulario.

En iOS se verificaron cabecera cifrada, rechazo de SQLite sin clave, exclusión de respaldo automático e igual huella tras reabrir: 21643d042415162b5b4cc3ad47a2d90db63550a4c8261d19826060d69cc6ecc8, 569344 bytes. No se publican bases ni claves.

## Corrección del primer intento iOS

El iOS inicial de 43133138099 falló antes de guardar el perfil de titular: job 130901913900, artefacto 13906134381. El botón Guardar perfil comercial aparece visible y con identificador business-save en captura/jerarquía, pero scrollUntilVisible con centrado no completó el paso. No se habían creado los registros financieros del escenario.

df57452 ajustó únicamente iOS para encontrar esa acción por su etiqueta, sin centrado forzado y con espera de animación. No se modificaron importes, datos de la aplicación ni aserciones financieras. La repetición iOS aprobó. Android aprobado no se repitió. Cada trabajo iOS inició solo un testHttpServer y ninguna suite interna adicional del controlador.

## Presupuesto y cambios

**Siete casos en total:** dos de código aprobados; un recorrido Android aprobado; un recorrido iOS inicial fallido y otro aprobado; dos casos de controlador iOS. Treinta y ocho casos unitarios omitidos, sin suite general ni repetición de los casos de código. Los comandos Maestro son pasos, no casos adicionales. ESLint y TypeScript pasaron localmente y en el trabajo Android.

Se añadió .maestro/business-manual-payments.yaml y la selección acotada en .github/workflows/planilla-validation.yml; README.md fija el alcance manual. Se añadieron este informe y su evidencia. No se añadió pasarela de cobro, conexión bancaria, ejecución de pagos ni código de aplicación.

[Capturas, resultados y presupuesto](evidence/business-manual-payments/README.md).

## Próximos pasos y límites

Continuar con registros manuales de cobros/remesas IVU, manteniendo estimación, cobrado, remitido y presentado separados. Quedan relevos y casos especiales desde la interfaz, comprobantes seleccionados y dispositivos físicos. Los registros de nómina se verificaron en sus bloques previos y no se repitieron aquí. QA-NEGOCIO-02 de exportación sigue pendiente; este escenario no lo revalida. Main permanece intacto; no se publica.
