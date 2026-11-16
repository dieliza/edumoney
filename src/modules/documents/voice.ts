export interface VoiceSession { stop(): void; abort(): void }
interface RecognitionResult {isFinal:boolean;length:number;[index:number]:{transcript:string}}
interface RecognitionEvent {results:{length:number;[index:number]:RecognitionResult}}
interface BrowserRecognition {
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 onresult:((event:RecognitionEvent)=>void)|null;onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;onstart:(()=>void)|null;start():void;stop():void;abort():void;
}
type SpeechWindow=Window & {SpeechRecognition?:new()=>BrowserRecognition;webkitSpeechRecognition?:new()=>BrowserRecognition};
export async function startDictation(onText:(text:string)=>void,onMessage:(text:string)=>void,onEnd:()=>void,active:()=>boolean=()=>true,onStarted:()=>void=()=>{}):Promise<VoiceSession|null>{
 if(typeof window==='undefined'||!active())return null;
 const browser=window as SpeechWindow,Recognition=browser.SpeechRecognition??browser.webkitSpeechRecognition;
 if(!Recognition||window.isSecureContext===false){onMessage('Este navegador no ofrece dictado aquí. Abre EduMoney directamente en Safari o Chrome. También puedes usar el micrófono del teclado al editar el texto.');return null;}
 let recognition:BrowserRecognition|undefined,ended=false,stopping=false,started=false,stopRequested=false,heard=false,timer:ReturnType<typeof setTimeout>|undefined,stopTimer:ReturnType<typeof setTimeout>|undefined;
 const finish=()=>{if(ended)return;ended=true;clearTimeout(timer);clearTimeout(stopTimer);if(recognition){recognition.onresult=null;recognition.onerror=null;recognition.onend=null;recognition.onstart=null;}onEnd();};
 const abort=()=>{if(ended)return;const current=recognition;finish();try{current?.abort();}catch{/* Already ended by the browser. */}};
 const stop=()=>{if(ended||stopping)return;stopRequested=true;if(!started)return;stopping=true;clearTimeout(timer);try{recognition?.stop();if(!ended)stopTimer=setTimeout(()=>{if(active()&&!heard)onMessage('El micrófono se abrió, pero el navegador no entregó texto. Comprueba que el dictado esté habilitado en los ajustes del dispositivo y vuelve a intentarlo en Safari o Chrome.');abort();},15000);}catch{abort();}};
 try{
 recognition=new Recognition();recognition.lang='es-PR';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
 recognition.onstart=()=>{if(ended)return;if(!active()){abort();return;}started=true;onStarted();onMessage('Dictado activo. Habla en español y revisa el texto antes de guardar.');if(stopRequested)stop();};
 recognition.onresult=event=>{if(ended)return;if(!active()){abort();return;}let text='';for(let i=0;i<event.results.length;i++){const part=event.results[i][0]?.transcript??'';text+=`${text?' ':''}${part}`;}if(text.trim()){heard=true;onText(text.trim().slice(0,20000));}};
 recognition.onerror=event=>{if(ended)return;if(active())onMessage(event.error==='not-allowed'||event.error==='service-not-allowed'?'Permite el micrófono y el reconocimiento de voz en los ajustes del navegador. También puedes usar el micrófono del teclado en la entrada manual.':event.error==='no-speech'?'No se detectó voz. Conservamos el texto; puedes volver a dictar.':event.error==='audio-capture'?'No se encontró un micrófono disponible. Comprueba que esté conectado y libre.':event.error==='network'?'El servicio de dictado del navegador no pudo conectarse. Conservamos el texto; vuelve a intentarlo o usa el teclado.':'No se pudo completar el dictado. Conservamos el texto; puedes volver a intentarlo.');abort();};
 recognition.onend=()=>{if(!ended&&active())onMessage(heard?'Dictado terminado. Revisa el texto o vuelve a dictar para añadir más información.':'El micrófono se abrió, pero no recibimos texto del navegador. Comprueba que el dictado esté habilitado en los ajustes del dispositivo y vuelve a intentarlo en Safari o Chrome.');finish();};
 // Start synchronously inside the user's click; no permission preflight or API request.
 recognition.start();if(!ended)timer=setTimeout(stop,45000);
 return {stop,abort};
 }catch{abort();if(active())onMessage('No se pudo iniciar el dictado. Revisa el permiso del micrófono o usa el micrófono del teclado en Escribir o pegar información.');return null;}
}
