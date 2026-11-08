import { router } from 'expo-router';
import { ActionButton, Body, Card, Screen } from '../../ui/components';
export default function BillsRoute(){return <Screen title="Mis facturas" demo={false}><Card><Body>Las facturas reales y sus avisos requieren la aplicación nativa de iOS o Android y su almacenamiento cifrado. La vista web conserva la demostración visual.</Body><ActionButton title="Volver a Mi dinero" onPress={()=>router.back()}/></Card></Screen>;}
