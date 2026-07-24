import { useEffect } from 'react';

export default function Spotlight() {
  useEffect(() => {
    let frame = 0;
    let lastX = 0;
    let lastY = 0;

    function onMove(event: MouseEvent) {
      lastX = event.clientX;
      lastY = event.clientY;

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--spotlight-x', `${lastX}px`);
        document.documentElement.style.setProperty('--spotlight-y', `${lastY}px`);
        frame = 0;
      });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="spotlight-layer pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
