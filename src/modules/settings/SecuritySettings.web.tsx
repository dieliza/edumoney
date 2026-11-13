import { useState } from 'react';
import { ActionButton, Body } from '../../ui/components';
import { Field, ErrorNotice } from '../money/fields';
import { changeWebPassword } from '../../web/vault';
export function SecuritySettings() {
  const [current,setCurrent]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function change() {
    if(busy)return;setBusy(true);setError('');setNotice('');
    try {await changeWebPassword(current,password,repeat);setCurrent('');setPassword('');setRepeat('');setNotice('Contraseña cambiada. Tus registros y el enlace de sincronización se conservan. Usa la nueva contraseña en este navegador.');}
    catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar la contraseña.');}finally{setBusy(false);}
  }
  return <><Body>Cambia la contraseña de este navegador conservando tus datos. Usa al menos 12 caracteres; no cambia la contraseña de otros dispositivos ni la del respaldo.</Body>
    <Field label="Contraseña actual" secure required value={current} onChangeText={setCurrent}/>
    <Field label="Nueva contraseña" secure required value={password} onChangeText={setPassword}/>
    <Field label="Corroborar nueva contraseña" secure required value={repeat} onChangeText={setRepeat}/>
    <ErrorNotice message={error}/>{notice?<Body>{notice}</Body>:null}
    {busy?<Body>Cambiando el cifrado local…</Body>:<><ActionButton title="Cambiar contraseña y conservar datos" onPress={()=>void change()}/><ActionButton title="Bloquear EduMoney" secondary onPress={()=>window.location.reload()}/></>}
    <Body muted>Si olvidaste la contraseña, bloquea EduMoney y elige «Olvidé mi contraseña». Ese restablecimiento empieza un espacio vacío; no recupera los registros anteriores con la contraseña nueva.</Body>
  </>;
}
