/** Cosmetic overlay only: retain every control's color, dimensions and event handlers. */
export function installButtonFinish(){
 if(typeof document==='undefined'||document.getElementById('edumoney-button-finish'))return;
 const style=document.createElement('style');style.id='edumoney-button-finish';
 style.textContent=`button,[role="button"],[role="tab"],[role="radio"],[role="switch"],input[type="button"],input[type="submit"],select {background-image:linear-gradient(135deg,rgba(255,255,255,.24),rgba(255,255,255,.025) 46%,rgba(0,0,0,.14)) !important;box-shadow:inset 0 1px 1px rgba(255,255,255,.52),inset 0 -2px 4px rgba(0,0,0,.22),0 0 9px rgba(255,255,255,.13),0 5px 12px rgba(0,0,0,.16) !important;}button:disabled,[aria-disabled="true"] {box-shadow:inset 0 1px rgba(255,255,255,.25) !important;}`;
 style.textContent+=`[data-testid="home-account-controls"] {container-type:inline-size;}[data-testid="home-account-controls"] [dir="auto"] {white-space:nowrap !important;font-size:clamp(10px,3.4cqw,18px) !important;}`;
 document.head.appendChild(style);
}
