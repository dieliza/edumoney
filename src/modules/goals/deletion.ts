import type {SqlDb} from '../money/store';
export const deletedGoalReason='Meta eliminada y saldo devuelto';
/** Tombstones use the existing audited goal history, retained by every supported backup. */
export async function deletedGoalIds(db:SqlDb):Promise<Set<string>>{
 const rows=await db.getAllAsync<{goalId:string;beforeJson:string}>('SELECT goal_id AS goalId,before_json AS beforeJson FROM goal_events WHERE reason=?',deletedGoalReason);
 const ids=new Set<string>();for(const row of rows){try{const event=JSON.parse(row.beforeJson);if(event.operation==='delete-goal'&&event.goal?.id===row.goalId)ids.add(row.goalId);}catch{/* An ordinary historical entry is not a tombstone. */}}return ids;
}
