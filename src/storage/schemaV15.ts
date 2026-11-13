export const schemaV15=`
CREATE TABLE income_deduction_categories (
 id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'other'
);
CREATE UNIQUE INDEX income_deduction_name ON income_deduction_categories(lower(trim(name)));
CREATE TABLE income_statements (
 document_id TEXT PRIMARY KEY NOT NULL REFERENCES documents(id),
 movement_id TEXT UNIQUE NOT NULL REFERENCES movements(id),
 record_json TEXT NOT NULL,created_at TEXT NOT NULL
);
`;
