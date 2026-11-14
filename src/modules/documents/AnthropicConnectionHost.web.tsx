import {useEffect} from 'react';
import {restoreAnthropicConnection} from '../../web/anthropicConnection';
export function AnthropicConnectionHost(){useEffect(()=>{void restoreAnthropicConnection().catch(()=>{/* La app sigue disponible; configuración permite recuperar o retirar la conexión. */});},[]);return null;}
