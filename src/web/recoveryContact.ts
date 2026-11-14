/** Solicitud de ayuda; no es un token de recuperación ni transmite contraseñas. */
export const recoverySupportEmail='acceso@prbudget.org';
export const recoverySupportLink=`mailto:${recoverySupportEmail}?subject=${encodeURIComponent('EduMoney: ayuda para recuperar acceso')}&body=${encodeURIComponent('Necesito ayuda para recuperar el acceso a EduMoney.\nDispositivo y navegador: \nDescripción del problema: \n\nNo incluyo contraseñas, claves de API ni documentos financieros.')}`;
