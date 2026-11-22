# Enfoque del importe al desplazarse en teléfono

El usuario confirmó que el salto sucede al tocar Importe en teléfono, sin el mismo problema en iPad. Se identificó en la versión instalada de react-native-web que ScrollView._handleScroll llama dismissKeyboard() para todo evento scroll cuando keyboardDismissMode es on-drag; no comprueba si hubo un arrastre humano. dismissKeyboard desenfoca document.activeElement. La revelación automática del campo en pantallas pequeñas por tanto podía cerrar el teclado, ampliar otra vez visualViewport y producir el salto.

Cambio único de producto: Sheet usa keyboardDismissMode=none en web. Native mantiene on-drag. Se conserva el botón explícito para ocultar teclado, scroll, diseño compacto, viewport y valor del importe. Sin nuevos cambios de diseño ni cálculos.

Pruebas específicas ejecutan el handler real de la dependencia: reproduce desenfoque con on-drag, mantiene foco con configuración web actual none y verifica configuración nativa. TypeScript y ESLint antes de publicar. Verificador del artefacto confirma literalmente que el único cambio en factory 797 es esa propiedad, otros factories y backend idénticos, actualización canónica y precache válidos. No hay navegador físico iPhone disponible; se informa ese límite sin afirmar prueba en dispositivo.

Resultados: 3 pruebas aprobadas, TypeScript y ESLint aprobados. Verificador: 35 aliases renderizados con keyboardDismissMode=none; igualdad exacta del factory salvo dicha propiedad; factories ajenos/servidor y entrega segura conservados. Presupuesto conservador: 3 + 35 + 1 entrega = 39/100, sin suite completa.
