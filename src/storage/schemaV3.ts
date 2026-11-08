/** Facturas concretas separadas de su plantilla. Nunca cambia vencimientos al generar recurrencias. */
export const schemaV3 = `
CREATE TABLE bill_series (
 id TEXT PRIMARY KEY NOT NULL, provider TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0 AND amount_cents<=9007199254740991),
 category_id TEXT REFERENCES categories(id), payment_kind TEXT NOT NULL CHECK(payment_kind IN ('expense','debt_payment')),
 cadence TEXT NOT NULL CHECK(cadence IN ('weekly','monthly','days')), interval_count INTEGER NOT NULL CHECK(interval_count BETWEEN 1 AND 365),
 anchor_date TEXT NOT NULL, next_date TEXT NOT NULL, end_date TEXT,
 reminder_days INTEGER CHECK(reminder_days BETWEEN 0 AND 30), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
ALTER TABLE bills ADD COLUMN category_id TEXT REFERENCES categories(id);
ALTER TABLE bills ADD COLUMN payment_kind TEXT NOT NULL DEFAULT 'expense' CHECK(payment_kind IN ('expense','debt_payment'));
ALTER TABLE bills ADD COLUMN series_id TEXT REFERENCES bill_series(id);
ALTER TABLE bills ADD COLUMN occurrence_date TEXT;
ALTER TABLE bills ADD COLUMN reminder_days INTEGER CHECK(reminder_days BETWEEN 0 AND 30);
ALTER TABLE bills ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE bills ADD COLUMN created_at TEXT;
ALTER TABLE bills ADD COLUMN updated_at TEXT;
ALTER TABLE bills ADD COLUMN voided_at TEXT;
CREATE UNIQUE INDEX bill_occurrence_unique ON bills(series_id,occurrence_date) WHERE series_id IS NOT NULL;
CREATE INDEX bills_due ON bills(due_date);
CREATE TABLE bill_revisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, bill_id TEXT NOT NULL REFERENCES bills(id),
 reason TEXT NOT NULL, before_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
ALTER TABLE bill_payments ADD COLUMN created_movement INTEGER NOT NULL DEFAULT 0 CHECK(created_movement IN (0,1));
CREATE TABLE bill_payment_reversals (
 payment_id TEXT PRIMARY KEY NOT NULL REFERENCES bill_payments(id), reason TEXT NOT NULL, recorded_at TEXT NOT NULL
);
`;
