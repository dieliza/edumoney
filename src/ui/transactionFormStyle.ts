import type {ThemeName} from '../design/tokens';
/** Semantic form colors follow the resolved app theme, including Automatic. */
const shared={expense:'#A31E4C',income:'#075E9E',save:'#007B59',onAccent:'#FFFFFF',field:'#F8FAFB',fieldInk:'#102F42',fieldLine:'#CCD7DD'} as const;
const transactionFormPalettes={
 light:{...shared,background:'#FFFFFF',panel:'#F2F8FA',neutral:'#E9EFF2',active:'#D2DFE5',text:'#102F42',muted:'#526675',line:'#CCD7DD',link:'#075E9E',error:'#A31E4C'},
 dark:{...shared,background:'#0E151A',panel:'#172128',neutral:'#202C34',active:'#394750',text:'#F6F9FA',muted:'#BCC8CE',line:'#394A54',link:'#A8CAFF',error:'#FFBAC5'},
} as const;
export function transactionFormColors(name:ThemeName){return transactionFormPalettes[name==='dark'?'dark':'light'];}
export type TransactionFormColors=ReturnType<typeof transactionFormColors>;
