import { useState } from 'react';
import { ActionButton, Body } from '../../ui/components';
import { ErrorNotice } from '../money/fields';
import { AccountPassword } from '../../ui/RequiredAccountGate.web';
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
    <AccountPassword label="Contraseña actual" name="current" value={current} onChange={setCurrent} disabled={busy}/>
    <AccountPassword label="Nueva contraseña" name="password" value={password} onChange={setPassword} disabled={busy} creating/>
    <AccountPassword label="Confirmar contraseña" name="repeat" value={repeat} onChange={setRepeat} disabled={busy} creating/>
    <ErrorNotice message={error}/>{notice?<Body>{notice}</Body>:null}
    {busy?<Body>Guardando contraseña de cuenta…</Body>:<><ActionButton title="Cambiar contraseña y conservar datos" onPress={()=>void change()}/></>}
    <Body muted>«Olvidé mi contraseña» envía un enlace al correo verificado de tu cuenta. Los registros anteriores deben haberse vinculado para poder recuperarlos.</Body>
  </>;
}
