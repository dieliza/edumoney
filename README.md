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
La preferencia se guarda localmente. En la Etapa 3, Mi dinero permite registrar ingresos, gastos, transferencias, préstamos y pagos, gestionar categorías y presupuestos y corregir/restaurar movimientos en la base cifrada. Las demás pestañas conservan datos ficticios identificados. El archivo separado del logo sigue pendiente de integración.

La vista web es solo una demostración visual, sin acceso a bases financieras. Para revisar localmente:

```sh
npx expo export --platform web --output-dir dist-preview
python scripts/serve-preview.py
# En otra terminal:
npm run test:visual
```

Las capturas y el estado de verificación se documentan en [Etapa 2](docs/stages/02.md).


- [Mi dinero y presupuesto — Etapa 3](docs/stages/03.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Privacidad y seguridad](docs/SECURITY.md)
- [Resultados y validación de Etapa 1](docs/stages/01.md)
- [Registro de cambios](CHANGELOG.md)
