/** Tabla adicional: no cambia las columnas ni los datos de categorías y talonarios anteriores. */
export const schemaV16=`
CREATE TABLE income_deduction_rules (
 category_id TEXT PRIMARY KEY NOT NULL,
 rule_json TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE income_statement_revisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 document_id TEXT NOT NULL REFERENCES income_statements(document_id),
 before_json TEXT NOT NULL,
 recorded_at TEXT NOT NULL
);
`;
