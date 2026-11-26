/** Monthly planning metadata only. No ledger, receipt or fund row is replaced. */
export const schemaV20=`
CREATE TABLE budget_plans (
 scope TEXT NOT NULL CHECK(scope IN ('personal','business')), month TEXT NOT NULL,
 plan_json TEXT NOT NULL, original_json TEXT, status TEXT NOT NULL CHECK(status IN ('draft','active')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0), updated_at TEXT NOT NULL, deleted_at TEXT,
 PRIMARY KEY(scope,month)
);
CREATE TABLE budget_plan_revisions (
 id INTEGER PRIMARY KEY, scope TEXT NOT NULL, month TEXT NOT NULL, version INTEGER NOT NULL,
 before_json TEXT NOT NULL, action TEXT NOT NULL CHECK(action IN ('save','delete')), recorded_at TEXT NOT NULL
);
`;
