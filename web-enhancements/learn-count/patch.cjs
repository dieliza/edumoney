const assert=require('node:assert/strict');
exports.panel=function(factory){
 const change=(from,to)=>{assert.equal(factory.split(from).length-1,1,'Published learning seam: '+from.slice(0,100));factory=factory.replace(from,to);};
 change(".filter(entry=>i?(0,t.isDebtTip)(entry):!(0,t.isDebtTip)(entry))", ".filter(entry=>!i||(0,t.isDebtTip)(entry))");
 change(".filter(e=>i?(0,t.isDebtTip)(e):!(0,t.isDebtTip)(e))", ".filter(e=>!i||(0,t.isDebtTip)(e))");
 change('El avance del ciclo incluye todos los temas. Aqu\\xed ves los consejos de esta secci\\xf3n.', 'El contador corresponde al ciclo actual. Aprende incluye los diez consejos, con todos sus temas.');
 change("I(n.notice??'')", "I(n.notice??''),await G()");
 change('U.current=!0;let t=!1;', "U.current=!0;let t=!1;const progressFocus=r(214).default.addEventListener('change',state=>{if(state==='active'&&!t)void G().catch(()=>R('No pudimos actualizar el avance. Vuelve a abrir Aprende.'));});");
 change('t=!0,U.current=!1}', 't=!0,U.current=!1,progressFocus.remove()}');
 return factory;
};
exports.store=function(factory){const from='async snapshot(){return this.ledger.transaction(async t=>{';assert.equal(factory.split(from).length-1,1);return factory.replace(from,from+'await r(40000).repairEducationProgress(t);');};
