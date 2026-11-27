import type {SqlDb} from '../money/store';
/** Recover only stored correct attempts whose answer matches their cached content version. */
export async function repairEducationProgress(db:Pick<SqlDb,'getAllAsync'|'runAsync'>){
 const attempts=await db.getAllAsync<{tipId:string;version:number;answer:number;recordedAt:string;content:string}>(`SELECT a.tip_id AS tipId,a.version,a.answer,a.recorded_at AS recordedAt,c.record_json AS content FROM education_attempts a JOIN education_content c ON c.id=a.tip_id AND c.version=a.version LEFT JOIN education_progress p ON p.tip_id=a.tip_id WHERE a.correct=1 AND NULLIF(p.learned_at,'') IS NULL ORDER BY a.recorded_at,a.id`);
 const repaired=new Set<string>();
 for(const row of attempts){if(repaired.has(row.tipId)||!Number.isFinite(Date.parse(row.recordedAt)))continue;let tip;try{tip=JSON.parse(row.content);}catch{continue;}if(!tip||typeof tip!=='object'||tip.id!==row.tipId||tip.version!==row.version||!Array.isArray(tip.options)||!Number.isInteger(row.answer)||row.answer<0||row.answer>=tip.options.length||row.answer!==tip.correct)continue;
 await db.runAsync(`INSERT INTO education_progress(tip_id,version,read_at,learned_at) VALUES(?,?,?,?) ON CONFLICT(tip_id) DO UPDATE SET version=excluded.version,read_at=COALESCE(NULLIF(read_at,''),excluded.read_at),learned_at=COALESCE(NULLIF(learned_at,''),excluded.learned_at)`,row.tipId,row.version,row.recordedAt,row.recordedAt);repaired.add(row.tipId);
 }
 return repaired.size;
}
