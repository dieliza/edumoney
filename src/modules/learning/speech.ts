export async function readLesson(text: string, onDone: () => void, onError: () => void) {
  if (!('speechSynthesis' in window)) return 'Este navegador no ofrece lectura en voz alta. Puedes leer la lección en pantalla.';
  const voice = speechSynthesis.getVoices().find(v => v.localService && v.lang.startsWith('es'));
  if (!voice) return 'No se encontró una voz española local. El texto está disponible; no se enviará a un servicio externo.';
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = voice.lang; utterance.onend = onDone; utterance.onerror = onError; speechSynthesis.speak(utterance); return 'Leyendo con una voz local del dispositivo.';
}
export async function stopReading() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
