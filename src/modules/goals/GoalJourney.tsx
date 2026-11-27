import {Body} from '../../ui/components';
import type {Goal} from './types';
export function GoalJourney({goal}:{goal:Goal;animate?:boolean}){return <Body>{goal.savedCents>=goal.targetCents?'¡Lo lograste!':'Ahorro confirmado para '+goal.name}</Body>;}
