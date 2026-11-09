export const schemaV11 = `
CREATE TABLE business_entries (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id),
 movement_id TEXT NOT NULL UNIQUE REFERENCES movements(id),
 kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
 movement_version INTEGER NOT NULL, use_kind TEXT NOT NULL CHECK(use_kind IN ('business','personal','mixed','pending')),
 business_bps INTEGER CHECK(business_bps BETWEEN 0 AND 10000), justification TEXT NOT NULL,
 cpa_status TEXT NOT NULL CHECK(cpa_status IN ('pending','reviewed','changes')),
 gross_cents INTEGER, commission_cents INTEGER, refund_cents INTEGER, ivu_cents INTEGER,
 version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, UNIQUE(id,holder_id)
);
CREATE UNIQUE INDEX business_project_holder_pair ON business_projects(id,holder_id);
CREATE TABLE business_allocations (
 entry_id TEXT NOT NULL, holder_id TEXT NOT NULL, project_id TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 PRIMARY KEY(entry_id,project_id),
 FOREIGN KEY(entry_id,holder_id) REFERENCES business_entries(id,holder_id),
 FOREIGN KEY(project_id,holder_id) REFERENCES business_projects(id,holder_id)
);
CREATE TABLE business_reserves (
 holder_id TEXT NOT NULL REFERENCES business_holders(id),
 kind TEXT NOT NULL CHECK(kind IN ('tax','ivu','payroll')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents>=0),
 note TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL,
 PRIMARY KEY(holder_id,kind)
);
CREATE TABLE business_ledger_events (
 id INTEGER PRIMARY KEY, entity_kind TEXT NOT NULL, entity_id TEXT NOT NULL,
 before_json TEXT NOT NULL, reason TEXT NOT NULL, recorded_at TEXT NOT NULL
);
`;
