import type {MoneyStore} from '../money/store';
import {validateJurisdiction,type JurisdictionProfile} from './domain';
export class JurisdictionStore{
 constructor(private ledger:MoneyStore){}
 read(){return this.ledger.read(db=>db.getFirstAsync<JurisdictionProfile>('SELECT residence,work,year FROM tax_jurisdiction WHERE id=1'));}
 save(p:JurisdictionProfile){validateJurisdiction(p);return this.ledger.transaction(db=>db.runAsync('INSERT INTO tax_jurisdiction(id,residence,work,year,updated_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET residence=excluded.residence,work=excluded.work,year=excluded.year,updated_at=excluded.updated_at',p.residence,p.work,p.year,new Date().toISOString()));}
}
