import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {ActionButton,Body,Card} from '../../ui/components';
import {Field,ErrorNotice} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
import {onDataCommitted} from '../../storage/changeEvents';
import {userMessage,UserInputError} from '../../core/errors';
import {greetingAt,firstNameOnly} from './greeting';
export async function readFirstName(){return (await getMoneyStore()).read(async db=>(await db.getFirstAsync<{first_name:string}>("SELECT first_name FROM local_profile WHERE id='owner'"))?.first_name??'');}
export async function saveFirstName(input:string){const name=firstNameOnly(input);if(name.length>60||/[\u0000-\u001f\u202a-\u202e\u2066-\u2069]/.test(name))throw new UserInputError('Revisa tu primer nombre (hasta 60 caracteres).');return (await getMoneyStore()).transaction(db=>db.runAsync("INSERT INTO local_profile(id,first_name) VALUES('owner',?) ON CONFLICT(id) DO UPDATE SET first_name=excluded.first_name",name));}
export function useGreeting(){
 const [name,setName]=useState(''),[now,setNow]=useState(()=>new Date());
 useEffect(()=>{let active=true;const read=()=>void readFirstName().then(v=>{if(active){setName(v);setNow(new Date());}}).catch(()=>{if(active)setName('');});read();const stop=onDataCommitted(read),sub=AppState.addEventListener('change',state=>{if(state==='active')read();}),schedule=()=>setTimeout(()=>{if(active){setNow(new Date());timer=schedule();}},60000-Date.now()%60000+5);let timer=schedule();return()=>{active=false;stop();sub.remove();clearTimeout(timer);};},[]);
 return greetingAt(now,name);
}
export function ProfileName(){const [name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');const saving=useRef(false);useEffect(()=>{let live=true;void readFirstName().then(value=>{if(live)setName(value);}).catch(()=>{});return()=>{live=false;};},[]);return <Card><Body style={{fontWeight:'700'}}>Tu perfil</Body><Field required={false} label="Primer nombre" value={name} onChangeText={setName} maxLength={120}/><Body muted>Solo se guarda tu primer nombre en este espacio cifrado.</Body><ErrorNotice message={error}/>{message?<Body>{message}</Body>:null}<ActionButton title={busy?'Guardando…':'Guardar nombre'} onPress={()=>{if(saving.current)return;saving.current=true;setBusy(true);setError('');void saveFirstName(name).then(()=>{setName(firstNameOnly(name));setMessage('Nombre guardado.');}).catch(e=>setError(userMessage(e))).finally(()=>{saving.current=false;setBusy(false);});}}/></Card>;}
