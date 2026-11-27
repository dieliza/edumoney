const assert=require('node:assert/strict');
module.exports=function patchPush(factory){
 const replace=(from,to)=>{assert.equal(factory.split(from).length-1,1,'Expected existing push seam: '+from.slice(0,75));factory=factory.replace(from,to);};
 replace("const planned=Rules.reminderPlan(snapshot.bills,new Date(now),48);", "const billPlan=Rules.reminderPlan(snapshot.bills,new Date(now),48);const goals=await new (r(807).GoalStore)(await Money.getMoneyStore()).snapshot();const merged=r(39001).mergeGoalReminders(billPlan.reminders,r(39001).goalReminderPlan(goals.goals,new Date(now)),48);const planned={reminders:merged.reminders,deferred:billPlan.deferred+merged.deferred};");
 replace("const emit=()=>listeners.forEach(f=>f());", "const emit=()=>{listeners.forEach(f=>f());window.dispatchEvent(new CustomEvent('edumoney-goal-reminder-status',{detail:{enabled,message:capability()||status}}));};");
 replace("e.start=function(){", "function onGoalEnable(event){event.preventDefault();const complete=event.detail?.complete;if(typeof complete!=='function')return;void activate('payment').then(()=>complete({enabled,message:capability()||status}));}function onGoalState(event){if(typeof event.detail?.complete==='function')event.detail.complete({enabled,message:capability()||status});}e.start=function(){");
 replace("window.addEventListener('online',update);", "window.addEventListener('edumoney-enable-goal-reminders',onGoalEnable);window.addEventListener('edumoney-goal-reminder-state',onGoalState);window.addEventListener('online',update);");
 replace("window.removeEventListener('online',update);", "window.removeEventListener('edumoney-enable-goal-reminders',onGoalEnable);window.removeEventListener('edumoney-goal-reminder-state',onGoalState);window.removeEventListener('online',update);");
 replace('Solo para facturas con aviso que tú programes:', 'Para facturas con aviso y aportaciones pendientes de tus metas:');
 replace('Si cambias o pagas una factura sin internet, su aviso remoto se actualizará al reconectar.', 'Si cambias una fecha, aportas a una meta o pagas una factura sin internet, su aviso remoto se actualizará al reconectar.');
 return factory;
};
