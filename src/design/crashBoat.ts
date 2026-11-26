import type {ThemePreference} from './tokens';
export const CRASH_BOAT_LABEL='Crash Boat · Aguadilla';
export const CRASH_BOAT_THUMB='/themes/crash-boat-thumb.webp';
/** Only presentation. Existing forms, financial colors and storage stay untouched. */
export const crashBoatCSS=`
html[data-edumoney-scene="crash-boat"] [data-testid="theme-light"] {
 background-color:#EDF7F3 !important;
 background-image:linear-gradient(rgba(255,255,255,.70),rgba(255,255,255,.70)),url('/themes/crash-boat-720.webp') !important;
 background-size:cover !important;background-position:center 69% !important;background-repeat:no-repeat !important;
}
html[data-edumoney-scene="crash-boat"] [data-testid="theme-light"] > [aria-hidden="true"] {visibility:hidden;}
@media(max-width:600px) {
 html[data-edumoney-scene="crash-boat"] [data-testid="theme-light"] {
  background-image:linear-gradient(rgba(255,255,255,.70),rgba(255,255,255,.70)),url('/themes/crash-boat-480.webp') !important;
  background-position:48% 66% !important;
 }
}
@media(min-width:601px) and (max-width:1100px) {
 html[data-edumoney-scene="crash-boat"] [data-testid="theme-light"] {background-position:center 67% !important;}
}
`;
export function applyCrashBoat(preference:ThemePreference){
 if(typeof document==='undefined')return;
 if(preference==='crash-boat'){
  if(!document.getElementById('edumoney-crash-boat-style')){const style=document.createElement('style');style.id='edumoney-crash-boat-style';style.textContent=crashBoatCSS;document.head.appendChild(style);}
  document.documentElement.dataset.edumoneyScene='crash-boat';
 }else delete document.documentElement.dataset.edumoneyScene;
 return()=>{delete document.documentElement.dataset.edumoneyScene;};
}
