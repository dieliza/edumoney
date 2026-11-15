import {useEffect} from 'react';
import {migrateOwnerReader} from './SharedReaderAdmin.web';
export function AnthropicConnectionHost(){useEffect(()=>{void migrateOwnerReader().catch(()=>{});},[]);return null;}
