export type WheelOption=readonly [string,string];
export function wheelIndex(offset:number,length:number,rowHeight=48){if(!length)return 0;return Math.max(0,Math.min(length-1,Math.round((Number.isFinite(offset)?offset:0)/rowHeight)));}
export function wheelWindow(index:number,length:number,radius=10){return {start:Math.max(0,index-radius),end:Math.min(length,index+radius+1)};}
export function wheelKey(key:string,index:number,length:number){return Math.max(0,Math.min(Math.max(0,length-1),key==='Home'?0:key==='End'?length-1:index+({ArrowDown:1,ArrowUp:-1,PageDown:5,PageUp:-5}[key]??0)));}
