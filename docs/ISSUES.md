# Incidencias pendientes

## IOS-QA-10 — Automatización de entrevista contributiva

Estado: diferida por instrucción expresa del usuario, 9 de noviembre de 2026. No bloquea la continuación de Negocio ni exige revisión de un CPA.

En el simulador iPhone 17 Pro / iOS 26.4, Maestro puede pasar por alto campos al desplazar el formulario largo y escribir antes de que el foco se estabilice. Se verificaron respaldo/recuperación, PDF y temas; la última captura de reapertura muestra `Cierre ficticio de pruebaT` conservado. La aserción exacta esperaba el texto sin la T adicional de la entrada automatizada. No se ha demostrado una pérdida de datos del almacenamiento.

Evidencias: ejecuciones 42612854920 y 42624113429. Última repetición iniciada: 42626974236; su resultado no se considera aprobado hasta revisarlo. Android aprobó el recorrido completo en 42608879499. Las 195 pruebas de lógica/SQLite y las comprobaciones de TypeScript y lint aprobaron.

Próximo trabajo: estabilizar enfoque y desplazamiento, comparar el texto realmente introducido con el recuperado, y completar el recorrido iOS y controles nativos de cifrado. Mantener las pruebas físicas y de distribución pendientes según QUALITY_RELEASE.md. No publicar ni fusionar main.
