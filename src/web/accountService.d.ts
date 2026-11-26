export function signupAccount(email:string,password:string,repeat:string):Promise<string>;
export function signinAccount(email:string,password:string):Promise<{ready:boolean;previousRecordsPreserved?:boolean;localOnly?:boolean}>;
export function linkLegacyAccount(previous:string,password:string):Promise<{ready:boolean}>;
export function linkLegacyWithBiometric(password:string):Promise<{ready:boolean}>;
export function requestAccountRecovery(email:string):Promise<string>;
export function biometricAccountAvailable():Promise<boolean>;
export function legacyBiometricAvailable():Promise<boolean>;
export function signinAccountWithBiometric():Promise<{ready:boolean;localOnly:boolean}>;
export function confirmedWorkspaceKey(password:string):Promise<string>;
export function changeAccountPassword(current:string,password:string,repeat:string):Promise<void>;
export function accountIdentity():{id:string;email:string;localOnly:boolean;admin?:boolean}|null;
export function requestEmailAccountLink(email:string):Promise<string>;
export function consumeEmailAccountEntry():Promise<boolean>;
export function accountEnrollmentKnown():Promise<boolean>;

export type ManagedUser={id:string;email:string;confirmed:boolean;createdAt:string;lastSignInAt:string|null;isAdmin:boolean;status:'active'|'suspended'};
export type AdminResult={users:ManagedUser[];counts:{total:number;active:number;pending:number;suspended:number;administrators:number};page:number;hasMore:boolean;message?:string};
export function adminAction(action:string,payload?:Record<string,unknown>):Promise<AdminResult>;

export function beginAccountLink():Promise<{recovery:boolean;email:string}|null>;
export function finishAccountRecovery(password:string,repeat:string):Promise<{ready:boolean;previousRecordsPreserved?:boolean;localOnly?:boolean}>;
