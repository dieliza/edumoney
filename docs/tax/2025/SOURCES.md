# Fuentes 2025 y alcance del catálogo

Consultadas el 9 de noviembre de 2026. Solo se usan fuentes del Departamento de Hacienda de Puerto Rico.

| Documento | Revisión | SHA-256 del archivo consultado |
| --- | --- | --- |
| [Formulario 482 informativo](https://hacienda.pr.gov/sites/default/files/individuos_2025_rev._20_jun_25_informativo.pdf) | 20 junio 2025 | `c17c5ba0d8c0d2751ed3fe7bcb1b0ed10eb94cdf0129a28c6c056e8229b40761` |
| [Instrucciones de individuos 2025](https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_27_feb_262.pdf) | 27 febrero 2026 | `02b5e36ba629fa776ded68c2330d7b68e303ae58ee5d62db80dea0812d29b59f` |

[Repositorio de la planilla 2025](https://hacienda.pr.gov/node/5770) · [Carta Circular 26-02](https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-26-02-cc-ri-26-02).

Catálogo `PR-482-2025-research.1`, definido en `src/modules/planilla/catalog.ts`. No se hereda a 2026. La falta de revisión profesional no bloquea el cálculo; el usuario puede registrar su revisión por nombre, estado y notas. Ese registro no afirma certificación de Hacienda ni valida por sí mismo reglas aún no implementadas.

## Fórmulas implementadas

- Encasillados 11 y 13 del 499R-2/W-2PR: transcripción de salarios sujetos y retención; no se infieren del depósito ni del bruto genérico de una informativa.
- Exención personal individual de $3,500, únicamente bajo los supuestos confirmados del caso inicial.
- Tabla regular: $0 hasta $9,000; 7% del exceso hasta $25,000; $1,120 más 14% del exceso hasta $41,500; $3,430 más 25% del exceso hasta $61,500; $8,430 más 33% del exceso sobre $61,500.
- Factor de la línea 17 para el caso salarial sin ajuste gradual: 92% cuando el ingreso bruto aplicable no excede $100,000; 95% cuando lo excede.
- Aritmética en centavos enteros con BigInt. Redondeo de cómputos parciales a centavo más próximo, mitad hacia arriba, identificado como supuesto de implementación. La presentación oficial en dólares y la ubicación final de todos los campos siguen pendientes de comprobación.

## Alcance inicial

Individuo residente todo el año, 26 a 64 años, solo salarios ordinarios de Puerto Rico, sin dependientes, deducciones adicionales, veterano, ingresos exentos/especiales, negocio, inversión o situaciones especiales; límite inicial de salarios de $500,000. La revisión de comprobantes o adjuntos no es una condición para ejecutar las fórmulas disponibles. Los datos esenciales del caso sí deben introducirse para no inventar residencia, estado personal ni importes.

El crédito por trabajo (Anejo CT), contribución básica alterna (Anejo O), deducciones detalladas y demás anejos se identifican como pendientes o fuera de alcance. No se sustituyen por cero. Por ello, los cómputos implementados son parciales: el reintegro o pago definitivo permanece pendiente de esos componentes.

## PDF

La plantilla pública contiene 57 páginas. El borrador usa sus primeras tres páginas y añade una guía por campo con valores, estado, fórmula, referencias y pendientes. Solo se transcriben a sus espacios los importes salariales confirmados de las líneas 1A y 1B que sean dólares enteros; las demás cantidades y los centavos se conservan en la guía. El mapa completo y el redondeo oficial no se presentan como validados. No se incluyen firmas, números de Seguro Social ni cuentas bancarias.

Cada página se identifica como **Borrador de EduMoney — no radicado**. Los ejemplos de QA llevan además una marca de datos ficticios. El PDF no es una planilla radicada ni una declaración de certificación oficial.
