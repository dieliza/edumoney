import { router } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
export default function TaxPreview(){return <Screen title="Para mi contable"><Card><Body>El expediente contributivo, la conciliación y las exportaciones requieren la aplicación nativa con almacenamiento local cifrado. Esta web es una demostración; no prepara ni radica planillas.</Body><ActionButton title="Volver a Mi dinero" onPress={()=>router.dismissTo('/money')}/></Card></Screen>;}
