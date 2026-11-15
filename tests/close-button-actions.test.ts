import {expect,it,vi,beforeEach} from 'vitest';
import {CloseButton} from '../src/ui/CloseButton.web';
const keyboard=vi.hoisted(()=>({dismiss:vi.fn()}));
vi.mock('react-native',()=>({Keyboard:keyboard}));
beforeEach(()=>vi.clearAllMocks());
it('la X cierra el estado del submenú en el mismo clic, aunque haya un campo activo',()=>{
 let open=true;const close=vi.fn(()=>{open=false;}),stopPropagation=vi.fn();const button=CloseButton({onPress:close,label:'Cerrar opciones'});
 button.props.onClick({stopPropagation});expect(open).toBe(false);expect(close).toHaveBeenCalledOnce();expect(keyboard.dismiss).toHaveBeenCalledOnce();expect(stopPropagation).toHaveBeenCalledOnce();
});
it('no envía formularios ni deja que el toque de cierre reactive el selector padre',()=>{
 const close=vi.fn(),stopPropagation=vi.fn();const button=CloseButton({onPress:close,testID:'submenu-close'});
 expect(button.type).toBe('button');expect(button.props.type).toBe('button');expect(button.props['aria-label']).toBe('Cerrar ficha');
 button.props.onPointerDown({stopPropagation});expect(close).not.toHaveBeenCalled();button.props.onClick({stopPropagation});expect(stopPropagation).toHaveBeenCalledTimes(2);expect(close).toHaveBeenCalledOnce();
});
