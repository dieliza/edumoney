/** Ahorro previo no genera flujo; los aportes conservan un único movimiento. */
export const schemaV5 = `
ALTER TABLE goals ADD COLUMN kind TEXT NOT NULL DEFAULT 'other';
ALTER TABLE goals ADD COLUMN opening_cents INTEGER NOT NULL DEFAULT 0 CHECK(typeof(opening_cents)='integer' AND opening_cents>=0 AND opening_cents<=9007199254740991);
ALTER TABLE goals ADD COLUMN cadence TEXT NOT NULL DEFAULT 'monthly' CHECK(cadence IN ('weekly','monthly'));
ALTER TABLE goals ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE goals ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1));
CREATE TABLE goal_events(id INTEGER PRIMARY KEY,goal_id TEXT NOT NULL REFERENCES goals(id),reason TEXT NOT NULL,before_json TEXT NOT NULL,recorded_at TEXT NOT NULL);
ALTER TABLE goal_contributions RENAME TO goal_contributions_v1;
CREATE TABLE goal_contributions (
 id TEXT PRIMARY KEY NOT NULL, goal_id TEXT NOT NULL REFERENCES goals(id), movement_id TEXT NOT NULL REFERENCES movements(id),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0 AND amount_cents<=9007199254740991),
 created_movement INTEGER NOT NULL DEFAULT 0 CHECK(created_movement IN (0,1)), reversed_at TEXT, reversal_reason TEXT
);
INSERT INTO goal_contributions(id,goal_id,movement_id,amount_cents) SELECT id,goal_id,movement_id,amount_cents FROM goal_contributions_v1;
DROP TABLE goal_contributions_v1;
CREATE UNIQUE INDEX goal_movement_active ON goal_contributions(movement_id) WHERE reversed_at IS NULL;
CREATE TABLE progress_plans(id TEXT PRIMARY KEY NOT NULL,start_date TEXT NOT NULL);
CREATE TABLE progress_actions(plan_id TEXT NOT NULL REFERENCES progress_plans(id),step_key TEXT NOT NULL,completed_at TEXT,PRIMARY KEY(plan_id,step_key));
`;
