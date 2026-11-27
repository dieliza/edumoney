import {useEffect,useState} from 'react';
import {router} from 'expo-router';
import {ActionButton,Body} from '../../ui/components';
import {download} from '../../web/files';
import {localToday} from '../money/domain';
import {goalCalendarFile} from './calendar';
import {getGoalReminderStatus,subscribeGoalReminders,requestGoalReminders} from './reminders';
import type {Goal} from './types';
export function GoalReminderStatus({title='Activar recordatorios de metas'}:{title?:string}={}){const[status,setStatus]=useState(getGoalReminderStatus);useEffect(()=>subscribeGoalReminders(()=>setStatus(getGoalReminderStatus())),[]);return <><Body>{status.message}</Body>{!status.enabled?<ActionButton title={title} secondary onPress={()=>{void requestGoalReminders();}}/>:null}</>;}
export function GoalDateTools({goal}:{goal:Goal}){const[notice,setNotice]=useState('');return <><ActionButton title="Ver calendario de aportaciones" secondary onPress={()=>router.push({pathname:'/bills',params:{view:'calendar'}})}/><ActionButton title="Guardar fechas en mi calendario" secondary onPress={()=>{const file=goalCalendarFile(goal,localToday());if(!file.count){setNotice('No hay fechas futuras pendientes para copiar.');return;}download(file.text,'EduMoney-aportaciones.ics','text/calendar');setNotice('Fechas preparadas con recordatorio a las 9:00. Abre el archivo y confirma guardarlo en tu calendario. Esa copia externa no se actualiza al cambiar la meta.');}}/>{notice?<Body>{notice}</Body>:null}</>;}
