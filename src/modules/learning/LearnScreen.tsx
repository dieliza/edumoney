import {LearnHub} from './LearnHub';
import {LearningSection} from './LearningSection';
export default function LearnScreen({debtOnly=false}:{debtOnly?:boolean}={}){return debtOnly?<LearningSection debtOnly/>:<LearnHub/>;}
