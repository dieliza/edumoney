/** Override the legacy global glossy finish only inside this form. */
export function TransactionFormWebStyles(){return <style>{`
[data-testid="transaction-sheet"] button,[data-testid="transaction-sheet"] [role="button"],[data-testid="transaction-sheet"] [role="radio"],[data-testid="transaction-sheet"] select{background-image:none!important;box-shadow:none!important;}
[data-testid="transaction-sheet"] input,[data-testid="transaction-sheet"] select,[data-testid="transaction-sheet"] textarea{min-width:0;max-width:100%;box-sizing:border-box;}
[data-testid="transaction-sheet"] :focus-visible{outline:2px solid #A8CAFF;outline-offset:3px;}
[data-testid="transaction-sheet"] select{appearance:auto;}
`}</style>;}
