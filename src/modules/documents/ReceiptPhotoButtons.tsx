import {ReceiptCaptureHero} from '../../ui/ReceiptCaptureHero';
import {View} from 'react-native';
import {ActionButton} from '../../ui/components';
export function ReceiptPhotoButtons({onCapture,presentation='compact',onDictate}:{presentation?:'compact'|'hero';onDictate?:()=>void;onCapture:(source:'camera'|'library',file?:File)=>void}){
 if(presentation==='hero')return <ReceiptCaptureHero onCamera={()=>onCapture('camera')} onGallery={()=>onCapture('library')} onDictate={onDictate}/>;
 return <View style={{gap:12}}><ActionButton title="Escanear recibo" icon="camera-outline" testID="document-camera" onPress={()=>onCapture('camera')}/><ActionButton title="Buscar en fotos" icon="images-outline" testID="document-library" secondary onPress={()=>onCapture('library')}/></View>;
}
