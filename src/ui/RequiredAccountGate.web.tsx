import {useEffect,useRef,useState,type PropsWithChildren,type FormEvent} from 'react';
import {useTheme} from '../design/ThemeProvider';
import {signupAccount,beginAccountLink,finishAccountRecovery,consumeEmailAccountEntry,signinAccount,linkLegacyAccount,linkLegacyWithBiometric,legacyBiometricAvailable,requestAccountRecovery,biometricAccountAvailable,signinAccountWithBiometric} from '../web/accountService';
export function AccountPassword({label,name,value,onChange,disabled=false,creating=false}:{label:string;name:string;value:string;onChange:(s:string)=>void;disabled?:boolean;creating?:boolean}){
 const {colors}=useTheme();const [visible,setVisible]=useState(false);
 return <label style={{display:'grid',gap:6}}>{label}<span style={{display:'flex',border:`1px solid ${colors.line}`,borderRadius:12,background:colors.surfaceAlt}}><input name={name} type={visible?'text':'password'} autoComplete={creating?'new-password':'current-password'} minLength={creating?12:undefined} maxLength={128} required value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{minWidth:0,width:'100%',minHeight:48,padding:12,boxSizing:'border-box',border:0,borderRadius:12,background:'transparent',color:colors.text,font:'inherit'}}/><button type="button" aria-label={`${visible?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} disabled={disabled} onClick={()=>setVisible(v=>!v)} style={{flexShrink:0,minWidth:48,minHeight:48,border:0,background:'transparent',color:colors.text,cursor:'pointer'}}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible?<path d="m3 3 18 18"/>:null}</svg></button></span></label>;
}
export function RequiredAccountGate({children}:PropsWithChildren){
 const {colors}=useTheme();const [ready,setReady]=useState(false),[mode,setMode]=useState<'signin'|'signup'|'legacy'|'forgot'|'reset'>('signin');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[legacy,setLegacy]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(true),[bio,setBio]=useState(false),[legacyBio,setLegacyBio]=useState(false);const lock=useRef(true);
 useEffect(()=>{let live=true;void beginAccountLink().then(async link=>{if(!live)return;if(link){setEmail(link.email);setMode(link.recovery?'reset':'signin');setMessage(link.recovery?'Elige tu nueva contraseña.':'Correo confirmado. Entra para continuar.');}else if(await consumeEmailAccountEntry()){if(live)setReady(true);}}).catch(e=>{if(live)setError(e instanceof Error?e.message:'No pudimos verificar el enlace.');}).finally(()=>{if(live){setBusy(false);lock.current=false;}});void biometricAccountAvailable().then(v=>{if(live)setBio(v);}).catch(()=>{});void legacyBiometricAvailable().then(v=>{if(live)setLegacyBio(v);}).catch(()=>{});return()=>{live=false;};},[]);
 async function act(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No pudimos completar el acceso. Tus registros se conservan.');}finally{lock.current=false;setBusy(false);}}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=new FormData(event.currentTarget);const entered=String(values.get('password')??password),address=String(values.get('email')??email).trim(),confirmation=String(values.get('repeat')??repeat);setPassword(entered);setEmail(address);
  await act(async()=>{
   if(mode==='forgot'){setMessage(await requestAccountRecovery(address));return;}
   if(mode==='signup'){setMessage(await signupAccount(address,entered,confirmation));setPassword('');setRepeat('');setMode('signin');return;}
   const result=mode==='reset'?await finishAccountRecovery(entered,confirmation):mode==='legacy'?await linkLegacyAccount(String(values.get('legacy')??legacy),password):await signinAccount(address,entered);
   if(result.ready){setReady(true);setPassword('');setRepeat('');setLegacy('');return;}
   if('needsLegacy' in result&&result.needsLegacy){setMode('legacy');setMessage('Solo esta primera vez: abre los registros anteriores de este dispositivo para vincularlos a tu correo. No se borrará ningún dato.');}
  });
 }
 function switchMode(next:'signin'|'signup'|'forgot'){setMode(next);setPassword('');setRepeat('');setMessage('');setError('');}
 if(ready)return <>{children}</>;
 const field={width:'100%',boxSizing:'border-box' as const,minHeight:48,padding:12,border:`1px solid ${colors.line}`,borderRadius:12,background:colors.surfaceAlt,color:colors.text,font:'inherit'};
 const button={minHeight:50,padding:'12px 16px',border:0,borderRadius:12,background:colors.primary,color:'#fff',font:'inherit',fontWeight:700,cursor:'pointer'};
 const secondary={...button,background:'transparent',color:colors.primary,minHeight:44,padding:'8px 12px'};
 return <div style={{height:'100dvh',overflowY:'auto',background:colors.background,color:colors.text,padding:20,boxSizing:'border-box',display:'flex',justifyContent:'center',alignItems:'flex-start'}}><main style={{maxWidth:480,width:'100%',margin:'auto 0',background:colors.surface,borderRadius:20,padding:24,boxSizing:'border-box'}}>
 <h1 style={{fontSize:26,marginTop:0}}>{mode==='reset'?'Nueva contraseña':mode==='forgot'?'Recuperar acceso':mode==='signup'?'Crear cuenta EduMoney':'Entrar a EduMoney'}</h1>
 <p style={{lineHeight:1.5}}>{mode==='signin'?'Entra con tu correo y contraseña.':mode==='forgot'?'Te enviaremos un enlace a tu correo para crear una contraseña nueva.':mode==='signup'?'Usa tu correo y confirma una sola contraseña.':'Tus registros existentes se conservan.'}</p>
 {message?<p role="status" aria-live="polite" style={{lineHeight:1.5}}>{message}</p>:null}
 {error?<p role="alert" style={{lineHeight:1.5,color:'#B22442'}}>{error}</p>:null}
 <form onSubmit={event=>void submit(event)} style={{display:'grid',gap:16}}>
 {mode!=='legacy'&&mode!=='reset'?<label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} style={field}/></label>:null}
 {mode==='reset'||mode==='signup'||mode==='signin'?<AccountPassword label={mode==='reset'?'Nueva contraseña':'Contraseña'} name="password" value={password} onChange={setPassword} disabled={busy} creating={mode!=='signin'}/>:null}
 {mode==='signup'||mode==='reset'?<><AccountPassword label="Confirmar contraseña" name="repeat" value={repeat} onChange={setRepeat} disabled={busy} creating/><p style={{margin:0,color:colors.muted,fontSize:14}}>Usa de 12 a 128 caracteres.</p></>:null}
 {mode==='legacy'?<><AccountPassword label="Contraseña anterior de tus registros" name="legacy" value={legacy} onChange={setLegacy} disabled={busy}/>{legacyBio?<button type="button" disabled={busy} onClick={()=>void act(async()=>{await linkLegacyWithBiometric(password);setPassword('');setReady(true);})} style={secondary}>Abrir con Face ID o huella</button>:null}</>:null}
 <button type="submit" disabled={busy} style={button}>{busy?'Procesando…':mode==='signup'?'Crear cuenta':mode==='legacy'?'Abrir mis registros':mode==='forgot'?'Enviar enlace':mode==='reset'?'Guardar contraseña y entrar':'Entrar'}</button>
 </form>
 {mode==='signin'?<><div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',marginTop:12}}><button type="button" disabled={busy} onClick={()=>switchMode('forgot')} style={secondary}>Olvidé mi contraseña</button><button type="button" disabled={busy} onClick={()=>switchMode('signup')} style={secondary}>Crear cuenta</button></div>{bio?<button type="button" disabled={busy} onClick={()=>void act(async()=>{await signinAccountWithBiometric();setReady(true);})} style={{...secondary,width:'100%'}}>Entrar con Face ID o huella</button>:null}</>:mode!=='legacy'&&mode!=='reset'?<button type="button" disabled={busy} onClick={()=>switchMode('signin')} style={{...secondary,width:'100%',marginTop:12}}>Volver a entrar</button>:null}
 </main></div>;
}
