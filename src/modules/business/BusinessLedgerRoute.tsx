import { ActionButton,Body,Card,Screen } from '../../ui/components';
import { router } from 'expo-router';
export default function BusinessLedgerPreview(){return <Screen title="Movimientos de Negocio" demo={false} subtitle="Ingresos, gastos, recibos y reservas locales."><Card><Body>Registra y consulta estos datos en la aplicación iOS o Android con almacenamiento cifrado. Esta vista del navegador no guarda movimientos.</Body></Card><ActionButton title="Volver a Negocio" onPress={()=>router.dismissTo('/business')}/></Screen>;}
