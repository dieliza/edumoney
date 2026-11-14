import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {ReceiptReaderSettings} from '../src/modules/documents/ReceiptReaderSettings.web';
import {activateAnthropic,activateLocalReader,readerSnapshot} from '../src/web/anthropicSession';
const ui=vi.hoisted(()=>({slots:[] as unknown[],index:0,buttons:new Map<string,()=>void>(),fields:new Map<string,{value:string;onChange(v:string):void}>(),connect:vi.fn(),remove:vi.fn(),restore:vi.fn()}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useEffect:()=>{},useState:(initial:unknown)=>{const index=ui.index++;if(index>=ui.slots.length)ui.slots[index]=index===4?false:typeof initial==='function'?initial():initial;return [ui.slots[index],(v:unknown)=>{ui.slots[index]=typeof v==='function'?v(ui.slots[index]):v;}];},useSyncExternalStore:(_subscribe:unknown,snapshot:()=>unknown)=>snapshot()};});
vi.mock('react-native',()=>({Linking:{openURL:vi.fn()}}));vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('../src/web/anthropicConnection',()=>({connectAnthropic:ui.connect,disconnectAnthropic:ui.remove,restoreAnthropicConnection:ui.restore}));
vi.mock('../src/modules/documents/ApiKeyField.web',()=>({ApiKeyField:({value,onChange}:{value:string;onChange(v:string):void})=>{ui.fields.set('api',{value,onChange});return React.createElement('input',{type:'text',value,readOnly:true});}}));
vi.mock('../src/ui/components',()=>({Card:({children}:{children:React.ReactNode})=>React.createElement('div',null,children),Body:({children}:{children:React.ReactNode})=>React.createElement('p',null,children),ActionButton:({title,onPress}:{title:string;onPress():void})=>{ui.buttons.set(title,onPress);return React.createElement('button',null,title);}}));
vi.mock('../src/modules/money/fields',()=>({ErrorNotice:({message}:{message:string})=>React.createElement('p',null,message)}));
function render(){ui.index=0;ui.buttons.clear();ui.fields.clear();return renderToStaticMarkup(React.createElement(ReceiptReaderSettings));}
async function settle(){for(let i=0;i<5;i++)await Promise.resolve();return render();}
function paste(value:string){ui.fields.get('api')!.onChange(value);render();}
const key='sk-ant-CLAVE_FICTICIA_1234567890';
beforeEach(()=>{ui.connect.mockImplementation(async k=>{activateAnthropic(k);});ui.remove.mockImplementation(async()=>{activateLocalReader();});});
afterEach(()=>{activateLocalReader();ui.slots=[];ui.index=0;ui.buttons.clear();ui.fields.clear();vi.clearAllMocks();});
it('una sola clave y un botón verifican y guardan sin pedir cambio de contraseña',async()=>{const html=render();expect(html.match(/<input/g)).toHaveLength(1);expect(html).not.toMatch(/Contraseña actual|Nueva contraseña|Corroborar/);paste(key);ui.buttons.get('Activar Anthropic')!();expect(await settle()).toContain('Conexión verificada y clave guardada');expect(ui.connect).toHaveBeenCalledWith(key);expect(readerSnapshot()).toBe('anthropic');expect(ui.fields.size).toBe(0);});
it('un error conserva la API escrita y permite reintentar',async()=>{ui.connect.mockRejectedValueOnce(Error('Clave rechazada'));render();paste(key);ui.buttons.get('Activar Anthropic')!();expect(await settle()).toContain('Clave rechazada');expect(ui.fields.get('api')!.value).toBe(key);ui.buttons.get('Activar Anthropic')!();expect(await settle()).toContain('Conexión verificada');});
it('una conexión guardada muestra acceso a fotos sin pedir otra clave',()=>{activateAnthropic(key);expect(render()).toContain('Conectado · Haiku 5.5');expect(ui.fields.size).toBe(0);expect(ui.buttons.has('Tomar o elegir foto')).toBe(true);expect(ui.buttons.has('Cambiar clave de API')).toBe(true);});
it('borrar la conexión vuelve al campo único sin cambiar la contraseña de EduMoney',async()=>{activateAnthropic(key);render();ui.buttons.get('Desconectar y borrar clave guardada')!();expect(await settle()).toContain('clave borrada');expect(ui.remove).toHaveBeenCalledOnce();expect(readerSnapshot()).toBe('local');expect(ui.fields.size).toBe(1);});
