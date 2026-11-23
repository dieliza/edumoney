# EduMoney: preparación contributiva anual, avance de desarrollo

Rama `codex/edumoney-tax-annual-qa-2026`, base `web-edumoney`, PR #2. No fusionado, desplegado ni radicado.

## Funcionalidad incorporada

- Reutiliza el cierre anual y su almacenamiento local cifrado. El cuestionario combina perfiles, abre una pregunta a la vez, conserva respuestas al guardar y da acceso a fuentes de Hacienda.
- Toma una lectura del libro anual. No suma transferencias, préstamos, aportaciones a metas, pagos de principal ni declaraciones informativas al ingreso. Un depósito no sustituye el bruto. Una retención desconocida no vale cero.
- Da una cifra preliminar de gastos cuando el usuario revisa y marca un gasto comercial o el porcentaje documentado de uno mixto. Cambios en el movimiento o su revisión invalidan la selección. No determina deducibilidad legal ni calcula inventario, costo de ventas o pérdidas trasladables.
- Sugiere A, A1, CT y J–N según las respuestas, sin presumir que un comercio o cuentapropista cae en un anejo particular.
- Crédito por Trabajo 2025: estimación independiente, solo con confirmación de requisitos y cantidades verificadas del Anejo CT. No modifica el saldo ni la planilla. Exactamente $10,000 de otros ingresos queda en revisión por el conflicto de redacción entre versiones oficiales.
- Informativas 2026: referencias versionadas al BI RI 26-06 y al 480.6SP. Estimación general 2026 de retención por pagador/prestador, incorporando el tramo exento de los primeros $500 y sin sustituir retención del comprobante. No radica ni emite informativas.
- Conserva el botón de borrador existente y añade el informe anual y el resumen de retenciones y créditos. El PDF 482 toma las tres páginas originales informativas de 2025 e inserta solo importes salariales verificados y de dólar entero en las líneas 1(i), 1(iii) y 27A. Para el alcance todavía no mapeado, deja en blanco y genera un resumen de revisión. CT se adjunta como referencia sin completar cuando se solicita revisar créditos en 2025. Ningún PDF se certifica o radica.

## Cinco simulaciones de doce meses

Montos USD, no son importes de planilla; las retenciones son asentadas en el libro de prueba, no estimadas desde depósitos.

| Perfil | Bruto documentado | Gastos anotados | Parte marcada para deducción | Retención asentada | Diferencia preliminar |
|---|---:|---:|---:|---:|---:|
| Asalariado | 36,000 | 1,500 | 0 | 1,200 | 36,000 |
| Contratista | 27,600 | 6,960 | 3,900 | 1,800 | Pendiente, duplicado y gasto por revisar |
| Cuentapropista | 9,600 | 12,480 | 12,000 | 0 confirmado | -2,400, no es pérdida fiscal determinada |
| Comerciante | 48,000 | 26,400 | 6,000 | 0 confirmado | Pendiente, inventario y costo de ventas |
| Mixto | 41,800 parcial | 2,640 | 2,640 | 2,080 parcial | Pendiente, depósito sin bruto/retención en diciembre |

El archivo de revisión aporta tres PDF por perfil. Los documentos de cuatro perfiles no salariales son borradores parciales, no una planilla completada. Los recorridos de simulación se ejecutaron por debajo del límite de 100 casos del repositorio.

## Verificación y límites de entrega

- `npm run lint`, `npm run typecheck`, compilación web local. No se ejecutaron suites completas de la aplicación.
- Seis suites focalizadas: 42 casos aprobados en el pase principal; se repitieron 6 casos PDF tras el ajuste final de privacidad y rotulado. Los cinco casos del expediente y los cinco del generador de PDF están dentro de esa cobertura, no son validaciones móviles.
- Dos intentos del recorrido Playwright quedaron bloqueados antes de abrir la página: Chromium no pudo crear su socket local en el entorno. Falta ejecutar el recorrido en un equipo con navegador compatible y comprobar acciones de descarga y reapertura; no confundir con los PDF verificados como archivos por pruebas automatizadas. No se probó iOS/Android.
- Falta mapeo verificado de todos los encasillados del 482 y de los anejos J–N, CT y otros aplicables. No automatizar saldo o deducibilidad de los perfiles no cubiertos sin completar reglas y conciliaciones.
- Al 23 de noviembre de 2026, el repositorio oficial muestra 482 y CT 2025; se verificaron las informativas 2026. No se encontró versión oficial 482/CT 2026. No reutilizar reglas ni PDFs 2025 para 2026.

