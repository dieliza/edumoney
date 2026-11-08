/** Deudas: conserva saldos previos, vínculos y valores desconocidos. */
export const schemaV4 = `
ALTER TABLE debts ADD COLUMN kind TEXT NOT NULL DEFAULT 'unknown' CHECK(kind IN ('credit_card','personal_loan','auto_loan','other','unknown'));
ALTER TABLE debts ADD COLUMN balance_as_of TEXT;
ALTER TABLE debts ADD COLUMN balance_revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE debts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE debts ADD COLUMN future_rate_bps INTEGER CHECK(future_rate_bps BETWEEN 0 AND 100000);
ALTER TABLE debts ADD COLUMN rate_change_date TEXT;
ALTER TABLE debts ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1));
ALTER TABLE bills ADD COLUMN debt_id TEXT REFERENCES debts(id);
ALTER TABLE bills ADD COLUMN debt_bill_key TEXT;
CREATE UNIQUE INDEX debt_bill_cycle_unique ON bills(debt_bill_key) WHERE debt_bill_key IS NOT NULL;
ALTER TABLE debt_payments RENAME TO debt_payments_v1;
CREATE TABLE debt_payments (
 id TEXT PRIMARY KEY NOT NULL, debt_id TEXT NOT NULL REFERENCES debts(id), movement_id TEXT NOT NULL REFERENCES movements(id),
 principal_cents INTEGER CHECK(principal_cents>=0), interest_cents INTEGER CHECK(interest_cents>=0), fees_cents INTEGER CHECK(fees_cents>=0),
 applied_cents INTEGER NOT NULL DEFAULT 0 CHECK(applied_cents>=0), balance_revision INTEGER,
 cycle_due_date TEXT, created_movement INTEGER NOT NULL DEFAULT 0 CHECK(created_movement IN (0,1)),
 owned_bill_payment_id TEXT REFERENCES bill_payments(id), reversed_at TEXT, reversal_reason TEXT
);
INSERT INTO debt_payments(id,debt_id,movement_id,principal_cents,interest_cents,fees_cents)
 SELECT id,debt_id,movement_id,principal_cents,interest_cents,fees_cents FROM debt_payments_v1;
DROP TABLE debt_payments_v1;
CREATE UNIQUE INDEX debt_active_movement_unique ON debt_payments(movement_id) WHERE reversed_at IS NULL;
CREATE TABLE debt_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, debt_id TEXT NOT NULL REFERENCES debts(id), kind TEXT NOT NULL,
 effective_date TEXT, balance_before INTEGER NOT NULL, balance_after INTEGER NOT NULL,
 reason TEXT NOT NULL, before_json TEXT, recorded_at TEXT NOT NULL
);
INSERT INTO debt_events(debt_id,kind,effective_date,balance_before,balance_after,reason,recorded_at)
 SELECT id,'opening',NULL,balance_cents,balance_cents,'Saldo previo conservado; fecha desconocida','legacy' FROM debts;
CREATE TABLE debt_plans(id TEXT PRIMARY KEY NOT NULL, start_date TEXT NOT NULL);
CREATE TABLE debt_plan_actions (
 plan_id TEXT NOT NULL REFERENCES debt_plans(id), action_key TEXT NOT NULL, completed_at TEXT,
 PRIMARY KEY(plan_id,action_key)
);
`;
