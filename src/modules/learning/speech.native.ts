import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
/** Expo no expone isNetworkConnectionRequired de Android: no activar un motor sin comprobarlo. */
export async function readLesson(text:string,onDone:()=>void,onError:()=>void):Promise<string>{
 if(Platform.OS!=='ios')return 'La lectura integrada no está disponible aquí: no podemos verificar que el motor use una voz sin conexión. Puedes leer el texto o usar el lector de pantalla del dispositivo con una voz descargada.';
 const voices=await Speech.getAvailableVoicesAsync();
 const voice=voices.find(v=>v.language.toLowerCase().startsWith('es')&&v.quality===Speech.VoiceQuality.Default);
 if(!voice)return 'No hay una voz española básica disponible en este dispositivo. El texto sigue disponible; puedes instalar una voz local en los ajustes de accesibilidad.';
 await Speech.stop();Speech.speak(text,{voice:voice.identifier,language:voice.language,rate:0.9,onDone,onStopped:onDone,onError});
 return 'Lectura con la voz española disponible del dispositivo. Si no escuchas, revisa volumen y modo silencio. No se envía el texto a un servicio de EduMoney.';
}
export async function stopReading(){if(Platform.OS==='ios')await Speech.stop();}
