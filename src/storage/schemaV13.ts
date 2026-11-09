export const schemaV13=`
CREATE TABLE business_planning_records (
 id TEXT PRIMARY KEY,holder_id TEXT NOT NULL REFERENCES business_holders(id),
 kind TEXT NOT NULL CHECK(kind IN ('plan','treatment','cash','payment','scenario','calendar')),
 record_key TEXT NOT NULL,entry_id TEXT REFERENCES business_entries(id),movement_id TEXT REFERENCES movements(id),
 record_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,voided_at TEXT,void_reason TEXT NOT NULL DEFAULT '',
 FOREIGN KEY(entry_id,holder_id) REFERENCES business_entries(id,holder_id)
);
CREATE UNIQUE INDEX business_planning_key ON business_planning_records(holder_id,kind,record_key) WHERE voided_at IS NULL;
CREATE UNIQUE INDEX business_planning_cash_movement ON business_planning_records(movement_id) WHERE movement_id IS NOT NULL AND voided_at IS NULL;
CREATE UNIQUE INDEX business_planning_tax_entry ON business_planning_records(entry_id) WHERE kind='payment' AND entry_id IS NOT NULL AND voided_at IS NULL;
`;
