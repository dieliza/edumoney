import {Component,lazy,Suspense,useState,type PropsWithChildren} from 'react';
import {ActionButton,Body,Screen} from '../../../ui/components';
const createScreen=()=>lazy(()=>import('./Screen'));
/** Capture loading and rendering failures without losing navigation or local records. */
export class PayrollBoundary extends Component<PropsWithChildren<{retry?:()=>void}>,{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<Screen back title="Nómina" demo={false}><Body canvas>No pudimos abrir la nómina. Tus registros se conservan.</Body><ActionButton title="Volver a intentar" onPress={()=>{this.props.retry?.();this.setState({failed:false});}}/></Screen>:this.props.children;}
}
export default function PayrollRoute(){const [Page,setPage]=useState(createScreen);return <PayrollBoundary retry={()=>setPage(()=>createScreen())}><Suspense fallback={<Screen back title="Nómina" demo={false}><Body canvas>Abriendo nómina local cifrada…</Body></Screen>}><Page/></Suspense></PayrollBoundary>;}
