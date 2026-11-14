/** Presentación únicamente: no clasifica ni modifica categorías o movimientos. */
export function categoryAppearance(id:string,name:string){const text=`${id} ${name}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/comida|food|restaur|alimento/.test(text))return {icon:'restaurant-outline' as const,color:'#F39316'};
 if(/transport|auto|gasolina|combust/.test(text))return {icon:'car-outline' as const,color:'#1489E8'};
 if(/vivienda|house|housing|casa|alquiler/.test(text))return {icon:'home-outline' as const,color:'#8855DE'};
 if(/salud|health|medic/.test(text))return {icon:'heart-outline' as const,color:'#E44782'};
 if(/servicio|utilit|luz|agua/.test(text))return {icon:'flash-outline' as const,color:'#10A28A'};
 if(/entreten|ocio/.test(text))return {icon:'ticket-outline' as const,color:'#E84C98'};
 const palette=['#198E93','#7754C8','#C65C27','#3478B8','#C04477','#2E8A56'];let hash=0;for(const char of id)hash=(hash*31+char.charCodeAt(0))>>>0;return {icon:'pricetag-outline' as const,color:palette[hash%palette.length]};
}
