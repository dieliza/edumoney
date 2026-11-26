import {useEffect,useRef,useState,type PropsWithChildren,type FormEvent} from 'react';
import {useTheme} from '../design/ThemeProvider';
import {signupAccount,beginAccountLink,finishAccountRecovery,consumeEmailAccountEntry,signinAccount,requestAccountRecovery,biometricAccountAvailable,signinAccountWithBiometric} from '../web/accountService';
export function AccountPassword({label,name,value,onChange,disabled=false,creating=false}:{label:string;name:string;value:string;onChange:(s:string)=>void;disabled?:boolean;creating?:boolean}){
 const {colors}=useTheme();const [visible,setVisible]=useState(false);
 return <label style={{display:'grid',gap:6}}>{label}<span style={{display:'flex',border:`1px solid ${colors.line}`,borderRadius:12,background:colors.surfaceAlt}}><input name={name} type={visible?'text':'password'} autoComplete={creating?'new-password':'current-password'} minLength={creating?12:undefined} maxLength={128} required value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{minWidth:0,width:'100%',minHeight:48,padding:12,boxSizing:'border-box',border:0,borderRadius:12,background:'transparent',color:colors.text,font:'inherit'}}/><button type="button" aria-label={`${visible?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} disabled={disabled} onClick={()=>setVisible(v=>!v)} style={{flexShrink:0,minWidth:48,minHeight:48,border:0,background:'transparent',color:colors.text,cursor:'pointer'}}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible?<path d="m3 3 18 18"/>:null}</svg></button></span></label>;
}
export function RequiredAccountGate({children}:PropsWithChildren){
 const {colors}=useTheme();const [ready,setReady]=useState(false),[recoveryNotice,setRecoveryNotice]=useState(''),[mode,setMode]=useState<'signin'|'signup'|'forgot'|'reset'|'linkError'>('signin');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(true),[bio,setBio]=useState(false);const lock=useRef(true);
 useEffect(()=>{let live=true;
  async function processLink(){try{const link=await beginAccountLink();if(!live)return;if(link){setEmail(link.email);setMode(link.recovery?'reset':'signin');setMessage(link.recovery?'Elige tu nueva contraseña.':'Correo confirmado. Entra para continuar.');setError('');}else if(await consumeEmailAccountEntry()){if(live)setReady(true);}}catch(e){if(live){setMode('linkError');setError(e instanceof Error?e.message:'No pudimos verificar el enlace.');}}finally{if(live){setBusy(false);lock.current=false;}}}
  const changed=()=>{if(!location.hash)return;setReady(false);setBusy(true);lock.current=true;void processLink();};
  void processLink();if(typeof window!=='undefined')window.addEventListener('hashchange',changed);
  void biometricAccountAvailable().then(v=>{if(live)setBio(v);}).catch(()=>{});
  return()=>{live=false;if(typeof window!=='undefined')window.removeEventListener('hashchange',changed);};},[]);
 async function act(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No pudimos completar el acceso. Tus registros se conservan.');}finally{lock.current=false;setBusy(false);}}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=new FormData(event.currentTarget);const entered=String(values.get('password')??password),address=String(values.get('email')??email).trim(),confirmation=String(values.get('repeat')??repeat);setPassword(entered);setEmail(address);
  await act(async()=>{
   if(mode==='forgot'){setMessage(await requestAccountRecovery(address));return;}
   if(mode==='signup'){setMessage(await signupAccount(address,entered,confirmation));setPassword('');setRepeat('');setMode('signin');return;}
   const result=mode==='reset'?await finishAccountRecovery(entered,confirmation):await signinAccount(address,entered);
   if(result.ready){if('previousRecordsPreserved' in result&&result.previousRecordsPreserved)setRecoveryNotice('Acceso confirmado. Tus registros anteriores se conservan cifrados en este dispositivo, separados de este espacio nuevo. No se recuperaron automáticamente.');setReady(true);setPassword('');setRepeat('');return;}


  });
 }
 function switchMode(next:'signin'|'signup'|'forgot'){setMode(next);setPassword('');setRepeat('');setMessage('');setError('');}
 if(ready)return <>{recoveryNotice?<div role="status" style={{padding:14,background:colors.surface,color:colors.text,borderBottom:`1px solid ${colors.line}`,lineHeight:1.5}}>{recoveryNotice}<button type="button" onClick={()=>setRecoveryNotice('')} style={{marginLeft:12,minHeight:44,border:0,background:colors.surfaceAlt,color:colors.primary,font:'inherit',padding:10}}>Entendido</button></div>:null}{children}</>;
 const field={width:'100%',boxSizing:'border-box' as const,minHeight:48,padding:12,border:`1px solid ${colors.line}`,borderRadius:12,background:colors.surfaceAlt,color:colors.text,font:'inherit'};
 const button={minHeight:50,padding:'12px 16px',border:0,borderRadius:12,background:colors.primary,color:'#fff',font:'inherit',fontWeight:700,cursor:'pointer'};
 const secondary={...button,background:'transparent',color:colors.primary,minHeight:44,padding:'8px 12px'};
 return <div style={{height:'100dvh',overflowY:'auto',background:colors.background,color:colors.text,padding:20,boxSizing:'border-box',display:'flex',justifyContent:'center',alignItems:'flex-start'}}><main style={{maxWidth:480,width:'100%',margin:'auto 0',background:colors.surface,borderRadius:20,padding:24,boxSizing:'border-box'}}>
 <h1 style={{fontSize:26,marginTop:0}}>{mode==='linkError'?'Revisar enlace':mode==='reset'?'Nueva contraseña':mode==='forgot'?'Recuperar acceso':mode==='signup'?'Crear cuenta EduMoney':'Entrar a EduMoney'}</h1>
 <p style={{lineHeight:1.5}}>{mode==='signin'?'Entra con tu correo y contraseña.':mode==='forgot'?'Te enviaremos un enlace a tu correo para crear una contraseña nueva.':mode==='signup'?'Usa tu correo y confirma una sola contraseña.':'Tus registros existentes se conservan.'}</p>
 {message?<p role="status" aria-live="polite" style={{lineHeight:1.5}}>{message}</p>:null}
 {error?<p role="alert" style={{lineHeight:1.5,color:'#B22442'}}>{error}</p>:null}
 {mode!=='linkError'?<form onSubmit={event=>void submit(event)} style={{display:'grid',gap:16}}>
 {mode!=='reset'?<label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} style={field}/></label>:null}
 {mode==='reset'||mode==='signup'||mode==='signin'?<AccountPassword label={mode==='reset'?'Nueva contraseña':'Contraseña'} name="password" value={password} onChange={setPassword} disabled={busy} creating={mode!=='signin'}/>:null}
 {mode==='signup'||mode==='reset'?<><AccountPassword label="Confirmar contraseña" name="repeat" value={repeat} onChange={setRepeat} disabled={busy} creating/><p style={{margin:0,color:colors.muted,fontSize:14}}>Usa de 12 a 128 caracteres.</p></>:null}

 <button type="submit" disabled={busy} style={button}>{busy?'Procesando…':mode==='signup'?'Crear cuenta':mode==='forgot'?'Enviar enlace':mode==='reset'?'Guardar contraseña y entrar':'Entrar'}</button>
 </form>:null}

 {mode==='linkError'?<button type="button" disabled={busy} onClick={()=>switchMode('forgot')} style={button}>Solicitar un enlace nuevo</button>:null}
 {mode==='signin'?<><div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',marginTop:12}}><button type="button" disabled={busy} onClick={()=>switchMode('forgot')} style={secondary}>Olvidé mi contraseña</button><button type="button" disabled={busy} onClick={()=>switchMode('signup')} style={secondary}>Crear cuenta</button></div>{bio?<button type="button" disabled={busy} onClick={()=>void act(async()=>{await signinAccountWithBiometric();setReady(true);})} style={{...secondary,width:'100%'}}>Entrar con Face ID o huella</button>:null}</>:mode!=='reset'&&mode!=='linkError'?<button type="button" disabled={busy} onClick={()=>switchMode('signin')} style={{...secondary,width:'100%',marginTop:12}}>Volver a entrar</button>:null}
 </main></div>;
}
