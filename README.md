# EduMoney — Etapa 1

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
SQLCipher requiere compilación nativa: **Expo Go y la web no son destinos compatibles**.
No se necesita cuenta Expo/EAS para compilar localmente. El modo desarrollo usa Metro; una compilación release no lo necesita.

La única pantalla es un diagnóstico de apertura del almacenamiento. No hay pantallas financieras, datos ficticios ni funciones de otras etapas.

- [Arquitectura](docs/ARCHITECTURE.md)
- [Privacidad y seguridad](docs/SECURITY.md)
- [Resultados y validación de Etapa 1](docs/stages/01.md)
- [Registro de cambios](CHANGELOG.md)
