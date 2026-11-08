export const schemaV6=`
CREATE TABLE lesson_progress(lesson_id TEXT NOT NULL,lesson_version INTEGER NOT NULL,completed_at TEXT NOT NULL,PRIMARY KEY(lesson_id,lesson_version));
CREATE TABLE lesson_attempts(id TEXT PRIMARY KEY NOT NULL,lesson_id TEXT NOT NULL,lesson_version INTEGER NOT NULL,answer INTEGER NOT NULL,correct INTEGER NOT NULL CHECK(correct IN (0,1)),recorded_at TEXT NOT NULL);
CREATE TABLE decision_scenarios(id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,input_json TEXT NOT NULL,formula_version INTEGER NOT NULL,created_at TEXT NOT NULL);
`;
