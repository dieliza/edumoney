/** Ampliación aditiva: conserva los movimientos y vínculos de la Etapa 1. */
export const schemaV2 = `
ALTER TABLE categories ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1));
CREATE TABLE income_schedules (
 id TEXT PRIMARY KEY NOT NULL, description TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0 AND amount_cents<=9007199254740991),
 category_id TEXT REFERENCES categories(id), payment_method TEXT,
 cadence TEXT NOT NULL CHECK(cadence IN ('weekly','monthly')),
 interval_count INTEGER NOT NULL CHECK(interval_count BETWEEN 1 AND 120),
 anchor_date TEXT NOT NULL, next_date TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
ALTER TABLE movements ADD COLUMN income_type TEXT NOT NULL DEFAULT 'manual' CHECK(income_type IN ('manual','recurring','extraordinary'));
ALTER TABLE movements ADD COLUMN schedule_id TEXT REFERENCES income_schedules(id);
ALTER TABLE movements ADD COLUMN occurrence_date TEXT;
ALTER TABLE movements ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX income_occurrence_unique ON movements(schedule_id,occurrence_date) WHERE schedule_id IS NOT NULL;
CREATE TABLE monthly_budgets (
 month TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>=0 AND amount_cents<=9007199254740991),
 PRIMARY KEY(month, category_id)
);
CREATE TABLE movement_revisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, movement_id TEXT NOT NULL REFERENCES movements(id),
 action TEXT NOT NULL CHECK(action IN ('edit','delete','restore')), reason TEXT NOT NULL,
 before_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
INSERT OR IGNORE INTO categories(id,name,kind) VALUES
 ('expense-food','Comida','expense'),('expense-home','Vivienda','expense'),
 ('expense-transport','Transporte','expense'),('expense-services','Servicios','expense'),
 ('expense-health','Salud','expense'),('expense-other','Otros gastos','expense'),
 ('income-salary','Salario','income'),('income-other','Otros ingresos','income');
`;
