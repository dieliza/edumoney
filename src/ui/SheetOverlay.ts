import { createContext, type ReactNode } from 'react';

/** Place a temporary panel in the current sheet, rather than opening a second native modal. */
export const SheetOverlayContext = createContext<{
  show(panel: ReactNode, onClose: () => void): void;
  close(): void;
} | null>(null);
