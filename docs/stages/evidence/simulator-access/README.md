# Acceso único a préstamo, auto y vivienda

Base publicada152. Cambios de producto únicamente en DebtSimulators y las propiedades del selector de DecisionsScreen.

- Se eliminan los accesos independientes Auto, Vivienda y Otras transacciones, y todo el bloque de comparación de dinero adicional hasta el final de esa vista.
- Se conserva Facturas vinculadas con su destino original.
- El acceso Préstamo pasa a medir220px (antes132), con el nombre Préstamo · Auto · Vivienda y su destino original /decisions?kind=loan. No ocupa el ancho de tres botones.
- Dentro del simulador, préstamo, vehículo y vivienda se muestran como tres pestañas visibles de colores, con el título Elige tu simulador. Se conserva íntegro el callback existente de cambio de tipo. Los selectores de ahorro, emergencia y gasto recurrente no cambian.

Cálculos, escenarios guardados, funciones de factura y almacenamiento no se modifican. No se eliminan registros. No hay migraciones. Las1453fábricas publicadas ajenas a estos dos componentes se conservan exactamente.

Validación:3casos existentes de cálculo aprobados;8escenarios del paquete aprobados, incluidos dos accesos, nueve cambios entre tipos y los tres contextos no relacionados. TypeScript, ESLint y build aprobados. Smoke del Worker compilado: HTML y bundle común200, sin acceso a datos de usuarios. No hubo navegador QA disponible; no se afirma inspección visual manual en dispositivos.

Empaquetado: el primer intento excedió tamaño. Se comparte además el sufijo de claves internas de rutas y se transportan prefijos estáticos base64 mediante Z85, con reconstrucción exacta antes de servir. Veinte comprobaciones de longitudes/desplazamientos y la comparación de todas las cargas y URL originales verifican que no cambian los bytes servidos. Se mantiene compatibilidad del lector con los formatos anteriores; no se borra ninguna URL. El Worker final ocupa66894772bytes y se verificó su ejecución real en Node. El SW conserva push y actualización segura. Compilación local en memoria, guardado con empaquetado remoto por espacio insuficiente para exportar el archivo completo.

Contador conservador37/100:3pruebas de cálculo,8escenarios UI,20roundtrips del codec,2paquetes,1build,1smoke Worker,1comprobación estática y1comprobación pública.
