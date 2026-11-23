/** Ayuda educativa junto al control; no cambia reglas, valores ni estado del registro. */
export const obligationsHelp = {
  overview: 'Aquí organizas el IVU y los pagos a contratistas de tu negocio. Puedes simular y anotar lo que ya hiciste. EduMoney no cobra, deposita ni radica por ti.',
  holder: 'Es la persona o entidad legal responsable de vender o pagar. Un DBA es un nombre comercial: no selecciones otro titular solo porque la factura diga un nombre distinto.',
  ivu: 'IVU significa Impuesto sobre Ventas y Uso. Una oferta describe lo que vendes; un cobro registra cuánto IVU se cobró de verdad. No uses la cifra simulada como comprobante de cobro.',
  ivuSummary: 'Compara lo cobrado por el titular con lo remitido y confirmado. Los cobros de un facilitador se muestran aparte. Esta diferencia no es un balance oficial de Hacienda ni del municipio.',
  contractors: 'Usa este flujo para pagos por servicios, no para la nómina de empleados. Revisa quién recibió el pago y qué documento aplica antes de comparar la retención estimada con la real.',
  contractorDeposit: 'Si el total retenido bajo la regla del 10% es menor de $2,500 en el trimestre, Hacienda permite pagarlo al radicar a tiempo la planilla trimestral. Con $2,500 o más aplica la regla mensual. Confirma el período y no confundas radicar con pagar.',
  contractorSummary: 'La retención estimada sale del escenario y sus supuestos. La real es el importe que anotaste a partir del pago. Un depósito a Hacienda no se asigna automáticamente a un proveedor.',
  contractorForms: 'La 480.6SP informa los pagos a un proveedor. La 480.6SP.2 concilia el año; la 480.6SP-1 informa el trimestre. Registrarlas aquí no las radica ni deposita la retención.',
  remittance: 'La remesa de IVU y el depósito de retenciones registran dinero enviado. La presentación del formulario registra otro trámite. Confirma ambos por separado con sus comprobantes.',
  void: 'Usa esta opción para corregir el historial local. No revierte un cobro, un depósito, un movimiento financiero ni una radicación ya hecha.',
} as const;

export type ObligationHelpFields = Readonly<Record<string, string>>;

const validity = {
  validFrom: 'Primer día en que se aplica lo que estás documentando. Por ejemplo, 2026-07-01.',
  validTo: 'Anota el último día indicado en el documento, si lo hay. Dejarlo en blanco no confirma que siga vigente.',
};
const recordReference = 'Usa el número de confirmación o una referencia que te permita encontrar el comprobante. No anotes contraseñas ni números de Seguro Social.';

