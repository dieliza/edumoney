import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {LoginPasswordField} from '../src/ui/LoginPasswordField.web';
vi.mock('../src/design/ThemeProvider',()=>({useTheme:()=>({colors:{line:'#ccc',text:'#111',surfaceAlt:'#fff',primary:'#086',surface:'#fff'}})}));
it('el campo web tiene etiqueta tocable, tamaño cómodo y autocompletado de acceso',()=>{const html=renderToStaticMarkup(React.createElement(LoginPasswordField,{name:'password',label:'Contraseña de EduMoney',value:'',onChange:()=>{}}));expect(html).toContain('for="edumoney-login-password"');expect(html).toContain('id="edumoney-login-password"');expect(html).toContain('name="password"');expect(html).toContain('type="password"');expect(html).toContain('autoComplete="current-password"');expect(html).toContain('min-height:56px');expect(html).not.toMatch(/disabled|readonly|autoComplete="new-password"/);expect(html).toContain('type="button"');expect(html).toContain('Mostrar contraseña');});
it('solo crear un espacio usa el autocompletado de contraseña nueva',()=>{const html=renderToStaticMarkup(React.createElement(LoginPasswordField,{name:'password',label:'Crea una contraseña',value:'',onChange:()=>{},newPassword:true}));expect(html).toContain('autoComplete="new-password"');});
