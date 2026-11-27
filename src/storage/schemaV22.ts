/** Annual goal cadence is additive; old cadence constraints and all financial rows remain intact. */
export const schemaV22="ALTER TABLE goals ADD COLUMN cadence_yearly TEXT CHECK(cadence_yearly IS NULL OR cadence_yearly='yearly');";
