import { useEffect, useLayoutEffect, useState } from 'react';

export function readSheetViewport(viewport: Pick<VisualViewport, 'height' | 'offsetTop'>) {
  return { height: Math.max(1, viewport.height), top: Math.max(0, viewport.offsetTop) };
}

/** Scroll only the sheet body; never pan the page or change keyboard focus. */
export function revealSheetInput() {
  const input = document.activeElement;
  if (!(input instanceof HTMLElement) || !input.matches('input,textarea,[contenteditable="true"]')) return;
  const scroller = input.closest<HTMLElement>('[data-testid="sheet-scroll"]');
  if (!scroller) return;
  const field = input.getBoundingClientRect(), area = scroller.getBoundingClientRect();
  const top = area.top + 12, bottom = area.bottom - 12;
  if (field.bottom > bottom) scroller.scrollTop += field.bottom - bottom;
  else if (field.top < top) scroller.scrollTop -= top - field.top;
}

export function useSheetViewport() {
  const [viewport, setViewport] = useState<{ height: number; top: number }>();
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const visible = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readSheetViewport(visible);
        setViewport(previous => previous?.height === next.height && previous.top === next.top ? previous : next);
        revealSheetInput();
      });
    };
    update();
    visible.addEventListener('resize', update);
    visible.addEventListener('scroll', update);
    document.addEventListener('focusin', update);
    return () => {
      cancelAnimationFrame(frame);
      visible.removeEventListener('resize', update);
      visible.removeEventListener('scroll', update);
      document.removeEventListener('focusin', update);
    };
  }, []);
  useLayoutEffect(() => {
    if (!viewport) return;
    revealSheetInput();
  }, [viewport]);
  return viewport;
}
