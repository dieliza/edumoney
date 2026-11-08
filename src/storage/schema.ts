/** Solo SQL estático. Toda entrada del usuario se envía como parámetro. */
export const schemaV1 = `
CREATE TABLE categories (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
 UNIQUE(name, kind)
);
CREATE TABLE movements (
 id TEXT PRIMARY KEY NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
 kind TEXT NOT NULL CHECK(kind IN ('income','expense','transfer','loan','debt_payment','goal_contribution')),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents) = 'integer' AND amount_cents > 0 AND amount_cents <= 9007199254740991),
 currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency = 'USD'),
 date TEXT NOT NULL, description TEXT NOT NULL,
 category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT, payment_method TEXT,
 tax_review INTEGER NOT NULL DEFAULT 0 CHECK(tax_review IN (0,1)),
 use_kind TEXT NOT NULL DEFAULT 'unknown' CHECK(use_kind IN ('personal','business','mixed','unknown')),
 gross_cents INTEGER CHECK(gross_cents IS NULL OR (typeof(gross_cents)='integer' AND gross_cents >= 0)),
 withholding_cents INTEGER CHECK(withholding_cents IS NULL OR (typeof(withholding_cents)='integer' AND withholding_cents >= 0)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE INDEX movements_date ON movements(date);
CREATE TABLE bills (
 id TEXT PRIMARY KEY NOT NULL, provider TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents > 0),
 due_date TEXT NOT NULL, recurrence TEXT
);
CREATE TABLE debts (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
 balance_cents INTEGER NOT NULL CHECK(typeof(balance_cents)='integer' AND balance_cents >= 0),
 annual_rate_bps INTEGER CHECK(annual_rate_bps >= 0), minimum_cents INTEGER CHECK(minimum_cents >= 0),
 due_date TEXT, closing_date TEXT, fees_cents INTEGER CHECK(fees_cents >= 0)
);
CREATE TABLE goals (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
 target_cents INTEGER NOT NULL CHECK(typeof(target_cents)='integer' AND target_cents > 0), desired_date TEXT
);
CREATE TABLE bill_payments (
 id TEXT PRIMARY KEY NOT NULL, bill_id TEXT NOT NULL REFERENCES bills(id),
 movement_id TEXT NOT NULL UNIQUE REFERENCES movements(id),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents > 0)
);
CREATE TABLE debt_payments (
 id TEXT PRIMARY KEY NOT NULL, debt_id TEXT NOT NULL REFERENCES debts(id),
 movement_id TEXT NOT NULL UNIQUE REFERENCES movements(id),
 principal_cents INTEGER CHECK(principal_cents >= 0), interest_cents INTEGER CHECK(interest_cents >= 0), fees_cents INTEGER CHECK(fees_cents >= 0)
);
CREATE TABLE goal_contributions (
 id TEXT PRIMARY KEY NOT NULL, goal_id TEXT NOT NULL REFERENCES goals(id),
 movement_id TEXT NOT NULL UNIQUE REFERENCES movements(id),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents > 0)
);
CREATE TABLE documents (
 id TEXT PRIMARY KEY NOT NULL, movement_id TEXT REFERENCES movements(id),
 sha256 TEXT NOT NULL UNIQUE, encrypted_path TEXT,
 supersedes_id TEXT UNIQUE REFERENCES documents(id),
 status TEXT NOT NULL CHECK(status IN ('received','pending','corrected','not_applicable'))
);
CREATE TABLE tax_records (
 id TEXT PRIMARY KEY NOT NULL, movement_id TEXT REFERENCES movements(id), document_id TEXT REFERENCES documents(id),
 tax_year INTEGER NOT NULL CHECK(tax_year BETWEEN 1900 AND 9999),
 status TEXT NOT NULL CHECK(status IN ('received','pending','corrected','not_applicable')), notes TEXT,
 CHECK(movement_id IS NOT NULL OR document_id IS NOT NULL),
 UNIQUE(movement_id, tax_year), UNIQUE(document_id, tax_year)
);
`;
