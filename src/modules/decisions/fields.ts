import { parseAmount } from '../../core/money';
import { UserInputError } from '../../core/errors';
import { parseRate,type ScenarioInput,type SimulationKind } from './domain';
export interface Draft {kind:SimulationKind;amount:string;down:string;financedFees:string;upfront:string;extra:string;rate:string;months:string;cadence:'monthly'|'weekly'|'annual';opening:string;contribution:string;coverage:string;margin:string}
export const blankDraft=(kind:SimulationKind='vehicle'):Draft=>({kind,amount:'',down:'',financedFees:'',upfront:'',extra:'',rate:'',months:'',cadence:'monthly',opening:'',contribution:'',coverage:'',margin:''});
function whole(value:string,label:string){if(!/^\d+$/.test(value))throw new UserInputError(`Confirma ${label} como número entero.`);return Number(value);}
export function inputScenario(d:Draft):ScenarioInput {
 const loan=['vehicle','home','loan'].includes(d.kind),saving=d.kind==='saving',emergency=d.kind==='emergency';
 const amount=(value:string,label:string)=>{if(!value.trim())throw new UserInputError(`Falta confirmar ${label}. Escribe 0 solo si es cero.`);return parseAmount(value.trim());};
 return {kind:d.kind,amount:saving?0:amount(d.amount,'importe'),down:loan&&d.kind!=='loan'?amount(d.down,'pronto'):0,financedFees:loan?amount(d.financedFees,'cargos financiados'):0,upfront:loan||d.kind==='recurring'?amount(d.upfront,'cargos iniciales'):0,extra:loan?amount(d.extra,'costos adicionales mensuales'):0,rateBps:loan||saving?parseRate(d.rate.trim()):0,months:emergency?0:whole(d.months,'meses'),cadence:d.cadence,opening:saving||emergency?amount(d.opening,'ahorro actual'):0,contribution:saving||emergency?amount(d.contribution,'aportación mensual'):0,coverage:emergency?whole(d.coverage,'meses de cobertura'):0,margin:d.margin.trim()?parseAmount(d.margin.trim()):null};
}
export function draftFrom(p:ScenarioInput):Draft {const money=(n:number)=>`${Math.floor(n/100)}.${String(n%100).padStart(2,'0')}`;return {kind:p.kind,amount:money(p.amount),down:money(p.down),financedFees:money(p.financedFees),upfront:money(p.upfront),extra:money(p.extra),rate:(p.rateBps/100).toFixed(2),months:String(p.months),cadence:p.cadence,opening:money(p.opening),contribution:money(p.contribution),coverage:String(p.coverage),margin:p.margin===null?'':p.margin<0?`-${money(-p.margin)}`:money(p.margin)};}
