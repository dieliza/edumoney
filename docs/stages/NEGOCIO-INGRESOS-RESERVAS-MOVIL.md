# Negocio — ingresos y reservas en móvil

## Alcance

Recorrido con datos ficticios desde formularios en blanco: depósito neto de $965.00, ventas brutas $1,000.00, comisiones $100.00, devoluciones $50.00 e IVU registrado $115.00. Reparto entre dos proyectos: $600.00 y $365.00. Reservas manuales: contribuciones $100.00, IVU $115.00 y nómina $0.00 confirmado. Verificar desglose, gastos en cero, conservación tras reiniciar y reparto sin duplicar el ingreso.

No cambia código de aplicación, tasas ni reglas. Los importes son ficticios; no constituyen un cálculo de IVU aplicable. No se modifica main ni se publica.

## Resultados

Rama `negocio-ingresos-reservas-movil`, procedimiento `8b2c119`. [Ejecución 42994152113](https://github.com/dieliza/edumoney/actions/runs/42994152113). Escenario exclusivo `business-income-reserves`; la suite general se omitió. Ambas aplicaciones se compilaron originalmente en 42948943240 con código `905d96f`, sin cambios posteriores en la aplicación.

| Plataforma | Resultado | Evidencia |
| --- | --- | --- |
| Android, Pixel 6 API 35 emulado | Aprobado, con Wi-Fi y datos desactivados | Job 130433936408; artefacto 13844031070; 183 comandos completados y tres ramas exclusivas de iOS omitidas |
| iOS, iPhone 17 Pro simulado | Aprobado; reapertura y cifrado verificados | Job 130433936741; artefacto 13844536166; 191 comandos completados |

Las aserciones exactas verificaron neto, ventas, comisiones, devoluciones, IVU, cero cobros con desglose pendiente y cero gastos antes y después de las reservas y del reinicio. Se conservaron la nota del cobro y las asignaciones de $600.00 y $365.00. Las capturas de reservas e ingreso repartido después del reinicio se inspeccionaron en ambas plataformas. Las capturas de pantallas desplazables muestran solo su porción visible; el resto del desglose está cubierto por las aserciones del recorrido.

En iOS se comprobó cabecera cifrada, rechazo de SQLite sin clave y el mismo SHA-256 antes/después de reabrir (`1d6e074554e2c8252a0d4b92461627fc1a41c922b55fa59ea8b971bd8e68dfde`, 569344 bytes). El paso nativo también verificó exclusión de respaldos automáticos. No se publican bases ni claves.

## Pruebas y archivos

**Tres casos en total, de un máximo voluntario de diez:** un recorrido Android, un recorrido iOS y un caso del servidor XCTest iOS. No hubo repeticiones, arranques fallidos ni pruebas unitarias adicionales. El registro confirma que solo inició `testHttpServer`; no se ejecutaron las seis pruebas internas de clasificación del controlador. Los comandos de Maestro son pasos de esos recorridos, no casos independientes. TypeScript y ESLint pasaron localmente y en el trabajo Android.

Se añadieron `.maestro/business-income-reserves.yaml`, la selección exclusiva del escenario en `.github/workflows/planilla-validation.yml`, este informe y su evidencia. El comentario del controlador limitado se amplió para reflejar que sirve a varios recorridos acotados; su funcionamiento no cambió. No fue necesaria una corrección de la aplicación.

[Capturas, resultados, comprobaciones de cifrado y presupuesto](evidence/business-income-reserves/README.md).

## Pendientes

Esta verificación cubre creación y persistencia de un ingreso con desglose y reservas manuales. No certifica tasas de IVU, disponibilidad bancaria ni trámites contributivos. Quedan revisión de clasificación/reparto, exportación comercial, imágenes/cámara, IVU/contratistas y panel/escenarios, además de teléfonos físicos. El siguiente bloque será revisión comercial y exportación; no se ejecuta dentro de este presupuesto. Main permanece intacto y no se publica.
