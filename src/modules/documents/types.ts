import type { LedgerMovement,Category } from '../money/types';
export type RecordKind='paid_expense'|'paid_income'|'pending_bill'|'attachment'|'note';
export type Source='manual'|'camera'|'library'|'voice';
export interface ImageData {base64:string;mime:'image/jpeg'|'image/png'}
export interface DocumentInput {id:string;kind:RecordKind;source:Source;description:string;date:string|null;amountCents:number|null;notes:string;rawText:string|null;image:ImageData|null;keepImage:boolean;movementId:string|null;billId:string|null;expectedMovementVersion:number|null;expectedBillVersion:number|null;categoryId:string|null;paymentMethod:string|null;supersedesId:string|null;expectedDocumentVersion:number|null;confirmSimilar:boolean;reviewed:boolean}
export interface StoredDocument {id:string;movementId:string|null;billId:string|null;sha256:string;encryptedPath:string|null;supersedesId:string|null;status:string;source:Source;kind:RecordKind;description:string;date:string|null;amountCents:number|null;notes:string;mime:string|null;createdAt:string|null;deletedAt:string|null;copyDeletedAt:string|null;version:number}
export interface DocumentsSnapshot {documents:StoredDocument[];movements:LedgerMovement[];bills:{id:string;provider:string;amountCents:number;dueDate:string;version:number}[];categories:Category[]}

export interface CaptureResult { image: ImageData; text: string; warning: string; needsAmountReview?: boolean }
