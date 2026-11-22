import { useEffect, useState } from 'react';

export function readSheetViewport(viewport: Pick<VisualViewport, 'height' | 'offsetTop'>) {
  return { height: Math.max(1, viewport.height), top: Math.max(0, viewport.offsetTop) };
}

/** Follow Safari's visible area without scrolling or refocusing the input. */
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
      });
    };
    update();
    visible.addEventListener('resize', update);
    visible.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      visible.removeEventListener('resize', update);
      visible.removeEventListener('scroll', update);
    };
  }, []);
  return viewport;
}
