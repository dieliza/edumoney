import { MAX_BACKUP_CHARS } from './cryptoCore';
import { UserInputError } from '../../core/errors';
import { download, pickFile } from '../../web/files';
export async function shareBackup(text: string) { download(text, 'EduMoney-respaldo-cifrado.edumoney', 'application/json'); }
export async function pickBackup() { const file = await pickFile('.edumoney,.json,application/json'); if (!file) return null; if (file.size > MAX_BACKUP_CHARS) throw new UserInputError('El respaldo supera el tamaño máximo admitido.'); return file.text(); }
