import {router} from 'expo-router';
/** Return to the native app entry without replacing its database or keys. */
export function restartApp(){router.dismissAll();router.replace('/');}
