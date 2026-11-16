# Orientación de gastos, respaldo selectivo y guardado ágil — 2026.11.16.2

## Autorización y alcance
El propietario autorizó ampliar los puntos propuestos: perfil, orientación de gastos con fuentes de Hacienda, conservación de imágenes de negocio/posibles deducciones/pendientes, expediente CPA y captura ágil. Esta orden sustituye la regla anterior de datos únicamente para capturas nuevas. No se borran imágenes históricas ni originales de la fototeca.

## Implementación
- Catálogo local tipado y versionado, con organismo/título/URL/año/fecha de verificación. Fuente oficial descargada y leída; evidencia y SHA-256 en evidence/hacienda-expense-guide/sources.json. Cubre orientación inicial médica, hipoteca, interés estudiantil, donativos, IRA y negocio. No es un catálogo exhaustivo de todas las deducciones.
- Motor determinista local: pregunta por hechos, no exige saber si un gasto es deducible. Estados pendiente, posible deducción, negocio para revisión y personal aclarado. Nunca calcula importes a reclamar. Comercio/palabras son indicios; no prueban elegibilidad. Reembolso, recibos mixtos, falta de evidencia o año no verificado mantienen revisión y respaldo.
- Perfil opcional por año: hogar/hijos/grupo de edad/actividad y conceptos a revisar. Reutiliza residencia, estado personal y fuentes de ingreso existentes; añade preguntas contextuales. No solicita SSN, cuentas ni nombres de menores. No se envía a Anthropic.
- TaxStore reutiliza tax_events con acciones versionadas expense_guidance_v1 y guide_profile_v1 (eventos aditivos cifrados, sin migración). Versiones de movimientos verificadas; propuestas históricas no sobrescriben cálculos. Lectura recalcula propuestas pendientes de originales cambiados. No duplica tax_records ni crea nuevos vínculos bloqueantes.
- Capturas: DocumentStore aplica conservación cifrada centralmente. Solo omite una imagen nueva si se confirma compra exclusivamente personal cotidiana sin conceptos potencialmente deducibles y su año tiene catálogo verificado. Las demás conservan document_contents y su vínculo. La operación de foto, movimiento y orientación es atómica e idempotente. Sin foto, conserva datos.
- Respaldo/restauración existentes incluyen los eventos y las imágenes cifradas. No se crean buckets, cuentas, servicios, cuotas ni planes de recarga. No se introducen nuevas dependencias.
- Guardar fijo en la parte superior de revisión, transacciones y recibos comerciales; guardar en el inicio de cheques/talonarios. Errores arriba, doble pulsación protegida y confirmación tras persistencia.
- Métodos explícitos: ATH/ATH Móvil/débito, cash/efectivo, cheque, crédito, transferencia/depósito. Resumen sin selector si reconocido; selector cuando falta o es ambiguo. Prompt existente de Anthropic ampliado para distinguir método pagado de marcas, anuncios y cambio. Sin cambiar modelo/API/clave/cuotas ni consumir llamadas reales en pruebas.
- Nueva pestaña del expediente ¿Qué puedo deducir? con preguntas y perfil; puede guardarse la captura antes de completarlas. Propuestas y fuentes al JSON/CSV del CPA. Perfil familiar solo se comparte por inclusión expresa. Copias solo por selección existente del usuario.

## Límites y pendientes reales
- Solo 2025 tiene fuentes anuales verificadas. Para 2026 se conservan comprobantes pendientes sin trasladar reglas del año anterior.
- No sustituye una entrevista completa de Formulario 482 ni clasifica definitivamente todos los gastos. No se amplió el motor de cálculo de planilla existente.
- Respaldo cifrado existente: límite técnico de 20 MB de contenido antes de cifrar (cryptoCore.ts). Las imágenes hacen crecer el respaldo; hace falta una etapa específica de almacenamiento/respaldos escalables para grandes volúmenes. No se cambió ese límite ni se oculta un fallo de respaldo.
- No se elimina una imagen ya preservada al completar posteriormente una clasificación personal. La eliminación explícita existente sigue disponible; evita pérdidas por una clasificación equivocada.
- No se puede reconstruir una foto que se descartó bajo la regla anterior; el usuario puede adjuntar el original si lo conserva.
- Safari/iPhone/iPad, Chrome Android y PWA físicos pendientes. No hay navegador/dispositivo de QA disponible en este entorno; no se instalaron alternativas no admitidas.

## Pruebas: 98 ejecuciones, todas correctas
1. expense-guide (10), expense-guide-storage (4), entry-direction-ui (5), data-only-capture adaptado (2): 21.
2. documents (25), home-voice-entry (24), anthropic-details (12): 61; acumulado 82.
3. expense-guide-storage ampliado (5), entry-direction-ui (5): 10; acumulado 92.
4. Dos casos seleccionados de expense-guide (métodos y validación): 2; acumulado 94.
5. Dos regresiones de tax (exportación privada y gasto mixto): 2; acumulado 96.
6. Dos casos de métodos explícitos/documentos y protección de partidas médicas frente a descarte personal: 2; acumulado 98.

Incluye SQLite real, rollback, reintentos, respaldo/restauración, separación de bases/años, perfil excluido por defecto, conservación selectiva, versiones, origen/categoría, importes exactos y ausencia de duplicados. No se ejecutó la suite completa ni pruebas externas facturadas. TypeScript, ESLint y compilación web se registran en el cierre de publicación.

## Cierre de publicación
- TypeScript, ESLint sin avisos, diff --check, compilación web y comprobación de sintaxis del Worker: correctos.
- Implementación 298f7dc, rama web-edumoney. No se modificó GitHub main.
- Hosting fuente 7be3d52f0b1f477f85a742e3cbfd68adcbe12d2a, Sites versión 58.
- Versión guardada appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_0cd12babd3ec819199c369312e051055.
- Despliegue appgdep_6afa6d22917c8191bb437ad2fbb6fd22, succeeded, 2026-11-16. Configuración existente conservada, env_set_revision=1.
- Producción: https://edumoney-web.diegoluissantospabon.chatgpt.site
- Versión visible 2026.11.16.2. Pruebas físicas de cámaras/navegadores y almacenamiento a gran escala pendientes según límites anteriores.
