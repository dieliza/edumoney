/** IRA metadata extends existing funds; no historical financial rows are rewritten. */
export const schemaV23=`
CREATE TABLE ira_accounts(id TEXT PRIMARY KEY REFERENCES money_funds(id),institution TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('traditional','roth','pr_deductible','pr_nondeductible')),opened TEXT NOT NULL,initial_cents INTEGER NOT NULL CHECK(initial_cents>=0),version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE ira_events(id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES ira_accounts(id),kind TEXT NOT NULL CHECK(kind IN ('yield','correction')),amount_cents INTEGER NOT NULL,date TEXT NOT NULL,reason TEXT NOT NULL,reverses_id TEXT UNIQUE REFERENCES ira_events(id),created_at TEXT NOT NULL);
CREATE TABLE ira_contributions(transfer_id TEXT PRIMARY KEY REFERENCES fund_transfers(id),account_id TEXT NOT NULL REFERENCES ira_accounts(id),tax_year INTEGER NOT NULL CHECK(tax_year BETWEEN 1900 AND 9999));
CREATE TABLE ira_schedules(id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES ira_accounts(id),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),cadence TEXT NOT NULL CHECK(cadence IN ('weekly','biweekly','monthly','yearly')),next_date TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)));
CREATE TABLE tax_jurisdiction(id INTEGER PRIMARY KEY CHECK(id=1),residence TEXT NOT NULL,work TEXT NOT NULL,year INTEGER NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE ira_tax_inputs(year INTEGER NOT NULL,jurisdiction TEXT NOT NULL,age INTEGER NOT NULL CHECK(age BETWEEN 0 AND 125),earned_cents INTEGER NOT NULL CHECK(earned_cents>=0),taxable_cents INTEGER CHECK(taxable_cents IS NULL OR taxable_cents>=0),eligibility INTEGER NOT NULL CHECK(eligibility IN (0,1)),PRIMARY KEY(year,jurisdiction));
CREATE TABLE ira_audit(id INTEGER PRIMARY KEY,account_id TEXT NOT NULL,before_json TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL);
`;
