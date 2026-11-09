/** Solo años revisados expresamente; no heredar reglas al año siguiente. */
export const SOURCES={
 form:{url:'https://hacienda.pr.gov/sites/default/files/individuos_2025_rev._20_jun_25_informativo.pdf',year:2025,revision:'20 jun 2025'},
 instructions:{url:'https://hacienda.pr.gov/sites/default/files/inst_individuos_2025_27_feb_262.pdf',year:2025,revision:'27 feb 2026'},
 filing:{url:'https://hacienda.pr.gov/publicaciones/carta-circular-de-rentas-internas-num-26-02-cc-ri-26-02',year:2025,revision:'5 feb 2026'},
 repository:{url:'https://hacienda.pr.gov/node/5770',year:2025,revision:'Consultado 9 nov 2026'},
} as const;
/** Estado informativo de las comprobaciones; no es una condición para ejecutar cálculos. La revisión puede registrarla el usuario. */
export const VALIDATION={catalogVersion:'PR-482-2025-research.1',reviewPolicy:'user-review-accepted',independentCalculations:{status:'pending',evidence:null},officialRounding:{status:'pending',evidence:null},pdfMapping:{status:'pending',evidence:null},autonomousEnabled:true} as const;
export type FieldState='confirmed'|'calculated'|'pending'|'not_applicable'|'not_covered';
export const fieldStateLabels:Record<FieldState,string>={confirmed:'Confirmado',calculated:'Calculado',pending:'Pendiente',not_applicable:'No aplica',not_covered:'Caso no cubierto'};
export const fields=[
 {id:'1A',section:'Encasillado 1',label:'Retención sobre salarios',source:'instructions',reference:'Página impresa 15, línea 1(i), columna A; 499R-2/W-2PR, encasillado 13',formula:'Transcripción confirmada del encasillado 13; nunca inferir de un depósito'},
 {id:'1B',section:'Encasillado 1',label:'Salarios sujetos a retención en Puerto Rico',source:'instructions',reference:'Página impresa 15, línea 1(i), columna B; encasillado 11 del comprobante',formula:'Transcripción del encasillado 11; el bruto genérico del expediente no basta'},
 {id:'5',section:'Encasillado 2',label:'Ingreso bruto ajustado',source:'form',reference:'Encasillado 2, línea 5',formula:'Solo caso salarial sin otros ingresos ni ajustes confirmados: salarios'},
 {id:'7',section:'Encasillado 2',label:'Exención personal individual',source:'instructions',reference:'Página impresa 19, línea 7',formula:'3500 USD, únicamente contribuyente individual expresamente confirmado'},
 {id:'8',section:'Encasillado 2',label:'Exención por dependientes',source:'instructions',reference:'Página impresa 19, línea 8; Anejo A1',formula:'No aplica solo cuando se confirma expresamente que no se reclaman dependientes; otros casos fuera del alcance inicial'},
 {id:'13',section:'Encasillado 2',label:'Ingreso neto sujeto a contribución',source:'form',reference:'Encasillado 2, líneas 10 a 13',formula:'max(0, salarios - exención), solo sin otras deducciones o exenciones'},
 {id:'14',section:'Encasillado 3',label:'Contribución según tabla',source:'instructions',reference:'Página impresa 20, tabla de contribución regular',formula:'0 hasta 9000; 7% exceso 9000; 1120+14% exceso 25000; 3430+25% exceso 41500; 8430+33% exceso 61500'},
 {id:'17',section:'Encasillado 3',label:'Contribución regular antes de créditos',source:'instructions',reference:'Página impresa 21, línea 17, óvalo 1',formula:'0.92 de línea 16 si ingreso bruto aplicable <=100000; 0.95 si mayor; caso salarial sin ajuste gradual'},
 {id:'20',section:'Encasillado 3',label:'Contribución básica alterna',source:'instructions',reference:'Página impresa 21, línea 20; Anejo O',formula:'No cubierta; no se sustituye por cero'},
 {id:'27A',section:'Encasillado 3',label:'Retención sobre salarios',source:'form',reference:'Encasillado 3, línea 27A',formula:'Referencia de retención confirmada; no suma un pago nuevo'},
 {id:'27C',section:'Encasillado 3',label:'Crédito por trabajo',source:'form',reference:'Encasillado 3, línea 27C; Anejo CT',formula:'Pendiente de validación; no se presume cero ni se calcula alivio contributivo'},
 {id:'31',section:'Encasillado 3',label:'Reintegro o contribución no pagada',source:'form',reference:'Encasillado 3, línea 31',formula:'Pendiente hasta validar créditos, pagos, contribución alterna, anejos y redondeo'},
] as const;
export const schedules=[{id:'A',status:'not_covered',reason:'Deducciones detalladas pendientes de validación'},{id:'A1',status:'not_covered',reason:'Dependientes fuera del caso inicial'},{id:'CT',status:'pending',reason:'Crédito por trabajo sin validar'},{id:'O',status:'pending',reason:'Contribución básica alterna sin validar'},{id:'IE',status:'not_covered',reason:'Ingresos exentos no cubiertos'},{id:'CO',status:'not_covered',reason:'Cómputo opcional para casados no cubierto'}] as const;
