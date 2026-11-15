import {allowReceiptCamera} from './readerSetup';
import {ReceiptCaptureHero} from '../../ui/ReceiptCaptureHero';
import {useRef} from 'react';
import {View} from 'react-native';
import {ActionButton} from '../../ui/components';
import {openReceiptInput,receiveReceiptFile} from '../../web/receiptPicker';
type Props={onCapture:(source:'camera'|'library',file?:File)=>void;presentation?:'compact'|'hero';onDictate?:()=>void;onHistory?:()=>void};
/** Patrón de BudgetAddMenu.jsx, pr-fun-explore@3d108af34a6b3b13b7556ab5866a42ed8ff66b7c. */
export function ReceiptPhotoButtons({onCapture,presentation='compact',onDictate,onHistory}:Props){
 const camera=useRef<HTMLInputElement>(null),gallery=useRef<HTMLInputElement>(null);
 const hidden={position:'absolute' as const,width:1,height:1,overflow:'hidden' as const,clipPath:'inset(50%)',opacity:0,pointerEvents:'none' as const};
 return <View style={{gap:12}}>
  {presentation==='hero'?<ReceiptCaptureHero onCamera={()=>{if(allowReceiptCamera())openReceiptInput(camera.current);}} onGallery={()=>openReceiptInput(gallery.current)} onDictate={onDictate} onHistory={onHistory}/>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}><View style={{flex:1,minWidth:150}}><ActionButton title="Escanear recibo" icon="camera-outline" testID="document-camera" onPress={()=>{if(allowReceiptCamera())openReceiptInput(camera.current);}}/></View><View style={{flex:1,minWidth:150}}><ActionButton title="Buscar en fotos" icon="images-outline" testID="document-library" secondary onPress={()=>openReceiptInput(gallery.current)}/></View></View>}
  <input ref={camera} type="file" accept="image/*" capture="environment" tabIndex={-1} aria-hidden="true" style={hidden} data-testid="receipt-camera-input" onChange={event=>receiveReceiptFile(event.currentTarget,file=>onCapture('camera',file))}/>
  <input ref={gallery} type="file" accept="image/*" tabIndex={-1} aria-hidden="true" style={hidden} data-testid="receipt-gallery-input" onChange={event=>receiveReceiptFile(event.currentTarget,file=>onCapture('library',file))}/>
 </View>;
}
