/** Expediente de revisión; no contiene fórmulas ni reglas de deducibilidad. */
export const schemaV8=`
CREATE TABLE tax_profiles (
 tax_year INTEGER PRIMARY KEY CHECK(tax_year BETWEEN 1900 AND 9999),
 residence TEXT NOT NULL DEFAULT 'unknown' CHECK(residence IN ('full_year_pr','partial_pr','other','unknown')),
 filing_status TEXT NOT NULL DEFAULT 'unknown' CHECK(filing_status IN ('single','married','other','unknown')),
 income_sources TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE tax_records ADD COLUMN classification TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE tax_records ADD COLUMN use_kind TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE tax_records ADD COLUMN business_bps INTEGER CHECK(business_bps BETWEEN 0 AND 10000);
ALTER TABLE tax_records ADD COLUMN source_version INTEGER;
ALTER TABLE tax_records ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE tax_statements (
 id TEXT PRIMARY KEY NOT NULL, tax_year INTEGER NOT NULL CHECK(tax_year BETWEEN 1900 AND 9999),
 form_type TEXT NOT NULL, payer TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '',
 gross_cents INTEGER CHECK(gross_cents IS NULL OR (typeof(gross_cents)='integer' AND gross_cents>=0 AND gross_cents<=9007199254740991)),
 withheld_cents INTEGER CHECK(withheld_cents IS NULL OR (typeof(withheld_cents)='integer' AND withheld_cents>=0 AND withheld_cents<=9007199254740991)),
 net_cents INTEGER CHECK(net_cents IS NULL OR (typeof(net_cents)='integer' AND net_cents>=0 AND net_cents<=9007199254740991)),
 status TEXT NOT NULL CHECK(status IN ('received','pending','corrected','not_applicable')),
 document_id TEXT REFERENCES documents(id), document_version INTEGER,
 supersedes_id TEXT UNIQUE REFERENCES tax_statements(id), notes TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE tax_statement_movements (
 statement_id TEXT NOT NULL REFERENCES tax_statements(id), movement_id TEXT NOT NULL REFERENCES movements(id),
 movement_version INTEGER NOT NULL, PRIMARY KEY(statement_id,movement_id)
);
CREATE TABLE tax_events(id INTEGER PRIMARY KEY,entity_id TEXT NOT NULL,action TEXT NOT NULL,reason TEXT NOT NULL,before_json TEXT NOT NULL,recorded_at TEXT NOT NULL);
CREATE INDEX tax_year_records ON tax_records(tax_year);
CREATE INDEX tax_year_statements ON tax_statements(tax_year);
`;
