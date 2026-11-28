/** NOAA solar equations (geometric altitude -0.833°, including typical refraction).
 * https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * San Juan:18.4655 N,66.1057 W. Local calculation; no personal data or location request.
 * Atmospheric conditions can shift observed sunrise/sunset by a few minutes. */
const rad=Math.PI/180,DAY=86400000;
export function sanJuanSolar(date:Date){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Puerto_Rico',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),get=(key:string)=>Number(parts.find(p=>p.type===key)?.value),year=get('year'),month=get('month'),day=get('day'),midnight=Date.UTC(year,month-1,day),doy=Math.floor((midnight-Date.UTC(year,0,1))/DAY)+1,gamma=2*Math.PI/365*(doy-1);
 const eq=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
 const decl=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
 const angle=Math.acos(Math.cos(90.833*rad)/(Math.cos(18.4655*rad)*Math.cos(decl))-Math.tan(18.4655*rad)*Math.tan(decl))/rad,noon=720+4*66.1057-eq;
 return {sunrise:new Date(midnight+(noon-4*angle)*60000),sunset:new Date(midnight+(noon+4*angle)*60000)};
}
export function morroLight(date:Date){const {sunrise,sunset}=sanJuanSolar(date),now=date.getTime(),rise=sunrise.getTime(),set=sunset.getTime(),smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};const night=now<rise+20*60000?1-smooth((now-(rise-30*60000))/(50*60000)):smooth((now-(set-20*60000))/(45*60000));return {night,phase:night===0?'day':night===1?'night':now<rise+20*60000?'dawn':'sunset',sunrise,sunset};}
