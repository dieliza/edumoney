# Mis deudas: Simuladores y Aprende en dos áreas

Base publicada: versión149. Cambios limitados a organización de interfaces, conservando funciones y datos.

- Mis deudas tiene una sola opción Simuladores. Los enlaces antiguos `tab=tools` y `tab=simulator` abren la misma vista.
- Se reutilizan vivienda, auto, préstamo, otras transacciones, facturas vinculadas y el comparador de pagos adicionales. El comparador conserva entradas, supuestos y resultados; solo se quita su tarjeta de definiciones de bola de nieve y avalancha.
- Aprende incorpora un área general y otra Aprende sobre deudas, en dos columnas desde900px y verticales en pantallas estrechas. Cada área reutiliza el contenido, ejercicios, diez consejos por ciclo, progreso e insignias existentes. No se crean catálogos ni progresos nuevos. El contador del ciclo conserva su alcance general existente.
- La ruta antigua de lecciones de deuda sigue funcionando; los enlaces de búsqueda son atendidos únicamente por la columna del tema correspondiente. El contenedor Aprende tiene una sola navegación de pantalla.
- Los módulos publicados de cálculo, almacenamiento, consejos educativos y premios conservan exactamente sus fábricas. La pantalla de lecciones se adapta mediante un parche acotado para conservar las celebraciones y autoevaluación publicadas.

Validación: TypeScript y ESLint aprobados.51 casos relevantes:50 aprobados inicialmente y uno corregido/repetido con éxito porque esperaba «vinculado» y el mensaje actual dice «vinculada». La lógica del producto no cambió por esa corrección. El escenario del paquete prueba accesos antiguos, acciones de herramientas, comparación adicional/cero, cuatro anchos, búsquedas por tema y conservación de premios. Ver runtime.json para el resultado final.

Empaquetado: primer intento superó el límite incluyendo un archivo generado huérfano. El build ahora copia únicamente módulos alcanzables desde worker/index.js por imports locales; conserva el archivo huérfano en el repositorio y no modifica código de autenticación. Se verifican cargas estáticas, rutas, módulos ajenos, precarga, push y activación segura del SW. Un segundo intento detectó una unión de tokens al adaptar un return minificado; se corrigió antes de publicar. Otro intento del simulador SSR distinguió Screen de View después de detectar que ambos usaban el mismo stub.

Migraciones: ninguna. Sin pruebas destructivas con datos de usuarios. Sin navegador QA disponible; no se afirma comprobación visual manual en iPhone/iPad. El Worker se compila localmente en memoria; el guardado usa empaquetado remoto por insuficiente espacio en disco para exportar el archivo completo.
