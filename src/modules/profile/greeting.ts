export function firstNameOnly(value:string){return value.normalize('NFC').trim().split(/\s+/)[0]??'';}
export function greetingAt(now:Date,name=''){
 const hour=now.getHours(),greeting=hour<12?'Buenos días':hour<18?'Buenas tardes':'Buenas noches';
 const first=firstNameOnly(name);return `¡${greeting}${first?', '+first:''}!`;
}
