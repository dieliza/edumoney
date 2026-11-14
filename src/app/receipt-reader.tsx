import {Screen} from '../ui/components';
import {ReceiptReaderSettings} from '../modules/documents/ReceiptReaderSettings';
export default function ReceiptReaderSetup(){return <Screen back title="Conectar lector de fotos" demo={false} subtitle="Una clave de API; tu contraseña de EduMoney no cambia."><ReceiptReaderSettings/></Screen>;}
