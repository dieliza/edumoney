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
- Dos diagnósticos de accesibilidad, uno detenido por uso incorrecto del contexto de Playwright y otro que identificó el elemento. Se cuentan conservadoramente: 10 casos/intentos locales, más 1 recorrido Android programado. El bloque previo consumió 7 casos locales y 1 recorrido móvil programado. Total combinado reservado: 19, por debajo de 100.
- TypeScript y ESLint requeridos; resultados finales en el registro de entrega.
- Capturas revisadas: `evidence/layers/web/selector-abierto.png`, `selector-cerrado.png` y `grafica-circular.png`.

La apertura de pantallas reales y el selector de la aplicación instalada se verifican en el recorrido Android `dashboard-design`; no se declaran aprobados con solo las pruebas del navegador. No se repiten motores contributivos ni etapas cerradas. No se modifica main ni se publica.
