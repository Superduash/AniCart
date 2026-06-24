import React from 'react';

export default function BackgroundEffects() {
  const [mousePos, setMousePos] = React.useState({ x: -999, y: -999 });

  React.useEffect(() => {
    let rafId = null;
    let pendingX = -999, pendingY = -999;

    // L2 Fix: throttle mousemove with requestAnimationFrame to avoid setState on every pixel
    const handler = (e) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId !== null) return; // already scheduled
      rafId = requestAnimationFrame(() => {
        setMousePos({ x: pendingX, y: pendingY });
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
      <div className="cursor-glow" aria-hidden="true" style={{ left: mousePos.x, top: mousePos.y }} />
      <div className="starfield" aria-hidden="true" />
      <div className="nebula" aria-hidden="true">
        <div className="nebula-blob" />
        <div className="nebula-blob" />
        <div className="nebula-blob" />
      </div>
    </>
  );
}
