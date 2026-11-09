export const schemaV10 = `
CREATE TABLE business_holders (
 id TEXT PRIMARY KEY, legal_name TEXT NOT NULL, legal_form TEXT NOT NULL,
 municipality TEXT NOT NULL, merchant_number TEXT NOT NULL,
 llc_jurisdiction TEXT, llc_members TEXT,
 pr_classification TEXT NOT NULL, federal_classification TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
);
CREATE TABLE business_dbas (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id),
 name TEXT NOT NULL, UNIQUE(id,holder_id)
);
CREATE UNIQUE INDEX business_dba_name ON business_dbas(holder_id,lower(trim(name)));
CREATE TABLE business_projects (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id),
 dba_id TEXT, name TEXT NOT NULL,
 FOREIGN KEY(dba_id,holder_id) REFERENCES business_dbas(id,holder_id)
);
CREATE UNIQUE INDEX business_project_name ON business_projects(holder_id,lower(trim(name)));
CREATE TABLE business_profile_events (
 id INTEGER PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id),
 before_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
`;
