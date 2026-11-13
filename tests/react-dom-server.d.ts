/** API de renderizado estático utilizada por las pruebas de atributos HTML. */
declare module 'react-dom/server' {
 import type {ReactNode} from 'react';
 export function renderToStaticMarkup(element:ReactNode):string;
}
