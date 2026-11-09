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

La vista web es solo una demostración visual, sin acceso a bases financieras. Para revisar localmente:

```sh
npx expo export --platform web --output-dir dist-preview
python scripts/serve-preview.py
# En otra terminal:
npm run test:visual
```

Las capturas y el estado de verificación se documentan en [Etapa 2](docs/stages/02.md).


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
- [Registro de cambios](CHANGELOG.md)
