This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Límite de pruebas solicitado por el usuario

No ejecutar más de 100 casos de prueba en un bloque de trabajo, contando repeticiones y CI. Seleccionar pruebas relevantes y llevar su cuenta. No lanzar `npm run check` ni `npm test` sin filtros: la suite completa supera ese límite. TypeScript y ESLint siguen siendo verificaciones requeridas. Para nómina, usar `npm test -- tests/business-payroll.test.ts` y reservar presupuesto para los recorridos móviles y correcciones.


### Comprobación visual de etiquetas de recibos

Para el bloque `receipt-labels`, el usuario amplió el máximo a **10 casos en total**, incluidas repeticiones y comprobaciones del controlador. No repetir las tres pruebas de código aprobadas previamente; contarlas una vez en el presupuesto conservador, dejando como máximo siete casos nuevos. Ejecutar solo el escenario `receipt-labels`; no lanzar suites generales. El controlador iOS se limita a `testHttpServer` y una invocación por trabajo. Registrar el consumo antes de repetir cualquier recorrido.

Cierre de `receipt-labels`: **7 de 10 consumidos conservadoramente**, incluidos los tres casos previos y un arranque fallido sin casos iniciados. Objetivo completado en ambos simuladores; no reiniciar el contador ni repetir casos de esta corrección sin una nueva instrucción del usuario. Ver docs/stages/evidence/receipt-status-visual/execution.json.

## Anthropic: decisiones reservadas al propietario

El lector debe funcionar automáticamente para usuarios comunes. No mostrarles controles, pestañas ni rutas de configuración/activación/desconexión de API. La administración requiere autorización del propietario comprobada en el servidor; nunca distribuir la clave.
No añadir ni activar cuotas de uso (diarias, por IP u otras) sin autorización expresa del propietario. El estado predeterminado es sin cuota propia de EduMoney. Los cambios fuera del alcance solicitado o nuevas restricciones deben consultarse antes de implementarse. Ejecutar las correcciones ya ordenadas sin volver a pedir aprobación.

## Capturas: respaldo selectivo autorizado
Guardar cifrados los comprobantes de negocio, posibles deducciones y casos pendientes de aclaración, junto a sus datos. Solo descartar la imagen nueva cuando el usuario haya confirmado una compra exclusivamente personal sin conceptos potencialmente deducibles y exista catálogo verificado para su año. Nunca borrar automáticamente imágenes históricas, mixtas, dudosas ni originales de la fototeca.
No preguntar al usuario si sabe que algo es deducible. Pedir hechos sencillos según las reglas verificadas de Hacienda por año. Propuestas pendientes no son deducciones finales ni modifican cálculos financieros o de planilla. No enviar el perfil familiar/contributivo al lector de IA.
No mostrar selectores de método de pago si está reconocido explícitamente en foto, voz o texto; autocompletar y mostrar resumen. Si falta o es ambiguo, preguntar. No inferir el método de logotipos o anuncios de métodos aceptados. Mantener opción de guardar en la parte superior de formularios de captura, con errores visibles y confirmación tras persistencia.
En la revisión de capturas no volver a preguntar el origen ni mostrar el selector de categorías que el propietario pidió retirar. Usar categorías financieras existentes solo cuando corresponda; nunca convertir Foto o Dictado por voz en categoría financiera.

## Acceso a información para el contable
El único acceso operativo a este expediente debe estar en Configuración, con el texto «Para el contable». Mantener allí perfil, orientación, revisión y exportación existentes. No mostrar botones/preguntas contables en formularios de ingreso, gasto, captura ni menú lateral. Conservar datos, clasificación automática y protecciones existentes.
