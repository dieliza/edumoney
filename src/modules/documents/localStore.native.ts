import * as Crypto from 'expo-crypto';
import { getMoneyStore } from '../money/localStore';
import { DocumentStore } from './store';
let instance:Promise<DocumentStore>|undefined;
export function getDocumentStore(){return instance??=getMoneyStore().then(ledger=>new DocumentStore(ledger,text=>Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,text)));}
