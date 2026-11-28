import type {AccountScope} from '../../modules/money/accountScope';
export interface DashboardFundItem{kind:string;title:string;value:number|undefined}
export interface FuturisticFundsProps{available:number|undefined;total:number|undefined;items:DashboardFundItem[];scope:AccountScope;asOf:string;error:string;open(kind:string):void}
