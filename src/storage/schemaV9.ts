export const schemaV9=`
CREATE TABLE tax_closures(tax_year INTEGER PRIMARY KEY CHECK(tax_year BETWEEN 1900 AND 9999),answers_json TEXT NOT NULL,source_fingerprint TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL);
CREATE TABLE tax_closure_events(id INTEGER PRIMARY KEY,tax_year INTEGER NOT NULL,reason TEXT NOT NULL,before_json TEXT NOT NULL,recorded_at TEXT NOT NULL);
`;
