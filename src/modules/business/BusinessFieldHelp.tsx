import { useContext, useEffect, useRef, useState, type ComponentRef, type PropsWithChildren } from 'react';
import { AccessibilityInfo, findNodeHandle, Keyboard, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { Body, CloseButton } from '../../ui/components';
import { SheetOverlayContext } from '../../ui/SheetOverlay';

export type BusinessHelp = { text: string; source?: `https://${string}`; sourceLabel?: string };

function HelpPanel({ label, help, close }: { label: string; help: BusinessHelp; close: () => void }) {
  const { colors } = useTheme();
  const heading = useRef<ComponentRef<typeof View>>(null);
  const dialog = useRef<ComponentRef<typeof View>>(null);
  const [sourceFailed, setSourceFailed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (Platform.OS === 'web') heading.current?.focus();
      else {
        const handle = findNodeHandle(heading.current);
        if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      }
    });
    if (Platform.OS !== 'web') return () => cancelAnimationFrame(frame);
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      } else if (event.key === 'Tab') {
        const node = dialog.current as unknown as HTMLElement | null;
        const targets = node ? Array.from(node.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="link"]'))
          .filter(el => el.tabIndex >= 0 && !el.hasAttribute('disabled')) : [];
        if (!targets.length) return;
        const index = targets.indexOf(document.activeElement as HTMLElement);
        const next = index < 0 ? (event.shiftKey ? targets.length - 1 : 0)
          : (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
        event.preventDefault();
        targets[next].focus();
      }
    };
    document.addEventListener('keydown', onEscape, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', onEscape, true); };
  }, [close]);
  function openSource() {
    const url = help.source;
    if (url) void Linking.openURL(url).catch(() => setSourceFailed(true));
  }
  return <View ref={dialog} style={styles.backdrop} accessibilityViewIsModal aria-modal={true} role="dialog"
    accessibilityLabel={`Ayuda: ${label}`}>
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <View ref={heading} accessible accessibilityRole="header" tabIndex={-1} style={styles.heading}>
          <Body style={{ fontSize: 17, fontWeight: '700' }}>{label}</Body>
        </View>
        <CloseButton testID="business-help-close" label="Cerrar explicación" onPress={close}/>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        <Body>{help.text}</Body>
        {help.source ? <Pressable onPress={openSource} accessibilityRole="link" style={styles.trigger}>
          <Body style={[styles.link, {color: colors.primary, textDecorationLine: 'underline'}]}>
            {help.sourceLabel ?? 'Ver fuente oficial'}
          </Body>
        </Pressable> : null}
        {sourceFailed ? <View accessibilityRole="alert"><Body>No pude abrir la fuente. Puedes volver a intentarlo.</Body></View> : null}
      </ScrollView>
    </View>
  </View>;
}

/** The explanation is absent from the page until opened; opening never edits a field. */
export function BusinessFieldHelp({ label, help, testID, children }: PropsWithChildren<{
  label: string;
  help: BusinessHelp;
  testID?: string;
}>) {
  const { colors } = useTheme();
  const host = useContext(SheetOverlayContext);
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const restoreFocus = () => requestAnimationFrame(() => {
    if (Platform.OS === 'web') trigger.current?.focus();
    else {
      const handle = findNodeHandle(trigger.current);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    }
  });
  const close = () => { setOpen(false); restoreFocus(); };
  const show = () => {
    Keyboard.dismiss();
    if (host) host.show(<HelpPanel label={label} help={help} close={host.close}/>, restoreFocus);
    else setOpen(true);
  };
  const button = <Pressable ref={trigger} accessibilityRole="button"
    accessibilityLabel={`¿Qué significa ${label}?`} testID={testID} onPress={show} style={styles.trigger}>
    <Body style={[styles.link, {color: colors.primary}]}>¿Qué significa?</Body>
  </Pressable>;
  return <>
    {children ? <View style={styles.group}>{children}{button}</View> : button}
    {open && !host ? <Modal transparent animationType="none" onRequestClose={close}>
      <HelpPanel label={label} help={help} close={close}/>
    </Modal> : null}
  </>;
}

const styles = StyleSheet.create({
  group: { alignSelf: 'stretch', gap: 0 },
  trigger: { alignSelf: 'flex-end', justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  link: { fontSize: 13, fontWeight: '600', lineHeight: 18, flexShrink: 1 },
  backdrop: { ...StyleSheet.absoluteFill, zIndex: 99, elevation: 24, justifyContent: 'center',
    alignItems: 'center', padding: 18, backgroundColor: fixed.previewBackdrop },
  panel: { width: '100%', maxWidth: 450, maxHeight: '88%', borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  heading: { flex: 1, minWidth: 0, alignSelf: 'center' },
});
