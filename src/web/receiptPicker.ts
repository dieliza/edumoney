/** Se invoca en la pila del toque, antes de cualquier await, temporizador o procesamiento. */
export function openReceiptInput(input:HTMLInputElement|null){if(!input)return;input.value='';input.click();}
/** Cancelar no notifica ni cambia el borrador; limpiar permite elegir otra vez la misma foto. */
export function receiveReceiptFile(input:HTMLInputElement,onPhoto:(file:File)=>void){const file=input.files?.[0];input.value='';if(file)onPhoto(file);}
