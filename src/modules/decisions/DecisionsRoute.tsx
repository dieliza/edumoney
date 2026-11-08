import { router } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
export default function DecisionsPreview(){return <Screen title="Antes de decidir"><Card><Body>Los simuladores y escenarios guardados requieren la aplicación nativa con almacenamiento cifrado. La web conserva una demostración identificada.</Body><ActionButton title="Volver a Aprende" onPress={()=>router.dismissTo('/learn')}/></Card></Screen>;}
