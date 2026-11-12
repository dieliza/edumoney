# EduMoney — cierre técnico y preparación de entrega

Los recorridos seleccionados del panel completo y del perfil incompleto aprobaron en Android e iOS. La regresión de exportación Android cerró QA-NEGOCIO-02. Rama `cierre-edumoney`; main intacto, sin publicación ni radicación. El logo original, identidad/contacto de privacidad y firma/pruebas físicas iOS siguen pendientes de información o recursos externos.

## Cambios y funcionamiento

Se corrigieron los textos del panel y calendario que anunciaban nómina como una etapa futura: ahora remiten al módulo existente y sus obligaciones por confirmar. No se cambiaron fórmulas contributivas ni movimientos. Los pagos y cobros continúan siendo registros de operaciones realizadas fuera de EduMoney.

Se prepararon [guía de uso](../GUIA_USO.md), [compilaciones y firma](../COMPILACIONES.md), `eas.json` y [estado de entrega](../ENTREGA.md). La CI ahora admite workflows reutilizables y evidencias por escenario con nombre único. Los casos genéricos también se acotaron para evitar ejecutar toda la suite automáticamente. No se añadió IA en la app, push, cuenta obligatoria ni almacenamiento financiero automático en servidores.

## Resultados seleccionados

40 casos de lógica aprobados: 23 de temas, claves, respaldo portátil nativo, cámara/voz y recuperación comercial/nómina; 5 de calendario/reservas históricas; 12 de facturas, deudas, metas, simuladores y planilla. ESLint y TypeScript aprobaron. No se ejecutó la suite general.

En navegador aprobaron siete recorridos sobre el paquete web de producción: temas claro/oscuro/automático persistentes, navegación, Negocio, panel, nómina, contraste automatizado y anchos 320–1024. Bienvenida había aprobado en desarrollo. Son vistas informativas con datos ficticios; no validan almacenamiento financiero web.

