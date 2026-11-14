export interface EducationSource{id:string;organization:string;title:string;url:string;verifiedAt:string;evidence:string}
export interface EducationTip{id:string;version:number;title:string;body:string;example:string;sourceIds:string[];question:string;options:string[];correct:number;explanation:string;verifiedAt:string}
export interface EducationCatalog{version:1;cycleId:string;startsAt:string;nextAt:string;current:EducationTip[];history:EducationTip[];sources:EducationSource[];notice?:string}
export interface EducationAward{id:string;badgeId:string;title:string;symbol:string;earnedAt:string;basis:string;celebratedAt:string|null}
export interface EducationProgress{tipId:string;version:number;readAt:string|null;learnedAt:string|null}
export interface EducationSnapshot{progress:EducationProgress[];awards:EducationAward[];learned:number;animations:boolean}
export const educationBadges=[{id:'learn-10',count:10,symbol:'✏️',title:'Primer paso'},{id:'learn-20',count:20,symbol:'🍎',title:'Buen estudiante'},{id:'learn-30',count:30,symbol:'📚',title:'Aprendiz destacado'},{id:'learn-50',count:50,symbol:'🎓',title:'Graduado financiero'},{id:'learn-80',count:80,symbol:'🏅',title:'Alto honor'},{id:'learn-120',count:120,symbol:'🏆',title:'Maestro financiero'}] as const;
