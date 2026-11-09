# Cierre contributivo y respaldo

## Cálculo automático

1. En Para mi contable selecciona el año y abre Preparar mi planilla. Se conserva el año elegido.
2. Transcribe salarios sujetos del encasillado 11 y retención del encasillado 13 del 499R-2/W-2PR. No uses un depósito neto como si fuera el salario sujeto.
3. Responde las preguntas que determinan el caso aplicable. Deja como pendiente lo que desconoces. El catálogo inicial corresponde a 2025 y al caso salarial limitado descrito en sus fuentes; no se aplica a 2026.
4. Guarda la entrevista indicando un motivo. Los campos soportados se calculan automáticamente cuando hay datos esenciales suficientes.
5. Introduce los componentes restantes del Encasillado 3 desde los anejos o confirma cero cuando no apliquen. El saldo se calcula cuando todos están presentes; un campo vacío no se convierte en cero.
6. Abre Revisar campos guardados y pendientes. Puedes registrar tu nombre y marcar Revisado por mí; no se exige que seas CPA. No necesitas completar esa revisión ni adjuntar comprobantes para ejecutar las fórmulas disponibles.
7. Si deseas, revisa y comparte el PDF. Lleva la marca Borrador de EduMoney — no radicado y no se envía automáticamente a SURI.

La tabla regular y su factor se calculan con los datos esenciales del caso. Los créditos, contribución alterna, pagos y adición se incorporan como importes declarados para calcular el saldo de la línea 31. La elegibilidad de esos conceptos y el redondeo de presentación oficial no se determinan automáticamente. Si falta un componente, el saldo queda pendiente y se conserva el resto de los cálculos. No se exige aprobación profesional.

## Respaldo cifrado

1. En Mi dinero abre Respaldo y recuperación.
2. Elige una contraseña única de al menos 12 caracteres y repítela. No se conserva ni puede recuperarse.
3. Crea el respaldo y elige dónde guardarlo en el diálogo del dispositivo. El archivo contiene todos los registros y documentos locales, ya cifrados. No incluye la clave de SQLCipher ni se envía automáticamente a un servidor.
4. Para recuperar, escribe la contraseña y selecciona un respaldo compatible. Se descifra en memoria y se muestran fecha y cantidad de registros.
5. Revisa lo que vas a reemplazar. Escribe RESTAURAR y confirma únicamente si deseas sustituir todos los datos locales. Conserva antes un respaldo actual si quieres poder volver a ellos.

La restauración verifica estructura, referencias e integridad y revierte los cambios si falla. Esta versión admite los esquemas 14, 13, 12, 11, 10 y 9. El esquema 14 añade empleados, perfiles patronales, nóminas y depósitos. Restaurar un respaldo anterior reemplaza también esa nómina actual; conserva primero un respaldo nuevo. El esquema 13 añade panel, escenarios y pagos estimados. Un respaldo de esquema 12 no contiene esos datos y restaurarlo también los reemplaza; la pantalla lo advierte. El esquema 12 añade IVU y contratistas. Restaurar un esquema anterior reemplaza también estas obligaciones, que ese respaldo no contiene. El esquema 10 incluye perfiles de Negocio pero no sus nuevos movimientos comerciales ni reservas: al restaurarlo, estos últimos también se reemplazan. Restaurar un respaldo del esquema 9 elimina también los perfiles comerciales actuales, porque ese archivo no los contiene; la pantalla lo advierte antes de confirmar. Guarda un respaldo nuevo primero si quieres conservarlos. El PDF, CSV y JSON para revisión son documentos legibles distintos del respaldo cifrado de recuperación.

[Fuentes y alcance 2025](tax/2025/SOURCES.md) · [Privacidad](PRIVACY.md) · [Pruebas pendientes de publicación](QUALITY_RELEASE.md)
