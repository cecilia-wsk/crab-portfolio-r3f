import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const RIPPLE_SPEED = 0.3;
const RIPPLE_PEAK = 0.2;
const easeOutQuart = (t) => 1 - --t * t * t * t;
const linear = (t) => t;

export default function RippleOverlay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const ripples = [];
    let wasRendering = false;
    let rafId = 0;
    let lastTime = performance.now();

    ctx.globalCompositeOperation = 'screen';

    const handleClick = (e) => {
      ripples.push({
        age: 0,
        x: e.clientX,
        y: e.clientY,
        r: (e.clientX / window.innerWidth) * 255,
        g: (e.clientY / window.innerHeight) * 255,
      });
    };

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.globalCompositeOperation = 'screen';
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    const draw = (time) => {
      rafId = requestAnimationFrame(draw);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (ripples.length > 0) {
        wasRendering = true;
        ctx.clearRect(0, 0, w, h);

        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.age += delta * RIPPLE_SPEED;
          if (r.age > 1) {
            ripples.splice(i, 1);
            continue;
          }

          const sz = h * easeOutQuart(r.age);
          const alpha =
            r.age < RIPPLE_PEAK
              ? easeOutQuart(r.age / RIPPLE_PEAK)
              : 1 - linear((r.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK));

          const grd = ctx.createRadialGradient(
            r.x,
            r.y,
            sz * 0.25,
            r.x,
            r.y,
            sz * 0.5
          );
          grd.addColorStop(1, 'rgba(128,128,0,0)');
          grd.addColorStop(
            0.8,
            `rgba(${r.r}, ${r.g}, ${10 * alpha}, ${alpha * 0.6})`
          );
          grd.addColorStop(0, 'rgba(0,0,0,0)');

          ctx.beginPath();
          ctx.fillStyle = grd;
          ctx.arc(r.x, r.y, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (wasRendering) {
        ctx.clearRect(0, 0, w, h);
        wasRendering = false;
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="ripple-overlay" />;
}
