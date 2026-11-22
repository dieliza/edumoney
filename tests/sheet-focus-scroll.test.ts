import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {expect,it,vi} from 'vitest';
const scrollSource=readFileSync('node_modules/react-native-web/dist/exports/ScrollView/index.js','utf8');
const parsed=ts.createSourceFile('ScrollView.js',scrollSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
let callback='';function visit(n:ts.Node){if(ts.isBinaryExpression(n)&&n.left.getText(parsed)==='this._handleScroll')callback=n.right.getText(parsed);ts.forEachChild(n,visit);}visit(parsed);
const formSource=readFileSync('src/modules/money/fields.tsx','utf8');
const form=ts.createSourceFile('fields.tsx',formSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let expression='';function find(n:ts.Node){if(ts.isJsxAttribute(n)&&n.name.getText(form)==='keyboardDismissMode'&&n.initializer&&ts.isJsxExpression(n.initializer))expression=n.initializer.expression!.getText(form);ts.forEachChild(n,find);}find(form);
function mode(os:string){return runInNewContext(expression,{Platform:{OS:os}});}
function scroll(dismissMode:string){let focused=true;const dismiss=vi.fn(()=>{focused=false;});const responder=vi.fn();const handler=runInNewContext(`(function(){return ${callback};}).call(receiver)`,{receiver:{props:{keyboardDismissMode:dismissMode},scrollResponderHandleScroll:responder},dismissKeyboard:dismiss,process:{env:{NODE_ENV:'production'}}});handler({nativeEvent:{contentOffset:{y:80}}});return{focused,dismiss,responder};}
it('reproduces the old web focus loss when Safari scrolls a focused amount into view',()=>{const result=scroll('on-drag');expect(result.focused).toBe(false);expect(result.dismiss).toHaveBeenCalledOnce();});
it('keeps the amount focused and forwards automatic scrolling with the actual web form configuration',()=>{expect(mode('web')).toBe('none');const result=scroll(mode('web'));expect(result.focused).toBe(true);expect(result.dismiss).not.toHaveBeenCalled();expect(result.responder).toHaveBeenCalledOnce();});
it('retains native drag-to-dismiss behavior for iOS and Android',()=>{expect(mode('ios')).toBe('on-drag');expect(mode('android')).toBe('on-drag');});
