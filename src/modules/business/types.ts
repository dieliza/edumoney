export type LegalForm = 'individual' | 'llc' | 'corporation' | 'partnership' | 'other';
export type Classification = 'pending' | 'individual' | 'corporation' | 'pass_through' | 'partnership' | 'disregarded';
export interface HolderInput {
 id: string; legalName: string; legalForm: LegalForm; municipality: string; merchantNumber: string;
 llcJurisdiction: string | null; llcMembers: 'one' | 'multiple' | 'pending' | null;
 prClassification: Classification; federalClassification: Classification;
}
export interface Holder extends HolderInput { version: number; updatedAt: string }
export interface BusinessDBA { id: string; holderId: string; name: string }
export interface BusinessProject { id: string; holderId: string; dbaId: string | null; name: string }
export interface BusinessProfile { holder: HolderInput; dbas: BusinessDBA[]; projects: BusinessProject[] }
export interface BusinessSnapshot { holders: Holder[]; dbas: BusinessDBA[]; projects: BusinessProject[] }