| Recorrido nativo | Ejecución / job | Resultado final |
| --- | --- | --- |
| Android, perfil incompleto | [43150441511](https://github.com/dieliza/edumoney/actions/runs/43150441511) / 130958070716 | Aprobado: 95 comandos completados, 3 omitidos |
| Android, panel completo | [43152429446](https://github.com/dieliza/edumoney/actions/runs/43152429446) / 130964538262 | Aprobado: 252 completados, 7 omitidos |
| Android, revisión/exportación | 43152429446 / 130964538115 | Aprobado: 136 completados, 7 omitidos; retorno final a CSV correcto |
| iOS, panel completo | [43154938658](https://github.com/dieliza/edumoney/actions/runs/43154938658) / 130972568402 | Aprobado: 264 completados, 6 omitidos; un controlador iniciado |
| iOS, perfil incompleto | [43156189480](https://github.com/dieliza/edumoney/actions/runs/43156189480) / 130976562498 | Aprobado: 118 completados, 4 omitidos; un controlador iniciado |

Aplicaciones de simulador/emulador reconstruidas con fuente `7b918b9`; los cambios posteriores de estos recorridos son automatización y documentación. Los comandos individuales no equivalen a casos de prueba.

El panel completo empezó vacío. Con efectivo inicial $1,000, estimada externa $100 y reservas $200/$115/$0, conserva ganancia operativa $0, efectivo $900, disponible $585, proyección anual declarada $800, otros créditos $50, saldo $650 y reserva faltante $450. El escenario de ventas +$500, gastos +$100, cobros +$300, pagos operativos +$100, equipo $500/pagado $200 y contribución supuesta +$80 conserva resultado $400, efectivo $900, saldo supuesto $730, reserva faltante $530 y equipo por atender $300. Todo permanece al reiniciar, sin ejecutar pagos ni alterar las finanzas originales.

El perfil incompleto conserva resultado parcial $100 del escenario y datos de efectivo, reservas y contribuciones pendientes. El calendario solicita confirmar régimen. La exportación comercial verifica gasto $55, parte comercial $27.50, dos repartos y un solo movimiento, mediante receptor local aislado sin red ni archivos guardados.

## Cifrado y evidencia

Los dos recorridos iOS aprobados conservaron base de 569344 bytes, cabecera cifrada, rechazo de SQLite sin clave y huella idéntica al reabrir. `ios-smoke.sh` verificó exclusión del respaldo automático.

| Caso | SHA-256 antes/después |
| --- | --- |
| Panel completo | `4bdc670fd5872ed27c978a7bba3f883e0f7721729ef3c0f90cd2c7de786360f6` |
| Perfil incompleto | `edbbb7e47105d87ad37330eb19510b72eba0b761d0e798b19b548a27169d17f2` |

[Capturas originales, resultados y diagnósticos](evidence/closure/README.md). Se revisaron capturas de simulación y reapertura, totales del panel y recepción de CSV. Cada captura cubre su porción visible; las aserciones verifican también el resto mediante desplazamiento. No se incluyen bases de datos, claves ni documentos reales.

## Fallos encontrados y corregidos

- Chromium no arrancó dentro del aislamiento; después faltó espacio al iniciar trabajadores. Se retiraron copias temporales extraídas de compilaciones históricas, conservando evidencia del repositorio.
- La superposición de errores de Expo en desarrollo produjo fallos de Axe `button-name` y `nested-interactive`; la advertencia provenía de `transform-origin` de react-native-svg. Se verificó el paquete de producción sin esa superposición, sin excluir reglas de Axe.
- Dos capturas iOS mostraron ficha abierta tras guardar, sin mostrar la zona superior de validación. No permitían atribuir la causa al almacenamiento. Centrar y comprobar exactamente nombre/supuestos confirmó después el guardado; revelar los controles de sección por el margen corrigió la navegación al calendario.
- El primer panel completo iOS conservó reservas, pero el toque de regreso no salió de Movimientos de Negocio. Se añadió desplazamiento, espera y comprobación de llegada antes de abrir el panel.
- Se reemplazó expresamente 43152289668 por colisión de nombres de artefactos entre escenarios concurrentes. Ningún éxito se atribuye a ese trabajo cancelado.

Estos fallos y repeticiones permanecen contados. El error 401 del inicio manual de workflows no se declara reparado: la validación continuó mediante workflows disparados al guardar código autorizado en la rama.

## Presupuesto

**95 casos/intentos conservadores de un máximo de 100**, incluidos 40 casos de lógica, 34 casos/intentos/diagnósticos web y 21 casos/intentos/controladores nativos. El conteo reserva ocho intentos aunque el arranque con ENOSPC no inició casos, y seis para la CI reemplazada. No se presenta ese total como 95 éxitos ni se reinician presupuestos históricos. [Detalle](evidence/closure/execution.json).

## APK interno para Android físico

[Descarga de prueba](https://github.com/dieliza/edumoney/actions/runs/43157032505/artifacts/13917325324), ejecución 43157032505, job 130979239645, fuente c92e384: compilación aprobada, sin ejecutar casos adicionales. El ZIP incluye `EduMoney-android-arm64-prueba.apk`, LEEME y suma SHA-256; retención hasta el 19 de noviembre de 2026.

Se comprobó archivo APK de 54652801 bytes, manifest, JavaScript incorporado y bibliotecas únicamente arm64-v8a. La huella coincide con la generada en CI: `0da24083ff919486f08ad03f7ac37f7e064a610f2682617c00a063e2e2a4f6f0`. `EXPO_PUBLIC_PLANILLA_TESTS=0`; los controles sintéticos requieren exactamente 1. No necesita Metro ni cuenta en EduMoney.

Es una compilación interna con firma de prueba del proyecto, no una publicación de Google Play ni una firma oficial de distribución. No se ha ejecutado en un teléfono físico. Probar con datos ficticios; no sustituye la firma/aprovisionamiento para iPhone o iPad. El APK local queda en `dist-preview/device/`, fuera de Git. No se añaden binarios ni claves al repositorio.

## Pendientes externos

El logo original no existe como archivo separado en el repositorio actual, en `edu-money` (solo index.html) ni en las búsquedas específicas de imágenes/carpetas de Google Drive. Se mantiene el nombre en texto y no se recreó la marca.

Faltan identidad/contacto de privacidad, firma/aprovisionamiento físico iOS y pruebas de cámara/modelos de voz, permisos, avisos/calendario, lectores de pantalla, batería y recuperación entre teléfonos. No se confunden con el uso autónomo de cálculos soportados, que no exige CPA. Los años/casos contributivos no soportados y las emisiones oficiales siguen identificados; no hay certificación de Hacienda ni radicación automática.
