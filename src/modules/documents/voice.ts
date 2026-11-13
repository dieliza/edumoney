export interface VoiceSession { stop(): void; abort(): void }
export async function startDictation(_onText: (text: string) => void, onMessage: (text: string) => void, _onEnd: () => void, _active: () => boolean = () => true): Promise<VoiceSession | null> {
  onMessage('El navegador no garantiza dictado sin servicios externos. Usa Escribir o pegar información; EduMoney no enviará tu audio.'); return null;
}
