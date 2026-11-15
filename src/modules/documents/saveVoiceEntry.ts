import {UserInputError} from '../../core/errors';
import type {Category,PaymentMethod} from '../money/types';
import type {DocumentInput} from './types';
import {classifyVoiceEntry} from './voiceEntry';
export interface VoiceEntryStores {
 documents:{save(input:DocumentInput):Promise<unknown>;updateVoiceNote(id:string,version:number,text:string):Promise<unknown>};
 ledger:{snapshot():Promise<{categories:Category[]}>;saveCategory(id:string,name:string,kind:'income'|'expense'):Promise<unknown>};
}
/** Reuses encrypted document persistence, financial validation and duplicate protection. */
export async function saveVoiceEntry(stores:VoiceEntryStores,text:string,id:string,today:string,newCategoryId:()=>string,pending?:{id:string;version:number},confirmedMethod?:PaymentMethod){
 const content=text.trim();if(!content||content.length>20000)throw new UserInputError('Escribe o dicta entre 1 y 20,000 caracteres.');
 const {categories}=await stores.ledger.snapshot();const p=classifyVoiceEntry(content,categories,today,confirmedMethod);
 if(pending&&!p.ready){await stores.documents.updateVoiceNote(pending.id,pending.version,content);return p;}
 let categoryId=p.category?.id??null;
 if(p.ready&&p.kind&&!categoryId){let category=categories.find(c=>!c.archived&&c.kind===p.kind&&/^dictado por voz(?: \(\d+\))?$/i.test(c.name));if(!category){let name='Dictado por voz',suffix=2;while(categories.some(c=>c.kind===p.kind&&c.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')))name=`Dictado por voz (${suffix++})`;category={id:newCategoryId(),name,kind:p.kind,archived:false};await stores.ledger.saveCategory(category.id,category.name,category.kind);}categoryId=category.id;}
 const metadata=p.ready?'Registro confirmado desde Home.':`Pendiente de revisión: ${p.reasons.join(' ')} No modifica los totales.`;
 await stores.documents.save({...(pending?{resolveVoiceNote:pending}:{}),id,source:'voice',kind:p.ready?(p.kind==='income'?'paid_income':'paid_expense'):'note',description:content.replace(/\s+/g,' ').slice(0,100),date:p.ready?p.date:null,amountCents:p.ready?p.amountCents:null,notes:`${metadata}\n\n${content}`.slice(0,20000),rawText:content,image:null,keepImage:false,movementId:null,billId:null,expectedMovementVersion:null,expectedBillVersion:null,categoryId:p.ready?categoryId:null,paymentMethod:p.ready?p.method:null,supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:true});
 return p;
}
