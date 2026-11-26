// Keep the one-use verification fragment across Router initialization, in this tab only.
const fragment=location.hash;
if(fragment){try{sessionStorage.setItem('edu-account-link-v2',JSON.stringify({hash:fragment,until:Date.now()+600000}));}catch{/* The URL fragment remains the fallback if tab storage is unavailable. */}}
try{history.replaceState(null,'',location.pathname);}catch{/* Navigation below still replaces this entry. */}
location.replace('/'+fragment);
