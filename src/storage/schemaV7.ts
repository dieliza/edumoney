export const schemaV7=`
ALTER TABLE documents ADD COLUMN bill_id TEXT REFERENCES bills(id);
ALTER TABLE documents ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE documents ADD COLUMN record_kind TEXT NOT NULL DEFAULT 'attachment';
ALTER TABLE documents ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN document_date TEXT;
ALTER TABLE documents ADD COLUMN amount_cents INTEGER CHECK(amount_cents IS NULL OR (typeof(amount_cents)='integer' AND amount_cents>0 AND amount_cents<=9007199254740991));
ALTER TABLE documents ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN raw_text TEXT;
ALTER TABLE documents ADD COLUMN mime TEXT;
ALTER TABLE documents ADD COLUMN created_at TEXT;
ALTER TABLE documents ADD COLUMN deleted_at TEXT;
ALTER TABLE documents ADD COLUMN copy_deleted_at TEXT;
ALTER TABLE documents ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE document_contents(document_id TEXT PRIMARY KEY NOT NULL REFERENCES documents(id),base64 TEXT NOT NULL);
CREATE TABLE document_events(id INTEGER PRIMARY KEY,document_id TEXT NOT NULL REFERENCES documents(id),reason TEXT NOT NULL,before_json TEXT NOT NULL,recorded_at TEXT NOT NULL);
`;
