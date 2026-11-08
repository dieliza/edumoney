import { router } from 'expo-router';
import { ActionButton, Body, Card, Screen } from '../../ui/components';
export default function DebtsRoute(){return <Screen title="Ordenar mis pagos" demo={false}><Card><Body>Las deudas reales y sus cálculos requieren la aplicación nativa de iOS o Android y almacenamiento cifrado. La web conserva la demostración visual.</Body><ActionButton title="Volver a Mi dinero" onPress={()=>router.back()}/></Card></Screen>;}
