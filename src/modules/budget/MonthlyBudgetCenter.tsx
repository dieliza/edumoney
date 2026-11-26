import {FundTransfers} from '../funds/FundTransfers';
import type {AccountScope} from '../money/accountScope';
export default function MonthlyBudgetCenter({scope}:{scope:AccountScope}){return <FundTransfers scope={scope} kind="budget" allowTransfer/>;}
