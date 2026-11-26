import {transactionFormColors} from '../../ui/transactionFormStyle';
import {useTheme} from '../../design/ThemeProvider';
/** Matches the actual transaction sheet background, rather than the white dashboard cards. */
export function useBudgetSheetColors(){const{name}=useTheme();return transactionFormColors(name);}
export function BudgetPresentation(){return <style>{`
.edu-monthly-budget {font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:16px;line-height:1.4;}
.edu-budget-columns {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start;}
.edu-budget-column {display:grid;gap:14px;min-width:0;}
@media(max-width:760px){.edu-budget-columns{grid-template-columns:minmax(0,1fr);}.edu-budget-column{display:contents;}}
.edu-budget-compact-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px;align-items:start;}
.edu-budget-compact-grid>details {min-width:0;box-sizing:border-box;}
button[data-edu-budget-link] {background:var(--edu-budget-link-bg,transparent)!important;color:var(--edu-budget-link)!important;box-shadow:none!important;border:0!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;}
.edu-budget-modal-content {font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:16px;line-height:1.45;}
.edu-budget-modal-content label,.edu-budget-modal-content summary,.edu-budget-modal-content p {color:inherit;}
.edu-budget-transfer-surface [data-testid="fund-history-edit"],.edu-budget-transfer-surface [data-testid="fund-history-edit"] * {color:#075E9E!important;opacity:1!important;}
`}</style>;}
