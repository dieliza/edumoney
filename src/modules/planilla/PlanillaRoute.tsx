import { router } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
export default function PlanillaPreview(){return <Screen title="Preparar mi planilla" demo={false}><Card><Body>El cálculo automático no exige revisión de CPA. Las reglas y los datos pendientes se identifican por separado. La entrevista de cierre requiere la aplicación nativa y almacenamiento cifrado.</Body><ActionButton title="Volver a Para mi contable" onPress={()=>router.dismissTo('/tax')}/></Card></Screen>;}
