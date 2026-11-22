export const router={push:(route:unknown)=>{window.dispatchEvent(new CustomEvent('qa-route',{detail:route}));}};
export const useIsFocused=()=>true;
export const usePathname=()=>'/local-transaction-review';
export const useLocalSearchParams=()=>({});
