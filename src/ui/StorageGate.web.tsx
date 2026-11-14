import {idleLockMinutes} from '../web/securityPreferences';
import {hasBiometric,unlockBiometric,biometricMessage} from '../web/biometrics';
import {recoverySupportLink,recoverySupportEmail} from '../web/recoveryContact';
import {WEB_BUILD} from './buildVersion';
import {useEffect,useRef,useState,type PropsWithChildren,type FormEvent} from 'react';
import {ActivityIndicator,ScrollView,View} from 'react-native';
import {hasWebVault,isWebVaultUnlocked,unlockWebVault} from '../web/vault';
import {useTheme} from '../design/ThemeProvider';
import {Brand} from './Brand';
import {ActionButton,Body,Card} from './components';
import {LoginPasswordField} from './LoginPasswordField.web';
export function StorageGate({children}:PropsWithChildren){
 const {colors}=useTheme();const [exists,setExists]=useState<boolean>();const [password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
 const [bio,setBio]=useState(false),[attempts,setAttempts]=useState(0);
 const [ready,setReady]=useState(isWebVaultUnlocked);const [busy,setBusy]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false);const opening=useRef(false);
 useEffect(()=>{void hasBiometric().then(setBio).catch(()=>undefined);},[]);
 useEffect(()=>{let live=true;if(isWebVaultUnlocked())return;void hasWebVault().then(v=>{if(live)setExists(v);}).catch(()=>{if(live)setError('No se pudo abrir el almacenamiento local. Usa una pestaña normal y permite los datos de este sitio.');});return()=>{live=false;};},[]);
 useEffect(()=>{if(!ready)return;let last=Date.now();const touch=()=>{last=Date.now();};const check=()=>{const minutes=idleLockMinutes();if(minutes&&Date.now()-last>=minutes*60000)window.location.reload();};window.addEventListener('pointerdown',touch);window.addEventListener('keydown',touch);window.addEventListener('scroll',touch,true);document.addEventListener('visibilitychange',check);const timer=setInterval(check,15000);return()=>{clearInterval(timer);window.removeEventListener('pointerdown',touch);window.removeEventListener('keydown',touch);window.removeEventListener('scroll',touch,true);document.removeEventListener('visibilitychange',check);};},[ready]);
 async function open(event:FormEvent<HTMLFormElement>){event.preventDefault();if(opening.current||exists===undefined)return;
 // FormData recoge también el autocompletado de Safari aunque no haya disparado onChange.
 const fields=new FormData(event.currentTarget);const entered=String(fields.get('password')??password),confirmation=String(fields.get('repeat')??repeat);
 setPassword(entered);setRepeat(confirmation);setError('');if(!entered){setError('Escribe tu contraseña para entrar.');return;}if(!exists&&entered!==confirmation){setError('Las contraseñas no coinciden.');return;}
 opening.current=true;setBusy(true);try{if(!isWebVaultUnlocked())await unlockWebVault(entered);setReady(true);setAttempts(0);setPassword('');setRepeat('');}catch(e){const message=e instanceof Error?e.message:'No se pudo abrir tu espacio local.';if(message.startsWith('Contraseña incorrecta')){setAttempts(v=>v+1);setError('Contraseña incorrecta. Revisa lo escrito con el botón del ojo. Si estás seguro de que es correcta, conserva los datos: la copia local también puede necesitar revisión.');}else setError(message);}finally{opening.current=false;setBusy(false);}
 }
 async function openWithBiometric(){if(opening.current)return;opening.current=true;setBusy(true);setError('');try{await unlockBiometric();setReady(true);setPassword('');setRepeat('');setAttempts(0);}catch(e){setError(biometricMessage(e));}finally{opening.current=false;setBusy(false);}}
 if(ready)return <View style={{flex:1}}>{children}</View>;
 return <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:24}}><View style={{width:'100%',maxWidth:520,alignSelf:'center',gap:18}}><View style={{alignItems:'center'}}><Brand large/></View><Card>
 <Body style={{fontSize:24,fontWeight:'800'}}>{exists?'Entrar a EduMoney':'Tu espacio privado'}</Body><Body>Tus datos permanecen cifrados en este navegador. La contraseña de EduMoney es distinta de la clave de API del lector de fotos.</Body>
 {bio&&!busy?<ActionButton title="Entrar con Face ID o huella" icon="finger-print-outline" onPress={()=>void openWithBiometric()}/>:null}
 {attempts>=3?<div role="status"><Body>Tres intentos no lograron abrir el espacio. Puedes verificar el teclado y usar el ojo, el acceso del dispositivo si lo activaste o solicitar ayuda. No se bloqueó ni se borró tu información.</Body></div>:null}
 {exists===undefined?<>{error?<div role="alert"><Body>{error}</Body><ActionButton title="Reintentar apertura" onPress={()=>window.location.reload()}/></div>:<ActivityIndicator accessibilityLabel="Preparando acceso"/>}</>:<form onSubmit={e=>void open(e)} style={{display:'grid',gap:16,margin:0}}>
 <LoginPasswordField name="password" label={exists?'Contraseña de EduMoney':'Crea una contraseña'} value={password} onChange={v=>{setPassword(v);setError('');}} newPassword={!exists} disabled={busy}/>
 {!exists?<><Body muted>Usa al menos 12 caracteres y conserva tu contraseña.</Body><LoginPasswordField name="repeat" label="Confirmar contraseña inicial" value={repeat} onChange={setRepeat} newPassword disabled={busy}/></>:null}
 {error?<div role="alert"><Body>{error}</Body></div>:null}
 <button type="submit" data-testid="web-unlock" disabled={busy} style={{minHeight:56,border:0,borderRadius:18,padding:16,fontSize:18,fontWeight:700,color:'#fff',background:colors.primary,cursor:busy?'wait':'pointer'}}>{busy?'Abriendo EduMoney…':exists?'Entrar':'Crear espacio local'}</button>
 {exists&&!busy?<button type="button" onClick={()=>setHelp(!help)} style={{minHeight:48,border:0,color:colors.primary,background:'transparent',fontSize:16,cursor:'pointer'}}>Olvidé mi contraseña</button>:null}
 </form>}
 {help?<Card><Body style={{fontWeight:'700'}}>Recuperar acceso</Body><Body>Puedes abrir tu correo y solicitar ayuda. La solicitud no cambia tu contraseña ni descifra tus datos. No se ha enviado ningún mensaje automáticamente.</Body><a href={recoverySupportLink} style={{color:colors.primary,fontWeight:700,padding:12}}>Solicitar ayuda por correo</a><Body>Correo de ayuda: {recoverySupportEmail}</Body><Body muted>El envío se confirma en tu aplicación de correo. Falta comprobar la recepción del buzón; esto no es un restablecimiento automático.</Body><Body>Si conservas acceso en otro dispositivo, mantén esa sesión y guarda un respaldo. La recuperación por correo requiere verificar el buzón y un mecanismo que permita recuperar también los datos cifrados. No se puede sustituir la contraseña y conservarlos sin ese mecanismo.</Body><ActionButton title="Volver a entrar" secondary onPress={()=>setHelp(false)}/></Card>:null}
 <Body muted>Escribe tu contraseña una sola vez para entrar. Al bloquear o recargar se vuelve a proteger el espacio. Versión {WEB_BUILD}</Body>
 </Card></View></ScrollView>;
}
