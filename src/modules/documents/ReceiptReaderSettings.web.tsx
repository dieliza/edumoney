import {useEffect,useState,useSyncExternalStore} from 'react';
import {Linking} from 'react-native';
import {router} from 'expo-router';
import {revokeAnthropicConsent} from '../../web/anthropicConsent';
import {readerSnapshot,subscribeReader} from '../../web/anthropicSession';
import {connectAnthropic,disconnectAnthropic,restoreAnthropicConnection} from '../../web/anthropicConnection';
import {ActionButton,Body,Card} from '../../ui/components';
import {ErrorNotice} from '../money/fields';
import {ApiKeyField} from './ApiKeyField.web';
export function ReceiptReaderStatus(){const mode=useSyncExternalStore(subscribeReader,readerSnapshot,()=> 'local' as const);return <Card><Body>Lector: {mode==='anthropic'?'Claude Haiku 5.5 · conexión configurada':'Local · conecta Anthropic para interpretar fotos'}</Body><ActionButton title="Configurar lector de recibos" secondary onPress={()=>router.push('/receipt-reader')}/></Card>;}
export function ReceiptReaderSettings(){
 const mode=useSyncExternalStore(subscribeReader,readerSnapshot,()=> 'local' as const);const [key,setKey]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[editing,setEditing]=useState(false);
 useEffect(()=>{let live=true;void restoreAnthropicConnection().catch(e=>{if(live)setError(e instanceof Error?e.message:'No se pudo abrir la conexión guardada.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[]);
 async function connect(){if(busy||loading)return;setBusy(true);setError('');setNotice('');try{await connectAnthropic(key);setKey('');setEditing(false);setNotice('Conexión verificada y clave guardada cifrada en este navegador. Ya puedes tomar una foto. El saldo se confirma al procesar la lectura.');}catch(e){setError(e instanceof Error?e.message:'No se pudo activar la conexión.');}finally{setBusy(false);}}
 async function remove(){if(busy||loading)return;setBusy(true);setError('');try{await disconnectAnthropic();revokeAnthropicConsent();setKey('');setEditing(false);setNotice('Conexión retirada y clave borrada de este navegador. Tu contraseña de EduMoney no cambia.');}catch(e){setError(e instanceof Error?e.message:'No se pudo retirar la conexión.');}finally{setBusy(false);}}
 return <Card><Body>Conecta Anthropic para interpretar recibos, cheques y talonarios con Haiku 5.5. Aquí no se cambia la contraseña de EduMoney.</Body><Body>Lector: {mode==='anthropic'?'Conectado · Haiku 5.5':'Sin conexión a Anthropic'}</Body>
 {loading?<Body>Abriendo conexión guardada…</Body>:mode!=='anthropic'||editing?<><ApiKeyField value={key} onChange={value=>{setKey(value);setError('');setNotice('');}}/><Body>La API se factura por uso. Al activar verificaremos el acceso a Haiku sin enviar fotos. La clave se guardará cifrada solo en este navegador y se recuperará al desbloquear EduMoney; no necesitas cambiar ni repetir contraseñas.</Body>{!busy?<ActionButton title="Activar Anthropic" testID="anthropic-activate" onPress={()=>void connect()}/>:null}</>:null}
 {busy?<Body>Comprobando conexión…</Body>:null}<ErrorNotice message={error}/>{notice?<Body>{notice}</Body>:null}
 {mode==='anthropic'&&!busy&&!loading?<><ActionButton title="Tomar o elegir foto" onPress={()=>router.push('/documents')}/><ActionButton title={editing?'Cancelar cambio de clave':'Cambiar clave de API'} secondary onPress={()=>{setKey('');setEditing(!editing);setError('');setNotice('');}}/></>:null}
 {!busy&&!loading?<><ActionButton title="Desconectar y borrar clave guardada" secondary onPress={()=>void remove()}/><ActionButton title="Obtener clave en Anthropic Console" secondary onPress={()=>void Linking.openURL('https://platform.claude.com/settings/keys')}/></>:null}
 <Body muted>La clave no se incluye en respaldos ni sincronización. Se configura una vez por navegador y puede retirarse aquí. Anthropic procesa las fotos según sus condiciones: eliminación dentro de 30 días con excepciones, sin promesa de retención cero. La autorización de fotos se recuerda por separado.</Body></Card>;
}
