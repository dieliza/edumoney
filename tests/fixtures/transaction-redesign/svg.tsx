/** Browser adapter for the shared decorative back icon; form controls remain real. */
import type {PropsWithChildren,SVGProps} from 'react';
export default function Svg({children,...props}:PropsWithChildren<SVGProps<SVGSVGElement>>){return <svg {...props}>{children}</svg>;}
export function Path(props:SVGProps<SVGPathElement>){return <path {...props}/>;}
