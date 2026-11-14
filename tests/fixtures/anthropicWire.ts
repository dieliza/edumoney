import {ANTHROPIC_READING_SCHEMA} from '../../web-server/anthropic-reader.mjs';
/** Fixture: el proveedor responde campos primitivos desconocidos como [], conocidos como [valor]. */
export function asAnthropicWire(value:unknown,schema:Record<string,any>=ANTHROPIC_READING_SCHEMA):any{
 if(Array.isArray(schema.type)&&schema.type.includes('null'))return value===null?[]:[value];
 if(schema.type==='object'&&value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key in schema.properties).map(([key,v])=>[key,asAnthropicWire(v,schema.properties[key])]));
 if(schema.type==='array'&&Array.isArray(value))return value.map(v=>asAnthropicWire(v,schema.items));
 return value;
}
