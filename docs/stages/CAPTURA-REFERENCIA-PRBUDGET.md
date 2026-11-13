# Captura de recibos: cámara y fotos separadas

Fecha: 2026-11-13. Rama web-edumoney. Marcador web 2026.11.13.12.

## Referencia verificada

Archivo consultado mediante GitHub en el commit exacto solicitado:
https://github.com/avazquez404/pr-fun-explore/blob/3d108af34a6b3b13b7556ab5866a42ed8ff66b7c/src/components/BudgetAddMenu.jsx

Blob devuelto: 0658c6ea004f6711dde817270da28dc45eb5b871.

Se reutiliza su patrón: dos inputs montados y separados, referencias a cada uno y click síncrono dentro del gesto del botón. Se adapta al diseño y al flujo de documentos de EduMoney, sin importar componentes ni servicios del otro proyecto.

## Cambios

- Dos botones visibles: Escanear recibo y Buscar en fotos.
- Cámara: input type=file, accept=image/*, capture=environment.
- Fotos: segundo input type=file, accept=image/*, sin atributo capture.
- Los campos se mantienen montados mientras se elige una foto. El toque ejecuta input.click directamente, sin await, temporizador, OCR ni consulta de permisos previa.
- capture=environment solicita cámara trasera; no obliga al navegador a abrirla. Puede ofrecer cámara o selector según plataforma.
- Cancelar no llama al flujo de procesamiento ni cambia el borrador. No se pone busy al abrir el selector, por lo que no queda bloqueado esperando un evento cancel que algunos navegadores no emiten.
- Se limpia input.value antes de abrir y después de tomar el File para permitir elegir la misma imagen otra vez.
- El File elegido llega a captureImage y al mismo OCR, revisión, detección de duplicados y guardado cifrado existentes. No se abre un segundo selector después de elegir la imagen.
- accept=image/* permite que el navegador ofrezca sus formatos de fotos. Se intenta convertir localmente a la imagen normalizada existente. HEIC/WebP u otros formatos dependen del decodificador del navegador; si no se pueden convertir se informa que puede reintentarse con JPG/PNG. No se promete soporte HEIC universal.
- Se conservan límite de entrada de 32 MB, límite de imagen preparada y validaciones de guardado. No se envían fotos a otro proyecto ni a un servicio nuevo.
- En builds nativos, los dos botones visibles reutilizan los selectores Expo existentes. No se cambian permisos ni APIs nativas y no se genera una APK en esta entrega.

## Archivos

- src/modules/documents/ReceiptPhotoButtons.web.tsx (nuevo): inputs separados, referencias y botones.
- src/modules/documents/ReceiptPhotoButtons.tsx (nuevo): interfaz nativa equivalente sobre captura existente.
- src/web/receiptPicker.ts (nuevo): activación síncrona y entrega de selección sin efecto al cancelar.
- src/modules/documents/DocumentsScreen.tsx: botones y File elegido conectados al flujo actual.
- src/modules/documents/capture.ts: admite un File ya elegido sin abrir otro selector; conversión local de formatos.
- src/ui/buildVersion.ts: marcador de actualización.
- tests/receipt-photo-buttons.test.ts (nuevo): HTML renderizado y lógica de selección.
- tests/receipt-web-capture.test.ts (nuevo): integración de File con OCR, cancelación y validaciones.
- tests/react-dom-server.d.ts (nuevo): declaración mínima de la API de renderizado usada por las pruebas; no añade dependencias.

Sin cambios de esquema, autenticación ni GitHub main.

## Pruebas realizadas

17 casos aprobados, sin lanzar la suite completa ni CI:

1. receipt-web-capture + documents-capture: 11 aprobados. Dos orígenes pasan el File al mismo OCR; no reabren selector. Cancelación alternativa, archivos no imagen, tamaño máximo, error de conversión HEIC y regresión de captura nativa con permisos/cancelación/limpieza.
2. receipt-photo-buttons: 6 aprobados. Dos botones y dos inputs HTML, atributos exactos, click en la misma pila, selección vacía sin callback ni cambio de borrador, reabrir, volver a elegir la misma imagen y referencia desmontada.

Los eventos y campos se comprobaron con renderizado HTML y dobles de prueba; no constituyen una comprobación del selector del sistema operativo. Los modelos OCR de producción no se sustituyen en la app: se simulan únicamente para aislar el envío del File en las pruebas.

TypeScript, ESLint, git diff --check y compilación web: correctos. El primer comando de pruebas no incluía .tsx según la configuración del proyecto; se trasladó la prueba de atributos a .test.ts y sus seis casos se ejecutaron por separado. Una primera comprobación de lint coincidió con ese cambio de nombre; se repitió después con los archivos estables. No hubo repeticiones de los 17 casos.

## Matriz de dispositivos y límites

| Entorno solicitado | Estado real de verificación | Pendiente |
| --- | --- | --- |
| Safari de iPhone | No probado en dispositivo | Abrir cámara/selector desde toque, permisos, cancelar y reabrir, seleccionar foto y volver a EduMoney |
| PWA instalada | No probado en dispositivo | Instalar desde Safari/iPhone y Chrome/Android; repetir ambos botones y retorno desde cámara en modo independiente |
| Chrome de Android | No probado en dispositivo | Cámara trasera o selector según dispositivo, cancelación, reintento y selección de foto existente |
| Computadora | Pruebas de código y HTML aprobadas; sin prueba interactiva del navegador/selector del sistema | Abrir ambos botones en navegador de escritorio, cancelar, reabrir y seleccionar el mismo archivo |

El entorno cloud declara escritorio, pero no expone herramienta de control de navegador/cua_repl.js en esta sesión. Se comprobó la disponibilidad de herramientas y se consultó cloud-desktop. La skill Sites indica omitir QA de navegador cuando cua_repl.js no está disponible y no improvisar otra vía de control. No se afirma haber probado Safari, Chrome real, una PWA instalada ni una cámara física.

## Recorrido manual reproducible en cada dispositivo

1. Abrir EduMoney, pulsar Reiniciar y entrar en Escaneo y documentos.
2. Escribir datos de una revisión cuando corresponda y conservarlos al cancelar; no debe registrarse un recibo por abrir un selector.
3. Pulsar Escanear recibo. Comprobar que el sistema ofrece cámara o selector, cancelar y volver a pulsarlo.
4. Tomar una foto y comprobar que llega a la revisión local. No guardar sin confirmar campos.
5. Pulsar Buscar en fotos y seleccionar una imagen existente. Comprobar que llega al mismo flujo.
6. Cancelar, volver a abrir y elegir la misma foto; no debe quedar bloqueado. La detección existente de duplicados sigue aplicándose al guardar.
7. En PWA instalada repetir en modo independiente y comprobar que el retorno de cámara/fototeca conserva el contexto.

## Publicación

Sites confirmó succeeded en la versión alojada 14, el 2026-11-13 a las 21:25 UTC.
URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
Despliegue: appgdep_6af7804cef44819198a6354f74eb9514.
Fuente alojada: 09bf3a0fa493ce0630e88bc41d75113c9f1701bb.
Versión guardada: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_fc179d5951588191b94f51cfc28dd3f7.
Implementación local: cd5dd96 en web-edumoney. GitHub main permanece sin cambios.
