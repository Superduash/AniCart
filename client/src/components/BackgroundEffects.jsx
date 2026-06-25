import React, { useEffect, useRef } from 'react';

export default function BackgroundEffects() {
  const glowRef = useRef(null);

  useEffect(() => {
    let rafId = null;
    let pendingX = -999, pendingY = -999;

    const handler = (e) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.transform = `translate(calc(${pendingX}px - 50%), calc(${pendingY}px - 50%))`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handler, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handler);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div className="scanline" aria-hidden="true" />
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div className="starfield" aria-hidden="true" />
      <div className="nebula" aria-hidden="true">
        <div className="nebula-blob" />
        <div className="nebula-blob" />
        <div className="nebula-blob" />
      </div>
    </>
  );
}
