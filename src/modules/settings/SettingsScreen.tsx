import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../design/ThemeProvider';
import { ActionButton, Body, Card, Screen, SectionHeading } from '../../ui/components';
import { Choices } from '../money/fields';
import { SecuritySettings } from './SecuritySettings';
export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const web = Platform.OS === 'web';
  return <Screen title="Configuración" demo={false} subtitle="Tu apariencia, seguridad y datos, bajo tu control.">
    <ActionButton title="Volver a Mi dinero" icon="arrow-back-outline" secondary onPress={()=>router.dismissTo('/money')}/>
    <SectionHeading title="Apariencia y accesibilidad"/>
    <Card><Choices label="Tema" value={preference} onChange={setPreference} options={[[ 'light','Claro'],['dark','Oscuro'],['automatic','Automático']]}/><Body>La preferencia se guarda en este dispositivo. Automático sigue el tema del sistema.</Body><Body muted>La letra respeta el tamaño del dispositivo o el zoom del navegador. Puedes usar VoiceOver o TalkBack con los controles etiquetados.</Body></Card>
    <SectionHeading title="Seguridad y contraseña"/><Card><SecuritySettings/></Card>
    <SectionHeading title="Respaldo y sincronización"/><Card>
      <Body>Guarda una copia cifrada antes de cambiar de dispositivo, reinstalar o borrar datos del navegador. La contraseña de cada respaldo es independiente.</Body>
      <ActionButton title="Crear o restaurar respaldo cifrado" icon="save-outline" onPress={()=>router.push('/backup')}/>
      <Body>{web?'La sincronización entre Apple y Android es opcional. Solo se envía una copia cifrada cuando la activas y sincronizas; conserva el código de enlace en privado.':'Esta instalación nativa permite transferir datos mediante respaldos. El enlace cifrado entre dispositivos está disponible en la web app.'}</Body>
      <ActionButton title={web?'Gestionar sincronización cifrada':'Opciones para pasar datos a la web'} icon="sync-outline" secondary onPress={()=>router.push('/sync')}/>
    </Card>
    <SectionHeading title="Recordatorios y calendario"/><Card><Body>{web?'La web muestra próximas facturas y permite descargar fechas para tu calendario. No envía avisos con la app cerrada.':'Los recordatorios son locales. Configura los días de anticipación por factura; su entrega depende de los permisos del dispositivo.'}</Body><Body>No se utilizan notificaciones push.</Body><ActionButton title="Gestionar facturas y recordatorios" icon="calendar-outline" secondary onPress={()=>router.push('/bills')}/></Card>
    <SectionHeading title="Fotos, voz y privacidad"/><Card><Body>La lectura de recibos se procesa localmente. Revisa comercio, fecha e importe antes de guardar. Decide en cada recibo si conservar una copia cifrada de la imagen.</Body><Body>La cámara y la voz requieren permisos. Puedes cambiarlos en los ajustes del dispositivo o del navegador; la entrada manual siempre está disponible. Las capacidades locales varían según el equipo.</Body><ActionButton title="Abrir recibos y documentos" icon="document-text-outline" secondary onPress={()=>router.push('/documents')}/><Body muted>No se utilizan servicios externos de IA. Las exportaciones se comparten solo cuando eliges su destino. EduMoney registra pagos realizados; no cobra ni ejecuta transferencias.</Body></Card>
    <SectionHeading title="Ayuda y acerca de EduMoney"/><Card><Body>EduMoney · versión 1.0 · {web?'Web app':'Instalación móvil'}</Body><Body>Si no puedes entrar, prueba el botón del ojo y confirma que estás en el mismo navegador donde creaste tu espacio. El acceso privado a la web con ChatGPT y la contraseña local de tus datos son distintos.</Body><Body>Usa respaldos o la sincronización para trasladar datos. Una APK no se instala en iPad: allí puedes usar Safari o Chrome. Las mejoras de la web aparecen al recargar después de publicarse.</Body><Body muted>Las estimaciones dependen de los datos introducidos y los supuestos indicados. Revisa fuentes, año aplicable y partidas pendientes en las herramientas contributivas.</Body></Card>
  </Screen>;
}
