import {router} from 'expo-router';
import {ActionButton,Body} from '../../ui/components';
import {requestGoalReminders} from './reminders';
import type {Goal} from './types';
export function GoalReminderStatus({title='Activar recordatorios de metas'}:{title?:string}={}){return <><Body>Las fechas de tus metas están en Calendario.</Body><ActionButton title={title} secondary onPress={()=>{void requestGoalReminders();}}/></>;}
export function GoalDateTools(_props:{goal:Goal}){return <ActionButton title="Ver calendario de aportaciones" secondary onPress={()=>router.push({pathname:'/bills',params:{view:'calendar'}})}/>;}
