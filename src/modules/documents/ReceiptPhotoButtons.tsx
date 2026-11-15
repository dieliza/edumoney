import {allowReceiptCamera} from './readerSetup';
import {ReceiptCaptureHero} from '../../ui/ReceiptCaptureHero';
import {View} from 'react-native';
import {ActionButton} from '../../ui/components';
export function ReceiptPhotoButtons({onCapture,presentation='compact',onDictate,onHistory}:{presentation?:'compact'|'hero';onDictate?:()=>void;onHistory?:()=>void;onCapture:(source:'camera'|'library',file?:File)=>void}){
 if(presentation==='hero')return <ReceiptCaptureHero onCamera={()=>{if(allowReceiptCamera())onCapture('camera');}} onGallery={()=>onCapture('library')} onDictate={onDictate} onHistory={onHistory}/>;
 return <View style={{gap:12}}><ActionButton title="Escanear recibo" icon="camera-outline" testID="document-camera" onPress={()=>{if(allowReceiptCamera())onCapture('camera');}}/><ActionButton title="Buscar en fotos" icon="images-outline" testID="document-library" secondary onPress={()=>onCapture('library')}/></View>;
}
