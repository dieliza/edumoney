/** Solo educación: sin alterar movimientos, metas o tablas contributivas. */
export const schemaV18=`
CREATE TABLE education_content(id TEXT NOT NULL,version INTEGER NOT NULL,record_json TEXT NOT NULL,PRIMARY KEY(id,version));
CREATE TABLE education_progress(tip_id TEXT PRIMARY KEY NOT NULL,version INTEGER NOT NULL,read_at TEXT,learned_at TEXT);
CREATE TABLE education_attempts(id TEXT PRIMARY KEY NOT NULL,tip_id TEXT NOT NULL,version INTEGER NOT NULL,answer INTEGER NOT NULL,correct INTEGER NOT NULL,recorded_at TEXT NOT NULL);
CREATE TABLE education_awards(id TEXT PRIMARY KEY NOT NULL,badge_id TEXT NOT NULL UNIQUE,title TEXT NOT NULL,symbol TEXT NOT NULL,earned_at TEXT NOT NULL,basis TEXT NOT NULL,celebrated_at TEXT);
CREATE TABLE education_preferences(id TEXT PRIMARY KEY NOT NULL,animations INTEGER NOT NULL DEFAULT 1);
`;
