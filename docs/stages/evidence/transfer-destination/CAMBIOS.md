# Selector Destino de Transferir fondos

Causa: `fromAvailableOnly` restringía también Destino a una sola opción (`id === to`). El selector se abría, pero el usuario no podía elegir otro fondo.

Corrección exclusiva en `src/modules/funds/TransferEditor.tsx`: mantener Origen en Balance disponible cuando se abre desde Presupuesto mensual, y ofrecer todos los destinos disponibles salvo ese mismo origen. Ahorros sigue preseleccionado cuando corresponda. Se mantienen balances visibles, selección de fondos existentes, confirmación, importe, fecha y descripción. El guardado utiliza el destino realmente seleccionado y la misma transferencia atómica existente; no se modifican cálculos, permisos ni esquema SQL.

Dos casos de integración verifican las opciones y el guardado en el fondo elegido. Se ejecutan TypeScript y ESLint. Se comprueban el bundle final, dependencias, módulos ajenos, tamaño del Worker, recursos de precarga, alias del service worker y entrega pública. Sin navegador interactivo ni dispositivos físicos: no se afirma una prueba física en Safari/iPhone.
