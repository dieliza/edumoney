/** On-demand explanations of existing ledger behavior, not tax determinations. */
export const ledgerHelp = {
  holder: {text:'Es la persona o entidad responsable del registro. Elige a quién pertenecen los ingresos y gastos. Un proyecto o un nombre comercial no sustituye al titular.'},
  project: {text:'Sirve para ver una actividad del titular por separado. Si repartiste un gasto de $100 en dos proyectos, cada vista muestra solo su parte; la vista del titular cuenta los $100 una sola vez.'},
  deposits: {text:'Ventas brutas es lo vendido antes de restar comisiones y devoluciones. La comisión es lo que te cobraron por procesar la venta; la devolución es lo que reembolsaste. Ejemplo sin IVU: $100 en ventas menos $5 de comisión y $10 de devolución da $85 de depósito neto.'},
  taxCollected: {text:'Es el Impuesto sobre Ventas y Uso que anotaste como cobrado. Se muestra por separado de la venta bruta. Verlo aquí no significa que la tasa esté verificada ni que hayas enviado ese dinero a Hacienda.'},
  missingBreakdown: {text:'Puedes saber cuánto recibiste sin conocer todavía la venta bruta, la comisión, la devolución o el IVU. EduMoney conserva el depósito que ingresaste y deja el dato desconocido pendiente, en vez de ponerle $0.'},
  expenseShare: {text:'Un gasto mixto es para el negocio y para uso personal. Si una factura de $100 se usa 60% para el negocio, aquí se cuentan $60 como parte comercial. Eso no decide si puedes deducirlos. Si aún no has clasificado el uso, se muestra como pendiente.'},
  reconcile: {text:'Si editaste el movimiento fuera de Negocio, revisa que el importe, su clasificación y el reparto sigan correctos. Mientras esté pendiente de conciliar, no se suma en este resumen.'},
  reserves: {text:'Una reserva es cuánto decides apartar para un pago futuro. Pertenece al titular, aunque estés viendo un solo proyecto. Guardarla en EduMoney no mueve dinero ni registra el pago como gasto.'},
  receiptLink: {text:'El recibo sirve de evidencia del registro que ya existe. Adjuntarlo no agrega otro gasto o ingreso. Si tiene compras personales y comerciales, anota el total completo del recibo y revisa la parte comercial en el registro.'},
  receiptImage: {text:'Si conservas la foto, EduMoney guarda una copia cifrada en este dispositivo. Si eliges guardar solo los datos, se conserva lo que escribiste y no la imagen del recibo.'},
  receiptTotal: {text:'Escribe el total que aparece en el recibo, no el subtotal ni la parte comercial. Puede ser distinto del depósito o del movimiento vinculado. Si no puedes confirmarlo, déjalo vacío.'},
  receiptReview: {text:'La foto puede sugerir una fecha o un total, pero no los comprueba. Compara lo escrito con el recibo y asegúrate de que pertenezca al movimiento correcto antes de confirmarlo.'},
  reserveKind: {text:'Elige para qué estás apartando dinero: contribuciones, IVU (impuesto sobre ventas y uso) o nómina (pagos al personal). Es una anotación, no un pago.'},
  reserveTotal: {text:'Escribe el total que quieres mantener reservado, no solo lo que añadiste. Si antes apartabas $300 y añadiste $50, escribe $350.'},
} as const;
