import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RipplePostEffect } from '../effects/RipplePostEffect';

const RIPPLE_SPEED = 0.3;
const RIPPLE_PEAK = 0.1;
const easeOutQuart = (t) => 1 - --t * t * t * t;
const linear = (t) => t;

/**
 * RippleEffect
 * Manages the offscreen 2D canvas that encodes click-driven ripple data and
 * registers the post-processing <RipplePostEffect> inside <EffectComposer>.
 */
export default function RippleEffect() {
  const stateRef = useRef(null);
  const dprRef = useRef(Math.min(window.devicePixelRatio, 2));

  // Create the offscreen canvas and texture once during mount
  const { texture } = useMemo(() => {
    const dpr = dprRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(128, 128, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    stateRef.current = {
      canvas,
      ctx,
      texture,
      ripples: [],
      wasRendering: false,
    };

    return { texture };
  }, []);

  // Click & resize handlers
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const handleClick = (e) => {
      const u = e.clientX / window.innerWidth;
      const v = e.clientY / window.innerHeight;
      state.ripples.push({
        age: 0,
        color: new THREE.Vector2(u * 255, v * 255),
      });
    };

    const handleResize = () => {
      const dpr = dprRef.current;
      const nw = Math.floor(window.innerWidth * dpr);
      const nh = Math.floor(window.innerHeight * dpr);
      state.canvas.width = nw;
      state.canvas.height = nh;
      state.ctx.fillStyle = 'rgb(128, 128, 0)';
      state.ctx.fillRect(0, 0, nw, nh);
      state.texture.needsUpdate = true;
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      state.texture.dispose();
      stateRef.current = null;
    };
  }, []);

  // Draw active ripples into the offscreen canvas each frame
  useFrame((_state, delta) => {
    const st = stateRef.current;
    if (!st) return;

    const { canvas, ctx, texture: tex, ripples } = st;

    if (ripples.length > 0) {
      st.wasRendering = true;
      ctx.fillStyle = 'rgb(128, 128, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.age += delta * RIPPLE_SPEED;
        if (ripple.age > 1) {
          ripples.splice(i, 1);
          continue;
        }

        const px = (ripple.color.x / 255) * canvas.width;
        const py = (ripple.color.y / 255) * canvas.height;

        const sz = canvas.height * easeOutQuart(ripple.age);
        const alpha =
          ripple.age < RIPPLE_PEAK
            ? easeOutQuart(ripple.age / RIPPLE_PEAK)
            : 1 - linear((ripple.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK));

        const grd = ctx.createRadialGradient(
          px,
          py,
          sz * 0.25,
          px,
          py,
          sz * 0.5
        );
        grd.addColorStop(1, 'rgba(128, 128, 0, 0.5)');
        grd.addColorStop(
          0.2,
          `rgba(${ripple.color.x}, ${ripple.color.y}, ${100 * alpha}, ${alpha})`
        );
        grd.addColorStop(0, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      tex.needsUpdate = true;
    } else if (st.wasRendering) {
      ctx.fillStyle = 'rgb(128, 128, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      st.wasRendering = false;
      tex.needsUpdate = true;
    }
  });

  return <RipplePostEffect tRipple={texture} />;
}
