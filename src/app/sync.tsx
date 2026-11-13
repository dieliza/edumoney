import { router } from 'expo-router';
import { Screen, Card, Body, ActionButton } from '../ui/components';
export default function SyncRoute() { return <Screen title="Sincronización web" demo={false}><Card><Body>El enlace entre Android y Apple está disponible en la web app de EduMoney. Puedes usar respaldos cifrados para pasar registros de esta instalación a la web.</Body><ActionButton title="Abrir respaldo local" onPress={() => router.push('/backup')}/></Card></Screen>; }
