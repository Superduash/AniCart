import React from 'react';

export default function BackgroundEffects() {
  const [mousePos, setMousePos] = React.useState({ x: -999, y: -999 });

  React.useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
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
