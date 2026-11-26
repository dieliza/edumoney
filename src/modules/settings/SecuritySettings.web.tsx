import { useState } from 'react';
import { ActionButton, Body } from '../../ui/components';
import { Field, ErrorNotice } from '../money/fields';
import { changeAccountPassword } from '../../web/accountService';
export function SecuritySettings() {
  const [current,setCurrent]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function change() {
    if(busy)return;setBusy(true);setError('');setNotice('');
    try {await changeAccountPassword(current,password,repeat);setCurrent('');setPassword('');setRepeat('');setNotice('Contraseña de cuenta actualizada. Tus registros y tu enlace de sincronización se conservan.');}
    catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar la contraseña.');}finally{setBusy(false);}
  }
  return <><Body>Cambia la contraseña de tu cuenta y protege nuevamente los registros de este navegador. Usa al menos 12 caracteres. Los respaldos exportados conservan su contraseña original.</Body>
    <Field label="Contraseña actual" secure required value={current} onChangeText={setCurrent}/>
    <Field label="Nueva contraseña" secure required value={password} onChangeText={setPassword}/>
    <Field label="Corroborar nueva contraseña" secure required value={repeat} onChangeText={setRepeat}/>
    <ErrorNotice message={error}/>{notice?<Body>{notice}</Body>:null}
    {busy?<Body>Guardando contraseña de cuenta…</Body>:<><ActionButton title="Cambiar contraseña y conservar datos" onPress={()=>void change()}/></>}
    <Body muted>«Olvidé mi contraseña» envía un enlace al correo verificado de tu cuenta. Los registros anteriores deben haberse vinculado para poder recuperarlos.</Body>
  </>;
}
