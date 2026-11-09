import { UserInputError } from '../../core/errors';
import type { BusinessProfile, Classification, LegalForm } from './types';
export const legalForms: readonly (readonly [LegalForm, string])[] = [
 ['individual','Comerciante individual'],['llc','LLC'],['corporation','Corporación'],['partnership','Sociedad'],['other','Otra forma jurídica'],
];
export const classificationLabels: Record<Classification,string> = {
 pending:'Pendiente de confirmar', individual:'Individuo', corporation:'Corporación', pass_through:'Entidad conducto', partnership:'Sociedad / partnership', disregarded:'Entidad ignorada',
};
export function classifications(form: LegalForm | '', jurisdiction: 'pr' | 'federal'): Classification[] {
 if (form === 'individual') return ['pending','individual'];
 if (jurisdiction === 'pr') return ['pending','corporation','pass_through'];
 return form === 'llc' ? ['pending','corporation','partnership','disregarded'] : ['pending','corporation','partnership'];
}
function text(value: unknown, max: number, required = false): value is string {
 return typeof value === 'string' && value.length <= max && (!required || !!value.trim());
}
export function validateProfile(p: BusinessProfile) {
 const h=p.holder;
 if (!text(h.id,100,true)||!text(h.legalName,200,true)||!legalForms.some(([v])=>v===h.legalForm)||!text(h.municipality,100)||!text(h.merchantNumber,100)) throw new UserInputError('Indica nombre legal y forma jurídica; revisa la longitud de los campos.');
 if (!classifications(h.legalForm,'pr').includes(h.prClassification)||!classifications(h.legalForm,'federal').includes(h.federalClassification)) throw new UserInputError('Revisa las clasificaciones separadas de Puerto Rico y federal.');
 if (h.legalForm==='llc') {
  if (!text(h.llcJurisdiction,150,true)||!['one','multiple','pending'].includes(h.llcMembers??'')) throw new UserInputError('Indica la jurisdicción de constitución y los miembros de la LLC, o su estado pendiente.');
 } else if (h.llcJurisdiction!==null||h.llcMembers!==null) throw new UserInputError('Los datos de constitución LLC solo corresponden a una LLC.');
 if (!Array.isArray(p.dbas)||!Array.isArray(p.projects)||p.dbas.length>100||p.projects.length>200) throw new UserInputError('Revisa la cantidad de nombres comerciales y proyectos.');
 for (const items of [p.dbas,p.projects]) {
  const ids=new Set<string>(), names=new Set<string>();
  for (const item of items) {
   const name=typeof item.name==='string'?item.name.trim().toLocaleLowerCase():'';
   if (!text(item.id,100,true)||item.holderId!==h.id||!text(item.name,200,true)||ids.has(item.id)||names.has(name)) throw new UserInputError('Cada nombre comercial y proyecto debe tener nombre, identificador y titular válidos, sin duplicados.');
   ids.add(item.id);names.add(name);
  }
 }
 for (const project of p.projects) if (project.dbaId!==null&&!p.dbas.some(d=>d.id===project.dbaId)) throw new UserInputError('El DBA del proyecto debe pertenecer al mismo titular.');
}
