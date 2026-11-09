import { router } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
export default function DocumentsPreview(){return <Screen title="Escaneo y documentos"><Card><Body>La captura, el dictado y los documentos cifrados requieren la aplicación nativa iOS o Android. La web sigue en demostración.</Body><ActionButton title="Volver a Mi dinero" onPress={()=>router.dismissTo('/money')}/></Card></Screen>;}
