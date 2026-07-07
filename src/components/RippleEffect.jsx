import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import rippleVertex from '../shaders/rippleVertex.glsl';
import rippleFragment from '../shaders/rippleFragment.glsl';

const RIPPLE_SPEED = 0.3;
const RIPPLE_PEAK = 0.2;
const easeOutQuart = (t) => 1 - --t * t * t * t;
const linear = (t) => t;

export default function RippleEffect() {
  const { gl, scene, camera } = useThree();
  const stateRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(128, 128, 0)';
    ctx.fillRect(0, 0, w, h);

    const texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    // 2. proxy renderer (avoids infinite recursion when we override gl.render)
    const originalRender = gl.render.bind(gl);
    const proxyRenderer = new Proxy(gl, {
      get(target, prop) {
        if (prop === 'render') return (s, c) => originalRender.call(target, s, c);
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });

    // 3. composer attached to the proxy
    const composer = new EffectComposer(proxyRenderer);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));

    // 4. ripple shader pass — don't pass tRipple here or it gets cloned
    const ripplePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tRipple: { value: null },
        distort: { value: new THREE.Vector2(0.001, 0.001) },
      },
      vertexShader: rippleVertex,
      fragmentShader: rippleFragment,
    });
    ripplePass.uniforms.tRipple.value = texture;
    ripplePass.needsSwap = false;
    composer.addPass(ripplePass);

    // 5. mutable state
    const state = {
      composer,
      canvas,
      ctx,
      texture,
      ripples: [],
      wasRendering: false,
    };
    stateRef.current = state;

    // 6. click handler
    const handleClick = (e) => {
      state.ripples.push({
        age: 0,
        position: new THREE.Vector2(e.clientX, e.clientY),
        color: new THREE.Vector2(
          (e.clientX / window.innerWidth) * 255,
          (e.clientY / window.innerHeight) * 255
        ),
      });
    };
    window.addEventListener('click', handleClick);

    // 7. redirect real renderer.render to composer.render
    gl.render = () => {
      composer.render();
    };

    // 8. resize
    const onResize = () => {
      canvas.width =  window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = 'rgb(128, 128, 0)';
      ctx.fillRect(0, 0,  window.innerWidth, window.innerHeight);
      composer.setSize( window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', onResize);
      gl.render = originalRender;
      composer.dispose();
      texture.dispose();
      stateRef.current = null;
    };
  }, [gl, scene, camera]);

  // 9. frame loop : dessine les ripples dans le canvas offscreen
  useFrame((_state, delta) => {
    const st = stateRef.current;
    if (!st) return;

    const { canvas, ctx, texture, ripples } = st;

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

        const sz = canvas.height * easeOutQuart(ripple.age);
        const alpha =
          ripple.age < RIPPLE_PEAK
            ? easeOutQuart(ripple.age / RIPPLE_PEAK)
            : 1 - linear((ripple.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK));

        const grd = ctx.createRadialGradient(
          ripple.position.x,
          ripple.position.y,
          sz * 0.25,
          ripple.position.x,
          ripple.position.y,
          sz * 0.5
        );
        grd.addColorStop(1, 'rgba(128, 128, 0, 0.5)');
        grd.addColorStop(
          0.6,
          `rgba(${ripple.color.x}, ${ripple.color.y}, ${5 * alpha}, ${alpha})`
        );
        grd.addColorStop(0, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(ripple.position.x, ripple.position.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      texture.needsUpdate = true;
    } else if (st.wasRendering) {
      ctx.fillStyle = 'rgb(128, 128, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      st.wasRendering = false;
      texture.needsUpdate = true;
    }
  });

  return null;
}
