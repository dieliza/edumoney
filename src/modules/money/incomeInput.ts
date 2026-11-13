import { UserInputError } from '../../core/errors';
import { cents,parseAmount,type Cents } from '../../core/money';
export function incomeFromBreakdown(gross:string,withholding:string,previous?:Cents):Cents {
 if(!gross.trim()&&!withholding.trim()&&previous!==undefined)return previous;
 if(!gross.trim()||!withholding.trim())throw new UserInputError('Completa ingreso bruto y retención. Si no hubo retención, escribe 0.00; un blanco no significa cero.');
 const total=parseAmount(gross.trim()),tax=parseAmount(withholding.trim());
 if(total<=0||tax<0||tax>=total)throw new UserInputError('Revisa el bruto y la retención: el ingreso neto debe ser positivo.');
 return cents(total-tax);
}
