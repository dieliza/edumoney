import {useTheme} from '../design/ThemeProvider';
import {CRASH_BOAT_LABEL,CRASH_BOAT_THUMB} from '../design/crashBoat';
export function SceneThemeChoice(){
 const {preference,setPreference,colors}=useTheme();const selected=preference==='crash-boat';
 return <button type="button" data-testid="theme-choice-crash-boat" aria-pressed={selected} onClick={()=>setPreference('crash-boat')} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:12,borderRadius:16,border:`2px solid ${selected?colors.primary:colors.line}`,background:colors.surface,color:colors.text,textAlign:'left',font:'inherit',cursor:'pointer'}}>
 <img src={CRASH_BOAT_THUMB} alt="" width={64} height={58} style={{objectFit:'cover',borderRadius:10,flexShrink:0}} loading="lazy"/>
 <span style={{flex:1,minWidth:0}}><strong style={{display:'block',fontSize:16}}>{CRASH_BOAT_LABEL}</strong><span style={{display:'block',fontSize:14,color:colors.muted}}>Fondo de playa · superficies claras</span></span>
 {selected?<span aria-label="Seleccionado">✓</span>:null}
 </button>;
}
