const key='edumoney.idle-lock-minutes.v1';
export function idleLockMinutes(){try{const value=Number(localStorage.getItem(key)??0);return [0,5,15].includes(value)?value:0;}catch{return 0;}}
export function setIdleLockMinutes(value:number){if(![0,5,15].includes(value))throw Error('Tiempo de bloqueo no válido.');localStorage.setItem(key,String(value));}
