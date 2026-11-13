# Campos necesarios, cierres y fotos de recibos

Actualización del 13 de noviembre de 2026, rama `web-edumoney`.

Los campos obligatorios vacíos muestran borde rojo y texto accesible. Los datos necesarios para un cálculo se distinguen de los opcionales para guardar un registro parcial. Un cero escrito cuenta como dato confirmado; los blancos no se convierten en cero. Los simuladores comerciales explican qué falta antes de calcular.

Las fichas y los selectores usan un cierre compacto con X blanca sobre verde, área táctil de 48 puntos y etiqueta para lectores de pantalla.

La web incorpora Tesseract local con modelos español e inglés incluidos en el sitio. La foto se normaliza y puede recibir una segunda lectura con contraste adaptativo. Se agrupan fragmentos por posición para mantener etiquetas e importes juntos. Las correcciones de caracteres ambiguos se limitan a importes y se advierten. Si las lecturas discrepan sobre el total, el importe queda vacío para revisión. No se sube la foto ni se utilizan servicios externos de IA. Siempre se revisa antes de guardar; la lectura no garantiza exactitud.

La captura nativa prepara la imagen antes del OCR existente y el script de preparación mejora la agrupación de líneas de Vision/ML Kit. Estos cambios requieren una nueva compilación nativa; no actualizan el APK anterior.

Validación: 15 casos pasados (10 de captura y procesamiento, 3 del analizador, 1 de OCR local real con foto ficticia y 1 de discrepancia entre lecturas). TypeScript, ESLint y exportación web completados correctamente. No se repitió la batería histórica. Falta comprobación visual y con fotografías físicas en Safari/Android; no había controlador de navegador compartido disponible.

Publicación privada completada en el mismo sitio, sin cambiar audiencia ni GitHub main:

- URL: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Fuente de alojamiento: `98b6027219a4af33836e5d7d7b50f257fae72a9d`.
- Deployment: `appgdep_6af66d7c26348191a5b82949b96d0926`, estado `succeeded`.
- Se conserva la descompresión del lado del servidor para evitar mostrar contenido binario como texto.
