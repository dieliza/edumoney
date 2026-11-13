/** Full calendar dates only: do not turn searches, percentages or month/year selectors into dates. */
export function isCalendarField(label:string){
 if(/buscar|descripci[oó]n|nota|supuestos/i.test(label))return false;
 if(/AAAA-MM-DD/i.test(label))return true;
 if(/AAAA-MM\b|AAAA\b/i.test(label))return false;
 return /^(fecha\b|desde\b|hasta\b|vencimiento\b|[uú]ltimo vencimiento\b|inicio del per[ií]odo\b|fin del per[ií]odo\b)/i.test(label.trim());
}
