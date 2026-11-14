import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {ReceiptReaderSettings} from '../src/modules/documents/ReceiptReaderSettings.web';
import {activateLocalReader,anthropicSessionKey,readerSnapshot} from '../src/web/anthropicSession';
const ui=vi.hoisted(()=>({slots:[] as unknown[],index:0,buttons:new Map<string,()=>void>(),fields:new Map<string,{value:string;onChangeText(v:string):void}>()}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:(initial:unknown)=>{const index=ui.index++;if(index>=ui.slots.length)ui.slots[index]=typeof initial==='function'?initial():initial;return [ui.slots[index],(v:unknown)=>{ui.slots[index]=typeof v==='function'?v(ui.slots[index]):v;}];},useSyncExternalStore:(_subscribe:unknown,snapshot:()=>unknown)=>snapshot()};});
vi.mock('react-native',()=>({Linking:{openURL:vi.fn()}}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('../src/ui/components',()=>({Card:({children}:{children:React.ReactNode})=>React.createElement('div',null,children),Body:({children}:{children:React.ReactNode})=>React.createElement('p',null,children),ActionButton:({title,onPress}:{title:string;onPress():void})=>{ui.buttons.set(title,onPress);return React.createElement('button',null,title);}}));
vi.mock('../src/modules/money/fields',()=>({ErrorNotice:({message}:{message:string})=>React.createElement('p',null,message),Field:({label,value,onChangeText}:{label:string;value:string;onChangeText(v:string):void})=>{ui.fields.set(label,{value,onChangeText});return React.createElement('input',{type:'password',value,readOnly:true});}}));
function render(){ui.index=0;ui.buttons.clear();ui.fields.clear();return renderToStaticMarkup(React.createElement(ReceiptReaderSettings));}
function paste(value:string){ui.fields.get('Clave propia de Anthropic')!.onChangeText(value);render();}
const activate=()=>ui.buttons.get('Activar Haiku 5.5 en esta sesión')!();
afterEach(()=>{activateLocalReader();ui.slots=[];ui.index=0;ui.buttons.clear();ui.fields.clear();vi.unstubAllGlobals();});
it('pegar una clave y pulsar activar funciona sin la selección desplegable que impedía continuar',()=>{const network=vi.fn();vi.stubGlobal('fetch',network);render();paste('sk-ant-CLAVE_FICTICIA_1234567890');activate();const html=render();expect(readerSnapshot()).toBe('anthropic');expect(anthropicSessionKey()).toBe('sk-ant-CLAVE_FICTICIA_1234567890');expect(html).toContain('Clave preparada');expect(html).toContain('comprobará la clave y el saldo');expect(html).not.toContain('Pendiente de configurar');expect(ui.fields.get('Clave propia de Anthropic')!.value).toBe('');expect(network).not.toHaveBeenCalled();});
it('una clave incompleta muestra error y conserva lo escrito para corregirlo',()=>{render();paste('sk-ant-incompleta');activate();expect(render()).toContain('Introduce una clave válida');expect(readerSnapshot()).toBe('local');expect(ui.fields.get('Clave propia de Anthropic')!.value).toBe('sk-ant-incompleta');});
it('corregir la clave elimina el error anterior y permite activarla',()=>{render();activate();render();paste('sk-ant-CLAVE_FICTICIA_1234567890');expect(render()).not.toContain('Introduce una clave válida');activate();expect(render()).toContain('Clave preparada');expect(readerSnapshot()).toBe('anthropic');});
it('retirar la clave vuelve al modo local y elimina la clave de memoria',()=>{render();paste('sk-ant-CLAVE_FICTICIA_1234567890');activate();render();ui.buttons.get('Usar lectura local y retirar la clave')!();expect(render()).toContain('Lectura local activada');expect(readerSnapshot()).toBe('local');expect(()=>anthropicSessionKey()).toThrow('Activa Anthropic');});
