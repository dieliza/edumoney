/** Desglose reconocido y revisado, separado de imágenes y movimientos existentes. */
export const schemaV17=`
CREATE TABLE document_readings (
 document_id TEXT PRIMARY KEY NOT NULL REFERENCES documents(id),
 record_json TEXT NOT NULL,
 recorded_at TEXT NOT NULL
);
`;
