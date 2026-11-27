# Selector Destino de Transferir fondos

Causa: `fromAvailableOnly` restringía también Destino a una sola opción (`id === to`). El selector se abría, pero el usuario no podía elegir otro fondo.

Corrección exclusiva en `src/modules/funds/TransferEditor.tsx`: mantener Origen en Balance disponible cuando se abre desde Presupuesto mensual, y ofrecer todos los destinos disponibles salvo ese mismo origen. Ahorros sigue preseleccionado cuando corresponda. Se mantienen balances visibles, selección de fondos existentes, confirmación, importe, fecha y descripción. El guardado utiliza el destino realmente seleccionado y la misma transferencia atómica existente; no se modifican cálculos, permisos ni esquema SQL.

Dos casos de integración verifican las opciones y el guardado en el fondo elegido. Se ejecutan TypeScript y ESLint. Se comprueban el bundle final, dependencias, módulos ajenos, tamaño del Worker, recursos de precarga, alias del service worker y entrega pública. Sin navegador interactivo ni dispositivos físicos: no se afirma una prueba física en Safari/iPhone.

## Ajuste necesario del empaquetado

El paquete inicial superaba 63.9 MiB y las comprobaciones bloquearon su publicación. Se eliminan únicamente payloads sin ruta ni referencia en el Worker, se recomprimen sin cambiar los bytes descomprimidos y se comparten pares hash/MIME repetidos en la tabla de rutas. El Worker reconstruye antes de atender peticiones el mismo diccionario de rutas. El comprobador compara el diccionario y ejecuta esa reconstrucción en una VM; todas las rutas deben conservar su payload. Se amplía el lector de artefactos existente para reconocer esta codificación. No se eliminan URLs públicas. No se conservó el intento de minificación de formato, que resultó insuficiente; el código de servidor ajeno a la tabla de rutas permanece intacto.
