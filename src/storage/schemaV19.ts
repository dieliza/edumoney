/** Envelopes are allocations of existing money, never income or expense rows. */
export const schemaV19=`
CREATE TABLE money_locations (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('bank','cooperative','cash','digital','other')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE money_funds (
 id TEXT PRIMARY KEY NOT NULL, scope TEXT NOT NULL CHECK(scope IN ('personal','business')),
 kind TEXT NOT NULL CHECK(kind IN ('savings','emergency','budget')), name TEXT NOT NULL,
 goal_id TEXT UNIQUE REFERENCES goals(id), target_cents INTEGER NOT NULL DEFAULT 0 CHECK(typeof(target_cents)='integer' AND target_cents>=0),
 contribution_cents INTEGER NOT NULL DEFAULT 0 CHECK(typeof(contribution_cents)='integer' AND contribution_cents>=0),
 cadence TEXT NOT NULL DEFAULT 'monthly' CHECK(cadence IN ('weekly','biweekly','monthly')),
 target_date TEXT, location_id TEXT REFERENCES money_locations(id), budget_month TEXT, category_id TEXT REFERENCES categories(id),
 archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)), version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 created_at TEXT NOT NULL, CHECK(goal_id IS NULL OR scope='personal')
);
CREATE UNIQUE INDEX money_budget_category ON money_funds(scope,budget_month,category_id) WHERE kind='budget' AND category_id IS NOT NULL;
CREATE TABLE fund_transfers (
 sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, scope TEXT NOT NULL CHECK(scope IN ('personal','business')),
 from_id TEXT REFERENCES money_funds(id), to_id TEXT REFERENCES money_funds(id),
 amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0 AND amount_cents<=9007199254740991),
 date TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 created_at TEXT NOT NULL, reversed_at TEXT, reversal_reason TEXT,
 CHECK(COALESCE(from_id,'@available')<>COALESCE(to_id,'@available'))
);
CREATE INDEX fund_transfer_date ON fund_transfers(scope,date,sequence);
CREATE TABLE fund_events(id INTEGER PRIMARY KEY, entity_id TEXT NOT NULL, action TEXT NOT NULL, before_json TEXT NOT NULL, reason TEXT NOT NULL, recorded_at TEXT NOT NULL);
CREATE TABLE local_profile(id TEXT PRIMARY KEY CHECK(id='owner'), first_name TEXT NOT NULL);
CREATE TRIGGER fund_scope_insert BEFORE INSERT ON fund_transfers BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM money_funds WHERE id IN (NEW.from_id,NEW.to_id) AND scope<>NEW.scope) THEN RAISE(ABORT,'fund_scope_mismatch') END;
END;
CREATE TRIGGER fund_scope_update BEFORE UPDATE ON fund_transfers BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM money_funds WHERE id IN (NEW.from_id,NEW.to_id) AND scope<>NEW.scope) THEN RAISE(ABORT,'fund_scope_mismatch') END;
END;
`;
