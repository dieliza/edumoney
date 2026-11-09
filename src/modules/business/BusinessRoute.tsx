import { router } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
export default function BusinessPreview() {
 return <Screen title="Negocio" subtitle="Titulares, nombres comerciales y proyectos." demo={false}>
  <Card><Body>El formulario comercial y sus datos se usan en la aplicación iOS o Android con almacenamiento local cifrado. Esta vista del navegador no guarda información comercial.</Body><Body>Los perfiles empiezan en blanco y admiten varios titulares, DBA y proyectos, con clasificaciones de Puerto Rico y federal separadas.</Body><Body>En la aplicación también puedes registrar ingresos, gastos y recibos, repartir importes por proyecto y preparar la exportación comercial.</Body></Card>
  <ActionButton title="Ver sección de registros comerciales" secondary onPress={()=>router.push('/business-ledger')}/>
 </Screen>;
}
