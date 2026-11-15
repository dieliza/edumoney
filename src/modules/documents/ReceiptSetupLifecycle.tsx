import {useEffect} from 'react';
import {prepareReceiptSetup,resetReceiptSetup} from './readerSetup';
export function ReceiptSetupLifecycle(){useEffect(()=>{void prepareReceiptSetup();return resetReceiptSetup;},[]);return null;}
