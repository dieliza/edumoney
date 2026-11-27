const ts=require('typescript'),assert=require('node:assert/strict');
module.exports=function patchCalendar(factory){
 assert.equal(factory.split('const{scope:A}=(0,i.useLocalSearchParams)()').length-1,1);
 factory=factory.replace('const{scope:A}=(0,i.useLocalSearchParams)()','const{scope:A,view:goalCalendarView}=(0,i.useLocalSearchParams)()').replace("useState)('upcoming')","useState)(goalCalendarView==='calendar'?'calendar':'upcoming')");
 const sf=ts.createSourceFile('calendar.js','('+factory+')',99,true);let array;
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='me'&&n.initializer&&ts.isCallExpression(n.initializer)){const props=n.initializer.arguments[1];assert(props&&ts.isObjectLiteralExpression(props));const children=props.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='children');assert(children&&ts.isPropertyAssignment(children)&&ts.isArrayLiteralExpression(children.initializer));array=children.initializer;}ts.forEachChild(n,visit);}visit(sf);assert(array,'Published calendar content');
 const branch=array.elements.find(e=>ts.isConditionalExpression(e)&&e.condition.getText(sf)==="'calendar'===H");assert(branch,'Existing monthly selector');
 const pos=branch.end-1;return factory.slice(0,pos)+",S?null:('calendar'===H||'upcoming'===H)?(0,b.jsx)(_r(39000).GoalCalendar,{month:'calendar'===H?z:undefined,upcoming:'upcoming'===H}):null"+factory.slice(pos);
};
