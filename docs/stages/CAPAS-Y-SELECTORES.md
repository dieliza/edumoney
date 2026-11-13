# Pantallas interiores, gráfica y selectores compactos

## Implementación

- Campos de selección compartidos: control cerrado con etiqueta, valor y flecha; opciones al tocar; cierre al elegir o cancelar. Se aplica también a perfiles, movimientos y nómina de Negocio. Listas largas admiten desplazamiento. Se conserva la selección y las validaciones existentes.
- Las pestañas de Mi dinero, facturas, deudas y expediente permanecen visibles; elegir una vista no se confunde con rellenar un campo.
- Facturas y deudas usan tarjetas con iconos, importes destacados y fechas; sus controles conservan formularios y servicios existentes.
- Negocio reutiliza las tarjetas del panel para abrir movimientos/recibos, IVU/contratistas, escenarios y nómina por titular. Las etiquetas accesibles mantienen el nombre del titular.
- Formularios y fichas comparten campos suaves, encabezados y controles del mismo sistema visual.
- Gráfica circular compartida entre app instalada y demostración: sectores calculados desde centavos, seis colores, total central y leyenda. Sin gastos no se inventan sectores. En la app instalada cada categoría abre el historial del mes filtrado; «Sin categoría» usa el filtro correspondiente.

## Diferencias respecto al boceto

Negocio no aparece en el original y se mantiene como quinta pestaña. Se conserva entrada sin cuenta. Los formularios mantienen campos y explicaciones necesarios para revisión, correcciones y datos pendientes. Los simuladores usan datos escritos por el usuario en lugar de deslizadores con cifras prefijadas. La cámara y voz dependen del soporte y permisos del dispositivo. La web es una demostración identificada, sin almacenamiento financiero sin cifrar.

## Verificaciones acotadas

- 3 casos de segmentos aprobados: círculo completo, reparto y ausencia de gastos.
- 3 recorridos de temas/navegación/contraste aprobados.
- Selector: primer recorrido detectó ARIA incorrecto al anidar ventanas; se corrigió usando una lista expandible en el formulario. Repetición aprobada: abre, selecciona Cheque, cierra, conserva valor, vuelve a abrir y cancela; Axe sin infracciones WCAG A/AA.
- Dos diagnósticos de accesibilidad, uno detenido por uso incorrecto del contexto de Playwright y otro que identificó el elemento. Se cuentan conservadoramente: 10 casos/intentos locales, más 3 recorridos Android (incluidas las revisiones del método Cheque). El bloque previo consumió 7 casos locales y 1 recorrido móvil programado. Total combinado reservado: 22, por debajo de 100.
- TypeScript y ESLint requeridos; resultados finales en el registro de entrega.
- Capturas revisadas: `evidence/layers/web/selector-abierto.png`, `selector-cerrado.png` y `grafica-circular.png`.

La apertura de pantallas reales y el selector se comprobaron en el recorrido Android `dashboard-design`, además de las pruebas del navegador. No se repiten motores contributivos ni etapas cerradas. No se modifica main ni se publica.

## APK final y comprobación móvil

[Descargar ZIP de prueba Android arm64](https://github.com/dieliza/edumoney/actions/runs/43333271642/artifacts/13996138692), disponible hasta el 20 de noviembre de 2026. Contiene `EduMoney-android-arm64-prueba.apk`, LEEME y SHA256SUMS.

Código: `1066e6d`. Archivo de 56.468.577 bytes; SHA256 `c425fd8d832de263ced970d8739d292697e99fb1246ab184dccf5dc540148a98`. Verificados JavaScript incluido, ABI arm64-v8a, píxeles del logo original y certificado de prueba coincidente con la APK anterior. No se ha probado en tableta física.

La verificación Android `43333271684` terminó correctamente sin conexión: ingreso y gasto abren, Cheque se selecciona y permanece visible al cerrarse la lista, documentos y deudas abren, temas y las cinco pestañas funcionan. No se guardaron movimientos en este recorrido. Los conteos de acciones y capturas se conservan en `evidence/layers/android/verification.json`.

### Fallo corregido

Los recorridos `43329471836` y `43332519413` se detuvieron buscando Cheque. El primer diagnóstico atribuido solo al desplazamiento era incompleto: Cheque existía en la demostración pero faltaba en el catálogo nativo. Se añadió `check`/Cheque al catálogo real, a sus formularios personales/comerciales y a las validaciones de movimientos, facturas, deudas, metas y Negocio. No se ejecutan ni emiten cheques; se registra una operación externa.

Prueba SQLite adicional aprobada: ingreso y gasto con Cheque persisten al reabrir y producen ingresos 100000, gastos 20000 y disponible 80000 centavos. Solo se ejecutó ese caso; los otros 14 del archivo se omitieron. TypeScript y ESLint aprobaron localmente y en ambos trabajos de compilación.

Consumo combinado de los dos bloques de diseño: 22 casos/intentos conservadores, incluidos diagnósticos, repeticiones y recorridos móviles; por debajo del máximo de 100. Se conserva el historial de los fallos para no presentarlos como casos aprobados.
