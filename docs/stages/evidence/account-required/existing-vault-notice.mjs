// Mount only from the real StorageGate after it knows a vault exists and is unlocked.
// No storage writes, automatic navigation, tracking, migration, or push permission.
export function mountExistingVaultNotice(host,{vaultExists,unlocked,onlineEnabled,onLater=()=>{}}){
 if(vaultExists!==true||unlocked!==true||onlineEnabled!==true)return null;
 const d=host.ownerDocument,section=d.createElement('section');section.setAttribute('aria-label','Actualización de acceso');
 const title=d.createElement('h2');title.textContent='Nuevo acceso por correo, sin perder tus registros';
 const text=d.createElement('p');text.textContent='Puedes crear y confirmar tu cuenta en línea. Tu contraseña local, respaldo y registros siguen igual. Esta preparación todavía no vincula ni recupera tu espacio cifrado por correo.';
 const label=d.createElement('label'),consent=d.createElement('input');consent.type='checkbox';label.append(consent,d.createTextNode(' Quiero abrir el registro de una cuenta independiente. Entiendo que aún no vincula este espacio.'));
 const link=d.createElement('a');link.textContent='Crear o verificar mi cuenta';link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-disabled','true');
 consent.onchange=()=>{if(consent.checked){link.href='/account/access';link.setAttribute('aria-disabled','false');}else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');}};
 link.onclick=e=>{if(!consent.checked)e.preventDefault();};
 const later=d.createElement('button');later.type='button';later.textContent='Más tarde';later.onclick=()=>{section.remove();onLater();};
 section.append(title,text,label,link,later);host.append(section);return section;
}
export function accessDecision({vaultExists,unlocked,onlineIdentityVerified,onlineEnabled}){
 if(vaultExists!==true&&vaultExists!==false)return 'wait-or-error';
 if(vaultExists===true)return unlocked===true?'existing-unlocked':'legacy-unlock';
 if(onlineEnabled!==true)return 'new-registration-unavailable';
 return onlineIdentityVerified===true?'new-needs-explicit-local-vault-setup':'register-and-verify-first';
}