export const obligationFieldHelp = {
  offer: {
    name: 'Usa un nombre corto para identificar la oferta en tus registros, por ejemplo Guía digital anual.',
    kind: 'Elige la descripción que mejor corresponda a lo que vendes. El nombre que le pongas no determina si la oferta paga IVU.',
    nature: 'Describe lo que recibe el comprador. Por ejemplo: acceso a una guía digital por un año o una consulta presencial.',
    projectId: 'Agrupa la oferta en un proyecto para encontrarla después. El proyecto no cambia el titular legal ni el tratamiento de IVU.',
    channel: 'Indica dónde se hizo la venta. Una pasarela que procesa el pago no se presume responsable de cobrar o remitir el IVU.',
    customer: 'Identifica si vendes a consumidores, a comerciantes o a ambos. El tipo de cliente no basta para confirmar una exención.',
    destination: 'Indica el destino de la venta que has podido verificar. No uses la dirección de tu propio negocio como sustituto del destino del comprador.',
    municipality: 'Anota el municipio que corresponde a esta venta según las reglas aplicables, no necesariamente donde vives.',
    collectorCertificate: 'Confirma tu Certificado de Registro de Comerciante y quién debe cobrar en este caso. Si aún no lo verificaste, selecciona Pendiente.',
    classificationConfirmed: 'La clasificación depende del producto o servicio, destinatario y documentos aplicables. Marca confirmado solo si tienes esa revisión.',
    classificationReference: 'Anota la fuente, certificado o explicación que respalda la clasificación. Si no lo sabes, no lo marques como verificado.',
    rate: 'Selecciona la tasa que corresponda al escenario documentado. No todas las ventas usan la misma tasa y la simulación no la certifica.',
    marketplaceConfirmed: 'Comprueba que la plataforma actúe como facilitador registrado y que le corresponda cobrar en esa venta. No lo deduzcas solo porque procesó el pago.',
    marketplaceWaiver: 'Si aplica, identifica el relevo o documento y las ventas que cubre. Eso no confirma quién cobra en tu sitio propio o en ventas directas.',
    volumeReference: 'Para ciertos servicios, el volumen de negocios del año anterior, el grupo y el certificado pueden cambiar el tratamiento. Anota la evidencia, no una suposición.',
    ...validity,
  },
  provider: {
    name: 'Usa el nombre de la persona o entidad que prestó el servicio, como aparece en su documentación, aunque se anuncie bajo otro nombre.',
    reference: 'Crea un identificador interno, por ejemplo PROV-01, para reconocer al mismo proveedor sin guardar su Seguro Social.',
    notes: 'Anota qué dato revisaste y cuál falta sin incluir información personal innecesaria.',
    classification: 'Distingue al contratista de un empleado y verifica el tipo de proveedor. Si no sabes cuál corresponde, deja la clasificación pendiente.',
  },
  relief: {
    kind: 'Un relevo puede reducir o eliminar la retención. Una excepción legal puede documentarse con una declaración jurada cuando corresponda. No son el mismo documento.',
    documentId: 'Puedes enlazar un documento que ya guardaste. El enlace no confirma por sí solo que el documento aplique a este pago.',
    reference: recordReference,
    ...validity,
  },
  collection: {
    baseCents: 'Es el importe sobre el cual quieres simular el IVU, antes de sumar el impuesto. Si el precio ya lo incluye, confirma primero la base.',
    collectedCents: 'Anota el IVU que se cobró según el comprobante. No copies aquí la cifra de la simulación si aún no confirmaste el cobro.',
    stateCents: 'Anota solo la parte estatal confirmada. No repitas aquí el total si también incluye una parte municipal.',
    municipalCents: 'Anota solo la parte municipal confirmada, aunque se haya cobrado junto con la estatal.',
    actor: 'Identifica quién cobró de verdad en esa transacción, no quién solamente procesó el pago. Si no puedes confirmarlo, elige Pendiente.',
    entryId: 'Enlaza el ingreso si ya existe en EduMoney. El vínculo es opcional y no crea otro ingreso.',
    reference: recordReference,
  },
  payment: {
    servicesCents: 'Anota el importe pagado por los servicios antes de descontar la retención. Mantén separados el IVU y los reembolsos que correspondan.',
    ivuCents: 'Anota el IVU identificado por separado en la factura, sin sumarlo de nuevo al importe de servicios.',
    reimbursedCents: 'Anota solo los gastos reembolsados que figuran por separado en la factura. No repitas aquí los honorarios.',
    scope: 'Elige qué clase de pago hiciste; una excepción documentada no es lo mismo que un pago fuera de esta retención. No asumas que no aplica por falta de documento.',
    reliefStatus: 'Confirma si existe un documento aplicable y vigente en la fecha del pago. Pendiente no significa sin relevo.',
    reliefId: 'Enlaza el documento correspondiente a este proveedor y a la fecha del pago. La app no emite ni valida el documento ante Hacienda.',
    actualWithheldCents: 'Es lo que descontaste de verdad, no lo que calcula el escenario. Verifícalo contra tu pago o comprobante.',
    actualNetCents: 'Es lo que el proveedor recibió de verdad. No lo saques por diferencia si aún no verificaste el pago.',
    entryId: 'Enlaza el gasto si ya existe en EduMoney. El vínculo es opcional y no crea otro gasto.',
  },
  filing: {
    form: 'Escoge el formulario que presentaste o piensas presentar. Si aún no lo has radicado, no marques el registro como presentado.',
    providerId: 'Usa un proveedor solo cuando el registro sea de su informativa individual 480.6SP, no en un total de varios proveedores.',
  },
  remittance: {
    amountCents: 'Usa el importe realmente pagado según la confirmación. No es el saldo pendiente ni la suma que esperas depositar.',
  },
  record: {
    period: 'Es el mes, trimestre o año al que corresponde el trámite, no la fecha en que hiciste el pago. Por ejemplo: 2026-07, 2026-Q2 o 2026.',
    scope: 'Distingue el concepto estatal del municipal. Si hubo un solo trámite consolidado, no lo cuentes otra vez como una segunda presentación.',
    municipality: 'Identifica el municipio cuando el trámite sea municipal. Que un trámite sea municipal no significa que siempre se presente fuera de SURI.',
    status: 'Usa Confirmado con un comprobante de presentación o pago, según el trámite. Si todavía no ocurrió, déjalo pendiente.',
    date: 'Es la fecha del comprobante de presentación o pago, no la fecha límite.',
    reference: recordReference,
    dueDate: 'Escribe la fecha aplicable que verificaste para el período. Los feriados, prórrogas y avisos pueden cambiar la fecha base.',
    dueSource: 'Anota dónde confirmaste el vencimiento, por ejemplo un aviso de Hacienda o del municipio. No escribas claves de SURI.',
  },
} satisfies Record<string, ObligationHelpFields>;

export const obligationHelpSources = {
  ivu: 'https://hacienda.pr.gov/impuesto-sobre-ventas-y-uso-ivu',
  municipality: 'https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-26-13-cc-ri-26-13',
  marketplace: 'https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-20-40-cc-ri-20-40',
  contractor: 'https://hacienda.pr.gov/sites/default/files/documentos/480.6sp_2026_informativo.pdf',
  exceptions: 'https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-25-05-bi-ri-25-05',
  deposits: 'https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-19-10-cc-ri-19-10',
  informationReturns: 'https://hacienda.pr.gov/publicaciones/boletin-informativo-de-rentas-internas-num-26-06-bi-ri-26-06',
} as const;
