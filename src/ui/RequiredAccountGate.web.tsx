import {useEffect,useRef,useState,type PropsWithChildren,type FormEvent} from 'react';
import {useTheme} from '../design/ThemeProvider';
import {signupAccount,accountEnrollmentKnown,consumeEmailAccountEntry,requestEmailAccountLink,signinAccount,linkLegacyAccount,linkLegacyWithBiometric,legacyBiometricAvailable,requestAccountRecovery,biometricAccountAvailable,signinAccountWithBiometric} from '../web/accountService';
export function RequiredAccountGate({children}:PropsWithChildren){
 const {colors}=useTheme();const [ready,setReady]=useState(false),[mode,setMode]=useState<'signin'|'signup'|'legacy'>(()=>typeof location!=='undefined'&&new URLSearchParams(location.search).get('account')==='register'?'signup':'signin');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[legacy,setLegacy]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[bio,setBio]=useState(false),[legacyBio,setLegacyBio]=useState(false),[bound,setBound]=useState(false);const lock=useRef(false);
 useEffect(()=>{void accountEnrollmentKnown().then(setBound).catch(()=>{});void consumeEmailAccountEntry().then(open=>{if(open)setReady(true);}).catch(()=>{});void biometricAccountAvailable().then(setBio).catch(()=>{});void legacyBiometricAvailable().then(setLegacyBio).catch(()=>{});},[]);
 async function act(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No pudimos completar el acceso. Conserva tus datos.');}finally{lock.current=false;setBusy(false);}}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=new FormData(event.currentTarget);const entered=String(values.get('password')??password),address=String(values.get('email')??email).trim(),confirmation=String(values.get('repeat')??repeat);setPassword(entered);setEmail(address);
  await act(async()=>{
   if(mode==='signup'){setMessage(await signupAccount(address,entered,confirmation));setPassword('');setRepeat('');setMode('signin');return;}
   if(mode==='signin'&&!bound&&entered!==confirmation)throw Error('Escribe la misma contraseña en Confirmar contraseña para vincular esta cuenta.');
   const result=mode==='legacy'?await linkLegacyAccount(String(values.get('legacy')??legacy),password):await signinAccount(address,entered);
   if(result.ready){setReady(true);setPassword('');setRepeat('');setLegacy('');return;}
   if('needsLegacy' in result&&result.needsLegacy){setMode('legacy');setMessage('Encontramos registros anteriores sin recuperación vinculada. Escribe su contraseña actual una sola vez para conservarlos y vincularlos a tu correo verificado.');}
  });
 }
 if(ready)return <>{children}</>;
 const field={width:'100%',boxSizing:'border-box' as const,minHeight:48,padding:12,border:`1px solid ${colors.line}`,borderRadius:12,background:colors.surfaceAlt,color:colors.text,font:'inherit'};
 const button={minHeight:50,padding:'12px 16px',border:0,borderRadius:12,background:colors.primary,color:'#fff',font:'inherit',fontWeight:700,cursor:'pointer'};
 return <div style={{height:'100dvh',maxHeight:'100%',overflowY:'auto',background:colors.background,color:colors.text,padding:20,boxSizing:'border-box',display:'flex',justifyContent:'center',alignItems:'flex-start'}}><main style={{maxWidth:520,width:'100%',margin:'auto 0',background:colors.surface,borderRadius:20,padding:24,boxSizing:'border-box'}}>
 <h1 style={{fontSize:26,marginTop:0}}>Tu cuenta EduMoney</h1>
 <p style={{lineHeight:1.5}}>Ahora necesitas un correo verificado para proteger tu cuenta y recuperar tu contraseña. Tus registros existentes se conservan.</p>
 {message?<p role="status" aria-live="polite" style={{lineHeight:1.5}}>{message}</p>:null}
 {error?<p role="alert" style={{lineHeight:1.5,color:'#B22442'}}>{error}</p>:null}
 <form onSubmit={event=>void submit(event)} style={{display:'grid',gap:16}}>
 {mode!=='legacy'?<><label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} style={field}/></label>
 <label>Contraseña<input name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={mode==='signup'?12:undefined} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} style={field}/></label>
 {mode==='signup'||!bound?<label>Confirmar contraseña<input name="repeat" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={repeat} onChange={e=>setRepeat(e.target.value)} disabled={busy} style={field}/></label>:null}</>:<><p>Vincular los registros de este dispositivo a <strong>{email}</strong>.</p><label>Contraseña anterior de estos registros<input name="legacy" type="password" autoComplete="current-password" required value={legacy} onChange={e=>setLegacy(e.target.value)} disabled={busy} style={field}/></label><p>No se creará un espacio vacío ni se sustituirán tus registros si no podemos abrirlos.</p></>}
 <button type="submit" disabled={busy} style={button}>{busy?'Procesando…':mode==='signup'?'Crear cuenta y verificar correo':mode==='legacy'?'Vincular y conservar mis registros':'Entrar'}</button>
 </form>
 {mode!=='legacy'?<div style={{display:'grid',gap:12,marginTop:16}}><button type="button" disabled={busy} onClick={()=>{setMode(mode==='signup'?'signin':'signup');setPassword('');setRepeat('');setMessage('');setError('');}} style={{...button,background:colors.surfaceAlt,color:colors.primary}}>{mode==='signup'?'Ya tengo una cuenta':'Crear cuenta'}</button><button type="button" disabled={busy} onClick={()=>void act(async()=>setMessage(await requestAccountRecovery(email)))} style={{...button,background:'transparent',color:colors.primary}}>Olvidé mi contraseña</button><button type="button" disabled={busy} onClick={()=>void act(async()=>setMessage(await requestEmailAccountLink(email)))} style={{...button,background:'transparent',color:colors.primary}}>Entrar con enlace por correo</button></div>:null}
 {legacyBio&&mode==='legacy'?<button type="button" disabled={busy} onClick={()=>void act(async()=>{await linkLegacyWithBiometric(password);setPassword('');setReady(true);})} style={{...button,width:'100%',marginTop:12}}>Vincular con Face ID o huella</button>:null}
 {bio&&mode==='signin'?<button type="button" disabled={busy} onClick={()=>void act(async()=>{await signinAccountWithBiometric();setReady(true);})} style={{...button,width:'100%',marginTop:12}}>Entrar con Face ID o huella</button>:null}
 <p style={{fontSize:14,lineHeight:1.5,color:colors.muted}}>Al vincular tus registros, se guarda una clave de recuperación cifrada para tu cuenta verificada. Nunca se guarda tu contraseña. Los espacios antiguos que nunca se vincularon todavía necesitan su contraseña anterior.</p>
 </main></div>;
}
