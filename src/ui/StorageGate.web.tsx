import {WEB_BUILD} from './buildVersion';
import {useEffect,useRef,useState,type PropsWithChildren,type FormEvent} from 'react';
import {ActivityIndicator,ScrollView,View} from 'react-native';
import {hasWebVault,isWebVaultUnlocked,unlockWebVault} from '../web/vault';
import {useTheme} from '../design/ThemeProvider';
import {router} from 'expo-router';
import {Brand} from './Brand';
import {ActionButton,Body,Card} from './components';
import {LoginPasswordField} from './LoginPasswordField.web';
export function StorageGate({children}:PropsWithChildren){
 const {colors}=useTheme();const [exists,setExists]=useState<boolean>();const [password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
 const [ready,setReady]=useState(isWebVaultUnlocked);const [busy,setBusy]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false);const opening=useRef(false);
 useEffect(()=>{let live=true;if(isWebVaultUnlocked())return;void hasWebVault().then(v=>{if(live)setExists(v);}).catch(()=>{if(live)setError('No se pudo abrir el almacenamiento local. Usa una pestaña normal y permite los datos de este sitio.');});return()=>{live=false;};},[]);
 async function open(event:FormEvent<HTMLFormElement>){event.preventDefault();if(opening.current||exists===undefined)return;
 // FormData recoge también el autocompletado de Safari aunque no haya disparado onChange.
 const fields=new FormData(event.currentTarget);const entered=String(fields.get('password')??password),confirmation=String(fields.get('repeat')??repeat);
 setPassword(entered);setRepeat(confirmation);setError('');if(!entered){setError('Escribe tu contraseña para entrar.');return;}if(!exists&&entered!==confirmation){setError('Las contraseñas no coinciden.');return;}
 opening.current=true;setBusy(true);try{if(!isWebVaultUnlocked())await unlockWebVault(entered);setReady(true);setPassword('');setRepeat('');}catch(e){setError(e instanceof Error?e.message:'No se pudo abrir tu espacio local.');}finally{opening.current=false;setBusy(false);}
 }
 if(ready)return <View style={{flex:1}}><View style={{backgroundColor:colors.surface,paddingHorizontal:12,paddingVertical:4,flexDirection:'row',gap:8}}><View style={{flex:1}}><ActionButton title="Sincronizar" secondary onPress={()=>router.push('/sync')}/></View><View style={{flex:1}}><ActionButton title="Bloquear EduMoney" secondary onPress={()=>window.location.reload()}/></View></View>{children}</View>;
 return <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:24}}><View style={{width:'100%',maxWidth:520,alignSelf:'center',gap:18}}><View style={{alignItems:'center'}}><Brand large/></View><Card>
 <Body style={{fontSize:24,fontWeight:'800'}}>{exists?'Entrar a EduMoney':'Tu espacio privado'}</Body><Body>Tus datos permanecen cifrados en este navegador. La contraseña de EduMoney es distinta de la clave de API del lector de fotos.</Body>
 {exists===undefined?<>{error?<div role="alert"><Body>{error}</Body><ActionButton title="Reintentar apertura" onPress={()=>window.location.reload()}/></div>:<ActivityIndicator accessibilityLabel="Preparando acceso"/>}</>:<form onSubmit={e=>void open(e)} style={{display:'grid',gap:16,margin:0}}>
 <LoginPasswordField name="password" label={exists?'Contraseña de EduMoney':'Crea una contraseña'} value={password} onChange={v=>{setPassword(v);setError('');}} newPassword={!exists} disabled={busy}/>
 {!exists?<><Body muted>Usa al menos 12 caracteres y conserva tu contraseña.</Body><LoginPasswordField name="repeat" label="Confirmar contraseña inicial" value={repeat} onChange={setRepeat} newPassword disabled={busy}/></>:null}
 {error?<div role="alert"><Body>{error}</Body></div>:null}
 <button type="submit" data-testid="web-unlock" disabled={busy} style={{minHeight:56,border:0,borderRadius:18,padding:16,fontSize:18,fontWeight:700,color:'#fff',background:colors.primary,cursor:busy?'wait':'pointer'}}>{busy?'Abriendo EduMoney…':exists?'Entrar':'Crear espacio local'}</button>
 {exists&&!busy?<button type="button" onClick={()=>setHelp(!help)} style={{minHeight:48,border:0,color:colors.primary,background:'transparent',fontSize:16,cursor:'pointer'}}>Olvidé mi contraseña</button>:null}
 </form>}
 {help?<Card><Body style={{fontWeight:'700'}}>Recuperar acceso</Body><Body>La recuperación por correo todavía no está conectada. No se ha enviado ningún email. La contraseña actual protege los datos locales; cambiarla sin abrirlos no permite recuperarlos.</Body><Body>Si conservas acceso en otro dispositivo, mantén esa sesión y guarda un respaldo. Conectar el dominio y el servicio de cuentas permitirá añadir recuperación por correo con un mecanismo para recuperar también los datos cifrados.</Body><ActionButton title="Volver a entrar" secondary onPress={()=>setHelp(false)}/></Card>:null}
 <Body muted>Escribe tu contraseña una sola vez para entrar. Al bloquear o recargar se vuelve a proteger el espacio. Versión {WEB_BUILD}</Body>
 </Card></View></ScrollView>;
}
