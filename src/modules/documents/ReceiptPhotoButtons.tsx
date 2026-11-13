import {View} from 'react-native';
import {ActionButton} from '../../ui/components';
export function ReceiptPhotoButtons({onCapture}:{onCapture:(source:'camera'|'library',file?:File)=>void}){
 return <View style={{gap:12}}><ActionButton title="Escanear recibo" icon="camera-outline" testID="document-camera" onPress={()=>onCapture('camera')}/><ActionButton title="Buscar en fotos" icon="images-outline" testID="document-library" secondary onPress={()=>onCapture('library')}/></View>;
}
