# EduMoney — Dinero local y presupuesto

Base móvil local para iOS y Android. React Native 0.88, Expo SDK 58 y TypeScript estricto.
El repositorio remoto inspeccionado estaba vacío: sin ramas, archivos ni funciones previas que preservar.

## Ejecutar

Requisitos: Node 24, npm; para Android, JDK y Android SDK; para iOS, macOS y Xcode.

```sh
npm ci
npm run check
npm run lint
npm run android
# En macOS:
npm run ios
```

`npm run prebuild` genera los proyectos nativos desde app.json y plugins. No editar los directorios generados.
SQLCipher requiere compilación nativa: **Expo Go y la web no son destinos compatibles para datos financieros**.
No se necesita cuenta Expo/EAS para compilar localmente. El modo desarrollo usa Metro; una compilación release no lo necesita.

La Etapa 2 incorpora bienvenida, cuatro pestañas y temas Claro/Oscuro/Automático con ejemplos ficticios.
La preferencia se guarda localmente. En la Etapa 3, Mi dinero permite registrar ingresos, gastos, transferencias, préstamos y pagos, gestionar categorías y presupuestos y corregir/restaurar movimientos en la base cifrada. Las pestañas pendientes conservan datos ficticios identificados. El archivo separado del logo sigue pendiente de integración.

La Etapa 4 añade facturas, pagos parciales, recurrencias y avisos locales, con acceso desde Mi dinero. [Guía de Mis facturas](docs/USAR_MIS_FACTURAS.md).

La Etapa 5 añade deudas, pagos vinculados, calendario, comparación de métodos y plan de 30 días. [Guía de Ordenar mis pagos](docs/USAR_ORDENAR_MIS_PAGOS.md).

La Etapa 6 incorpora metas, aportaciones vinculadas y progreso calculado desde registros locales. [Guía de Mis metas y Mi progreso](docs/USAR_MIS_METAS_Y_PROGRESO.md).

La Etapa 7 añade diez lecciones, ejercicios y seis simuladores con escenarios comparables. [Guía de Aprende y Antes de decidir](docs/USAR_APRENDE_Y_SIMULADORES.md).

La Etapa 8 añade escaneo local, dictado cuando existe modelo local y comprobantes con copia cifrada opcional. [Guía de escaneo y documentos](docs/USAR_ESCANEO_VOZ_Y_DOCUMENTOS.md).

La Etapa 9 añade Para mi contable: expediente por año, informativas, conciliación y exportación explícita para revisión profesional. No calcula ni radica planillas. [Guía del expediente](docs/USAR_PARA_MI_CONTABLE.md).

La Etapa 10 añade entrevista de cierre y cálculos automáticos en los campos soportados del catálogo 2025, sin exigir CPA, además de PDF de borrador y respaldo cifrado con contraseña. El saldo se calcula con los componentes declarados; la elegibilidad y determinación de algunos anejos siguen siendo de revisión manual. [Estado de etapa 10](docs/stages/10.md).

La vista web es solo una demostración visual, sin acceso a bases financieras. Para revisar localmente:

```sh
npx expo export --platform web --output-dir dist-preview
python scripts/serve-preview.py
# En otra terminal:
npm run test:visual
```

Las capturas y el estado de verificación se documentan en [Etapa 2](docs/stages/02.md).


- [Cálculo automático y calidad — Etapa 10](docs/stages/10.md)
- [Para mi contable — Etapa 9](docs/stages/09.md)
- [Escaneo, voz y documentos — Etapa 8](docs/stages/08.md)
- [Aprende y Antes de decidir — Etapa 7](docs/stages/07.md)
- [Mis metas y Mi progreso — Etapa 6](docs/stages/06.md)
- [Deudas y Ordenar mis pagos — Etapa 5](docs/stages/05.md)
- [Facturas y recordatorios — Etapa 4](docs/stages/04.md)
- [Mi dinero y presupuesto — Etapa 3](docs/stages/03.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Privacidad y seguridad](docs/SECURITY.md)
- [Resultados y validación de Etapa 1](docs/stages/01.md)
- [Estado de calidad y pendientes de publicación](docs/QUALITY_RELEASE.md)
- [Registro de cambios](CHANGELOG.md)

