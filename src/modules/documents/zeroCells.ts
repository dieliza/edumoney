import type {PhotoReading} from './photoReadings';
/** Busca una celda médica sin importe a la derecha del rótulo y antes del encabezado anual. */
export function zeroCellTargets(readings:PhotoReading[],width:number,height:number){
 const fragments=readings.flatMap(r=>r.rows.flatMap(row=>row.fragments??[]));
 const year=fragments.find(f=>/YEAR TO DATE/i.test(f.text));if(!year)return [];
 const found:{left:number;top:number;width:number;height:number;y:number}[]=[];
 for(const row of readings.flatMap(r=>r.rows)){const label=row.fragments?.find(f=>/MED\.?\s*INS\.?\s*$/i.test(f.text));if(!label||!label.width||label.x>=year.x)continue;if(found.some(t=>Math.abs(t.y-row.y)<row.height/2))continue;
 const left=Math.ceil(label.x+label.width+5),right=Math.min(width,Math.floor(year.x-6)),top=Math.max(0,Math.floor(row.y-row.height*.95)),bottom=Math.min(height,Math.ceil(row.y+row.height*.95));if(right-left<12||bottom<=top)continue;found.push({left,top,width:right-left,height:bottom-top,y:row.y});
 }return found.slice(0,2);
}
/** Elimina reglas largas de la tabla; no dibuja ni reconstruye glifos. */
export function clearCellRules(pixels:Uint8ClampedArray,width:number,height:number){
 const result=new Uint8ClampedArray(pixels),columns:number[]=[],rows:number[]=[];
 const dark=(x:number,y:number)=>{const p=(y*width+x)*4;return (pixels[p]+pixels[p+1]+pixels[p+2])/3<140;};
 for(let x=0;x<width;x++){let n=0;for(let y=0;y<height;y++)if(dark(x,y))n++;if(n>height*.7)columns.push(x);}
 for(let y=0;y<height;y++){let n=0;for(let x=0;x<width;x++)if(dark(x,y))n++;if(n>width*.7)rows.push(y);}
 const erase=(x:number,y:number)=>{const p=(y*width+x)*4;result[p]=result[p+1]=result[p+2]=result[p+3]=255;};
 for(const x of columns)for(let y=0;y<height;y++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<width)erase(x+dx,y);
 for(const y of rows)for(let x=0;x<width;x++)for(let dy=-1;dy<=1;dy++)if(y+dy>=0&&y+dy<height)erase(x,y+dy);
 const visited=new Uint8Array(width*height);const glyphs:{left:number;top:number;right:number;bottom:number;size:number}[]=[];
 const isInk=(p:number)=>(result[p*4]+result[p*4+1]+result[p*4+2])/3<140;
 for(let p=0;p<visited.length;p++){if(visited[p]||!isInk(p))continue;const stack=[p];visited[p]=1;let left=width,right=0,top=height,bottom=0,size=0;
 while(stack.length){const at=stack.pop()!,x=at%width,y=Math.floor(at/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);size++;for(const n of [x>0?at-1:-1,x+1<width?at+1:-1,y>0?at-width:-1,y+1<height?at+width:-1])if(n>=0&&!visited[n]&&isInk(n)){visited[n]=1;stack.push(n);}}
 const w=right-left+1,h=bottom-top+1;if(size>=8&&h>=height*.25&&w>=3&&w/h>=.2&&w/h<=1.3&&left>0&&right<width-1)glyphs.push({left,right,top,bottom,size});
 }
 if(glyphs.length!==1)return {pixels:result,width,height,hasInk:false};
 const g=glyphs[0],w=g.right-g.left+9,h=g.bottom-g.top+9,cropped=new Uint8ClampedArray(w*h*4).fill(255);
 for(let y=g.top;y<=g.bottom;y++)for(let x=g.left;x<=g.right;x++){const from=(y*width+x)*4,to=((y-g.top+4)*w+x-g.left+4)*4;cropped.set(result.subarray(from,from+4),to);}
 return {pixels:cropped,width:w,height:h,hasInk:true};
}
export function addVerifiedZero(readings:PhotoReading[],y:number){for(const r of readings)for(const row of r.rows)if(Math.abs(row.y-y)<row.height/2&&/MED\.?\s*INS/i.test(row.text))row.verifiedZero=true;}
