export const catalog={version:'PR-NOMINA-2026.1',year:2026,checked:'2026-11-09',ssCap:18450000,ssBps:620,medicareBps:145,additionalBps:90,additionalThreshold:20000000,sinotCap:900000,sutaCap:700000,futaCap:700000,futaBps:600};
export const sources=[
 {name:'Hacienda: tablas vigentes desde 2017, apéndices 1 y 2',url:'https://hacienda.pr.gov/sites/default/files/tablas_retencion_2017_4.pdf'},
 {name:'Hacienda: índice actual de tablas de salarios',url:'https://hacienda.pr.gov/comerciantes/patronos-y-agentes-retenedores/tablas-de-retencion-withholding-tables'},
 {name:'Hacienda: certificado 499 R-4',url:'https://hacienda.pr.gov/comerciantes/patronos-y-agentes-retenedores/certificado-de-exencion-para-la-retencion-withholding-exemption-certificate'},
 {name:'IRS: Publicación 15 de 2026, FICA y FUTA',url:'https://www.irs.gov/publications/p15sp'},
 {name:'IRS: Medicare adicional por patrono',url:'https://www.irs.gov/taxtopics/tc751'},
 {name:'DTRH: bases de desempleo y SINOT',url:'https://www.trabajo.pr.gov/servicio_contributivo.asp'},
 {name:'DTRH: SINOT y cubierta aplicable',url:'https://www.trabajo.pr.gov/sinot.asp'},
 {name:'CFSE: clasificación y prima asignada a cada patrono',url:'https://old.fondopr.com/patronos/polizas-requisitos-formalizarlas/clasificaciones-riesgos/'},
 {name:'Hacienda: publicación 26-01, comprobantes 2026',url:'https://hacienda.pr.gov/sites/default/files/publicaciones/2026/10/publication_26-01.pdf'},
 {name:'DOL: reducción del crédito FUTA por año',url:'https://oui.doleta.gov/unemploy/futa_credit.asp'}
];
// Centavos; se transcriben las filas publicadas, sin anualizar ni interpolar.
export const tables={
 weekly:{exempt:[6700,13500,2900,4800,2400,950],limits:[17310,48080,79810,118270],subtract:[1210,4580,13360,22820]},
 biweekly:{exempt:[13500,27000,5750,9600,4800,1900],limits:[34620,96150,159620,236540],subtract:[2420,9150,26710,45630]},
 semimonthly:{exempt:[14600,29200,6250,10400,5200,2100],limits:[37500,104170,172920,256250],subtract:[2630,9920,28940,49440]},
 monthly:{exempt:[29200,58300,12500,20800,10400,4150],limits:[75000,208330,345830,512500],subtract:[5250,19830,57870,98870]}
};
