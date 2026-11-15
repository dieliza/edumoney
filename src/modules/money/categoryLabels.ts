/** Legacy placeholder names are never inferred as financial categories for new dictations. */
export const isVoicePlaceholder=(name:string)=>/^dictado por voz(?: \(\d+\))?$/i.test(name.trim());
export const categoryDisplayName=(name:string)=>isVoicePlaceholder(name)?'Por clasificar':name;
