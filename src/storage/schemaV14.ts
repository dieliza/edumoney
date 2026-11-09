export const schemaV14=`
CREATE TABLE business_payroll_employees (
 id TEXT PRIMARY KEY,holder_id TEXT NOT NULL REFERENCES business_holders(id),code TEXT NOT NULL,record_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,
 UNIQUE(holder_id,code),UNIQUE(id,holder_id)
);
CREATE TABLE business_payroll_policies (
 id TEXT PRIMARY KEY,holder_id TEXT NOT NULL REFERENCES business_holders(id),year INTEGER NOT NULL,record_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,UNIQUE(holder_id,year)
);
CREATE TABLE business_payroll_runs (
 id TEXT PRIMARY KEY,holder_id TEXT NOT NULL REFERENCES business_holders(id),employee_id TEXT NOT NULL,reference TEXT NOT NULL,date TEXT NOT NULL,record_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,
 FOREIGN KEY(employee_id,holder_id) REFERENCES business_payroll_employees(id,holder_id),UNIQUE(holder_id,reference),UNIQUE(id,holder_id)
);
CREATE TABLE business_payroll_deposits (
 id TEXT PRIMARY KEY,holder_id TEXT NOT NULL REFERENCES business_holders(id),run_id TEXT NOT NULL,agency TEXT NOT NULL,date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>=0),reference TEXT NOT NULL,note TEXT NOT NULL,reversed_at TEXT,reverse_reason TEXT NOT NULL DEFAULT '',
 FOREIGN KEY(run_id,holder_id) REFERENCES business_payroll_runs(id,holder_id),UNIQUE(holder_id,reference)
);
`;
