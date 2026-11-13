# Selección del importe de talonarios en el escáner general

2026-11-13. Rama web-edumoney. Versión web 2026.11.13.13.

El usuario confirmó que la imagen se abre pero los números se leen mal. Se preguntó si se trata del talonario aportado y qué número/sección presenta el error. Al preparar esta entrega no se ha recibido esa precisión; no se da por demostrado que este sea el único fallo de su dispositivo.

## Error reproducido

Las pruebas anteriores verificaban campos estructurados de Cheques y talonarios. La sección Escaneo y documentos usa proposeFields, que buscaba TOTAL. Al recibir texto de un talonario con bruto 552.58, neto 497.32 y total de deducciones 55.26, ese parser proponía 55.26 como importe. Una prueba nueva reprodujo ese resultado incorrecto antes de editar la selección.

Además, la marca global de discrepancia OCR hacía que ReviewForm dejara en blanco el importe aunque la discrepancia estuviera en otra fila y el neto/total explícito se hubiera leído claramente.

## Corrección

- El parser compartido detecta conjuntamente rótulos de bruto y neto. Para ese documento, propone solo un neto actual inequívoco; ignora el total de deducciones y los acumulados anuales.
- Admite columnas CURRENT/YTD o YTD/CURRENT. Usa las fechas del encabezado cuando se pueden interpretar sin ambigüedad.
- Si el neto actual falta, tiene marca de conflicto o presenta valores contradictorios, queda vacío. No se calcula por diferencia ni se utiliza el total de retenciones como sustituto.
- El escáner conserva la propuesta de importe explícita si la discrepancia pertenece a otras filas. Una fila TOTAL en conflicto sigue invalidando la propuesta de total, aunque aparezca otra cifra suelta.
- La revisión informa que detectó un talonario y que el importe es el neto actual. El usuario sigue eligiendo el tipo de registro y confirmando el ingreso. Cheques y talonarios sigue siendo la sección para conservar su desglose.
- No se cambiaron botones de cámara, permisos, modelos OCR, registros existentes ni tablas.

## Archivos

- src/modules/income/paystubTable.ts: selección semántica del neto para el escáner general.
- src/modules/documents/domain.ts: propuesta de importe y fecha según el documento.
- src/modules/documents/photo.web.ts: discrepancia aplicada al importe propuesto, no al conjunto indiscriminadamente.
- src/ui/buildVersion.ts: marcador de entrega.
- tests/receipt-paystub-routing.test.ts (nuevo): regresión del fallo, columnas, netos pendientes y recibos ordinarios.
- tests/paystub-photo-provided.test.ts: añade la propuesta del escáner general a la comprobación óptica existente de la foto privada.

Sin migración ni cambios en GitHub main.

## Pruebas

40 ejecuciones consumidas de 100, sin suite completa ni CI:

1. Una prueba falló antes del arreglo: esperaba 497.32 y obtenía 55.26. Confirmó el error de selección.
2. 38 casos de regresión aprobados: selección del neto, conflictos, columnas, recibos comunes, flujo OCR, tabla, guardado y reapertura de talonarios.
3. Una prueba óptica privada con Tesseract real aprobada. Incluye original, texto disperso, contraste, filas ampliadas y cero médico; verifica que proposeFields devuelve 497.32 y que una discrepancia ajena no fuerza un importe vacío. También conserva los importes y fechas del parser salarial.

La imagen privada se suministra por variable de entorno; no se agrega a fixtures públicos ni al despliegue. Pillow sustituye operaciones de Canvas en la comprobación local; no es una prueba de Safari/iPad físico.

TypeScript, ESLint, git diff --check y compilación web correctos. No hay herramienta interactiva de navegador en este entorno; no se afirma haber reproducido la experiencia del usuario en su dispositivo ni haber corregido errores de otra foto todavía no aportada.

## Publicación

Sites confirmó succeeded para la versión alojada 15, el 2026-11-13 a las 21:47 UTC.
URL pública: https://edumoney-web.diegoluissantospabon.chatgpt.site
Despliegue: appgdep_6af785805ab081919036fcf7ea4cabfd.
Fuente alojada: 80756fab17863336c942f6048f9510c261b7c80b.
Versión guardada: appgprj_6af65a2177c48191b95b917e1ca2a2f0~appgver_98afe5c316bc8191881d0715f64ecb34.
Implementación local: 8f6ed6c en web-edumoney. GitHub main permanece sin cambios.
