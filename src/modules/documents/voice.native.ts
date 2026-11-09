import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule as Speech } from 'expo-speech-recognition';
export interface VoiceSession {stop():void;abort():void}
export async function startDictation(onText:(text:string)=>void,onMessage:(text:string)=>void,onEnd:()=>void,active:()=>boolean=()=>true):Promise<VoiceSession|null>{
 if(Platform.OS==='android'&&Number(Platform.Version)<33){onMessage('El dictado estrictamente local requiere Android 13 o posterior. Puedes escribir los datos.');return null;}
 let listeners:{remove():void}[]=[];let timer:ReturnType<typeof setTimeout>|undefined;let ended=false;
 const clean=()=>{ended=true;listeners.forEach(l=>l.remove());if(timer)clearTimeout(timer);};
 try{
 if(Platform.OS==='android'&&!Speech.supportsOnDeviceRecognition()){onMessage('No hay un reconocedor de voz local disponible. No usaremos uno remoto; puedes escribir.');return null;}
 const supported=await Speech.getSupportedLocales({});
 const locale=supported.installedLocales.map(l=>l.replaceAll('_','-')).find(l=>l.toLowerCase().startsWith('es-'));
 if(!locale){onMessage('No se encontró un modelo español local disponible. Puedes instalarlo desde los ajustes del dispositivo o escribir los datos; EduMoney no lo descarga automáticamente.');return null;}
 if(!active())return null;
 const permission=await Speech.requestMicrophonePermissionsAsync();if(!permission.granted){onMessage('El micrófono no tiene permiso. La entrada manual sigue disponible.');return null;}
 if(!active())return null;
 listeners=[Speech.addListener('result',event=>{const text=event.results[0]?.transcript;if(text&&active()&&!ended)onText(text.slice(0,20000));}),Speech.addListener('error',()=>{clean();try{Speech.abort();}catch{}if(active())onMessage('No se pudo completar el dictado local. No cambiaremos a un servicio remoto; revisa el texto o escribe.');onEnd();}),Speech.addListener('end',()=>{clean();onEnd();})];
 Speech.start({lang:locale,requiresOnDeviceRecognition:true,interimResults:false,maxAlternatives:1,continuous:false,recordingOptions:{persist:false}});
 if(!ended)timer=setTimeout(()=>{try{Speech.stop();}catch{clean();onEnd();}},45000);
 return {stop:()=>Speech.stop(),abort:()=>{clean();try{Speech.abort();}finally{onEnd();}}};
 }catch{clean();if(active())onMessage('No está disponible el dictado local en este dispositivo. Puedes escribir sin conexión.');return null;}
}
