import { router } from 'expo-router';
import { Screen,Card,Body,ActionButton } from '../../ui/components';
export default function BackupPreview(){return <Screen title="Respaldo y recuperación" demo={false}><Card><Body>El respaldo cifrado y su recuperación requieren la aplicación nativa. No se exportan datos financieros desde esta demostración web.</Body><ActionButton title="Volver a Mi dinero" onPress={()=>router.dismissTo('/money')}/></Card></Screen>;}