## Fuentes directas

- Paquete 482 y CT 2025: https://hacienda.pr.gov/node/5770
- Instrucciones revisadas 2025: https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_1_abr_26.pdf
- Crédito por Trabajo 2025: https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-01-bi-ri-26-01
- Informativas 2026: https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-06-bi-ri-26-06
- Retenciones de servicios, Rev. 06.26: https://hacienda.pr.gov/sites/default/files/documentos/480.6sp_2026_informativo.pdf#page=2

## Segunda pasada: borrador del Formulario 482 de 2025

- Se conserva el PDF informativo de Hacienda y se trasladan las cantidades a sus encasillados, no a un facsímil recreado. Se añadieron identificación opcional (nombre e inicial, apellidos), los renglones ordinarios de ingresos, exenciones, contribución regular, pagos y saldo, y el traslado del saldo a la línea correspondiente de la página 1.
- Cubre el recorrido de contribuyente individual residente todo el año por la tabla regular. Requiere recabar comprobantes y anejos y confirmar explícitamente los datos que no se pueden obtener de los registros. Un campo pendiente no equivale a cero.
- Los anejos B, K y M se reproducen en páginas oficiales. Se trasladan los importes revisados de B III.22 a 27B, K IV.9 a 2Q y M IV.9 a 2S. La retención 480.6SP se puede identificar en B III.9 sin duplicar su importe como otro pago. El CT confirmado va a 27C; el estimador permanece separado y el anejo adjunto es referencia.
- En la plantilla informativa se presentan dólares enteros. En porcentajes, este borrador descarta fracciones y lo señala; no se ha validado equivalencia con la precisión de SURI. No se exportan SSN ni cuentas bancarias, ni se firma o radica un borrador.
- No se automatizaron pérdidas, el ajuste gradual sobre $500,000 de neto tributable, declaración conjunta o separada, régimen opcional, CT completo, ni todos los renglones de los anejos. Un contribuyente con datos no conciliados puede descargar un borrador, pero su saldo permanece pendiente. No se reutiliza el 482 de 2025 para 2026.

### Verificación de esta pasada

Se ejecutaron 26 casos automatizados únicos, incluida la generación de 15 PDF ficticios (informe anual, resumen de retenciones y borrador 482 por cada perfil) y la inspección visual de las posiciones de importes; se repitió el conjunto PDF después de corregir un valor esperado en el caso sintético. Pasaron TypeScript, ESLint y la compilación web. Chromium no pudo iniciarse en este entorno (socket denegado antes de navegar): no se pudo comprobar la descarga pulsando el botón ni la persistencia en navegador; no se declara la prueba de punta a punta como aprobada.

| Perfil ficticio, 12 meses | Resultado revisado |
| --- | --- |
| Asalariado | $36,000 de sueldos y $1,200 retenidos; $796 de balance del borrador, según la convención de importes del borrador. |
| Contratista | $27,600 brutos, $23,700 de ganancia del Anejo M confirmada para la simulación, $1,800 de B; $1,079 de sobrepago. No se computó dos veces una informativa duplicada. |
| Comerciante | $48,000 de ventas sin IVU. Ganancia y saldo sin determinar hasta confirmar inventario y costo de ventas. |
| Cuentapropista | $9,600 brutos; pérdida contable preliminar de $2,400. No se trasladó como pérdida contributiva ni se presumió saldo cero. |
| Ingresos mixtos | $26,400 de sueldos en W-2PR; los servicios de diciembre están pendientes de conciliación. No se sustituyó el depósito por ingreso bruto ni se calculó saldo final. |

Fuentes: [Formulario y anejos informativos 2025](https://hacienda.pr.gov/node/5770), [Instrucciones revisadas de 2025](https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_1_abr_26.pdf), [Boletín 26-06 sobre informativas 2026](https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-06-bi-ri-26-06).
