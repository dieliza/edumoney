/** Additive goal planning and celebration metadata. No money record is replaced. */
const columnsV21=`
ALTER TABLE goals ADD COLUMN cadence_detail TEXT CHECK(cadence_detail IN ('weekly','biweekly','monthly'));
ALTER TABLE goals ADD COLUMN track_start_date TEXT;
ALTER TABLE goals ADD COLUMN celebrated_target_cents INTEGER CHECK(celebrated_target_cents IS NULL OR (typeof(celebrated_target_cents)='integer' AND celebrated_target_cents>0));
`;
export const fillGoalTrackStart=`UPDATE goals SET track_start_date=COALESCE((SELECT MIN(m.date) FROM goal_contributions c JOIN movements m ON m.id=c.movement_id WHERE c.goal_id=goals.id),date((SELECT MIN(f.created_at) FROM money_funds f WHERE f.goal_id=goals.id)),date('now')) WHERE track_start_date IS NULL;`;
export const schemaV21=columnsV21+fillGoalTrackStart;