## Negocio — primera entrega

[Perfiles comerciales: implementación, pruebas y límites](docs/stages/NEGOCIO-01.md). Titulares, DBA y proyectos locales; clasificación de Puerto Rico y federal separadas. La incidencia [IOS-QA-10](docs/ISSUES.md) quedó resuelta en el recorrido de persistencia del simulador iOS.

## Negocio — movimientos y recibos

[Segunda entrega: funcionamiento, pruebas y límites](docs/stages/NEGOCIO-02.md) · [Ejemplo ficticio para revisión del CPA](docs/stages/evidence/business02/README.md).

Negocio incorpora flujos separados para IVU y contratistas, con simuladores locales y registros de cobros, retenciones, remesas y formularios. [Entrega Negocio 3](docs/stages/NEGOCIO-03.md) · [Fuentes oficiales y alcance 2026](docs/tax/business-2026/SOURCES.md). El esquema 12 incluye estos registros en el respaldo cifrado; se conservan las restauraciones 9–11 con advertencias de reemplazo. La interacción de los nuevos formularios en dispositivos queda pendiente.

[Reparaciones de teclado, entrevista y límites comerciales](docs/stages/REPARACIONES-01.md).

[Negocio 4: panel, estimadas, escenarios y calendario](docs/stages/NEGOCIO-04.md). Separa resultado antes de depreciación, efectivo y reservas, sin una tasa contributiva universal; conserva datos pendientes y proyecciones documentadas del usuario.

[Negocio 5: nómina, retenciones, depósitos y borrador de comprobante](docs/stages/NEGOCIO-05.md). Catálogo 2026 con fuentes oficiales, acumulados de pagos confirmados y exportación por código de empleado; no emite ni radica documentos oficiales.

[Seguimiento móvil de nómina: teclado y persistencia de empleados](docs/stages/NEGOCIO-05-MOVIL.md). Verificado en Android e iOS, con 39 casos ejecutados contando repeticiones y límite de 100 por bloque. El estado de cancelación final de GitHub en iOS y su evidencia se explican en el informe.

Seguimiento de nómina: [pagos, depósitos parciales y persistencia móvil verificados en Android/iOS](docs/stages/NEGOCIO-05-PAGOS-MOVIL.md).

Seguimiento de nómina: [tasas persistentes y exportaciones CSV/PDF verificadas en Android/iOS](docs/stages/NEGOCIO-05-TASAS-EXPORTACION-MOVIL.md).

Cierre de calidad: [recuperación integrada de respaldo con Negocio, imagen y nómina](docs/stages/CIERRE-RESPALDO-NEGOCIO.md).

Negocio: [gasto mixto por proyecto y recibo manual verificados en Android/iOS](docs/stages/NEGOCIO-MOVIMIENTOS-MOVIL.md).

Negocio: [estados de recibos en español; Recibido verificado en nuevas compilaciones Android/iOS](docs/stages/UI-NEGOCIO-01-VISUAL.md).

[Ingresos y reservas manuales: verificación móvil](docs/stages/NEGOCIO-INGRESOS-RESERVAS-MOVIL.md).

[Revisión comercial y exportación: evidencia móvil y pendiente de automatización](docs/stages/NEGOCIO-REVISION-EXPORTACION-MOVIL.md).

[IVU y contratistas: validación de reglas, persistencia y navegación móvil](docs/stages/NEGOCIO-OBLIGACIONES-VALIDACION.md).

### Alcance de pagos y cobros

EduMoney registra pagos y cobros realizados fuera de la aplicación. El usuario introduce o confirma fecha, importe y comprobante; los cálculos estimados permanecen separados de los importes realmente pagados, retenidos o depositados. No ejecuta transferencias, cargos, depósitos bancarios ni pagos a empleados, proveedores o Hacienda. No requiere pasarela de pagos ni conectar cuentas bancarias para estos registros.
