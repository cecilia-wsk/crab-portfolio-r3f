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
const MAX_RIPPLES = 100;
const easeOutQuart = (t) => 1 - --t * t * t * t;
const linear = (t) => t;

const GPU_RIPPLE_VERTEX = `
  attribute float iAlpha;
  attribute vec2 iColor;

  varying float vAlpha;
  varying vec2 vColor;
  varying vec2 vLocalPos;

  void main() {
    vAlpha = iAlpha;
    vColor = iColor;
    vLocalPos = position.xy; // CircleGeometry(radius=1) → unit disk

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GPU_RIPPLE_FRAGMENT = `
  precision highp float;

  varying float vAlpha;
  varying vec2 vColor;
  varying vec2 vLocalPos;

  void main() {
    float r = length(vLocalPos);

    vec4 transparentColor = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 neutralColor = vec4(128.0 / 255.0, 128.0 / 255.0, 0.0, 0.5);
    vec3 peakColor = vec3(vColor.x, vColor.y, 5.0 * vAlpha) / 255.0;
    vec4 peakColorAlpha = vec4(peakColor, vAlpha);

    vec4 outColor;

    if (r < 0.25) {
      outColor = transparentColor;
    } else if (r < 0.5) {
      float t = (r - 0.25) / 0.25;
      if (t < 0.6) {
        float localT = t / 0.6;
        outColor = mix(transparentColor, peakColorAlpha, localT);
      } else {
        float localT = (t - 0.6) / 0.4;
        outColor = mix(peakColorAlpha, neutralColor, localT);
      }
    } else {
      outColor = neutralColor;
    }

    gl_FragColor = outColor;
  }
`;

export default function RippleEffect() {
  const { gl, scene, camera } = useThree();
  const stateRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. Render target for ripple data (replaces 2D canvas)
    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });

    // 2. Ripple scene + orthographic camera (pixel-space, Y down like Canvas2D)
    const rippleScene = new THREE.Scene();
    rippleScene.background = new THREE.Color(0x808000);

    const rippleCamera = new THREE.OrthographicCamera(0, w, 0, h, -1, 1);
    rippleCamera.position.set(0, 0, 1);
    rippleCamera.updateMatrixWorld();

    // 3. Instanced mesh for GPU ripple rendering
    const geometry = new THREE.CircleGeometry(1, 64);

    // Custom instance attributes (must be set BEFORE creating InstancedMesh)
    const iAlphaAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_RIPPLES), 1);
    const iColorAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_RIPPLES * 2), 2);
    geometry.setAttribute('iAlpha', iAlphaAttr);
    geometry.setAttribute('iColor', iColorAttr);

    const material = new THREE.ShaderMaterial({
      vertexShader: GPU_RIPPLE_VERTEX,
      fragmentShader: GPU_RIPPLE_FRAGMENT,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, MAX_RIPPLES);
    mesh.frustumCulled = false;
    mesh.count = 0;

    rippleScene.add(mesh);

    // 4. Proxy renderer (avoids infinite recursion when we override gl.render)
    const originalRender = gl.render.bind(gl);
    const proxyRenderer = new Proxy(gl, {
      get(target, prop) {
        if (prop === 'render') return (s, c) => originalRender.call(target, s, c);
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });

    // 5. Composer attached to the proxy
    const composer = new EffectComposer(proxyRenderer);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));

    // 6. Ripple shader pass
    const ripplePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tRipple: { value: null },
        distort: { value: new THREE.Vector2(0.001, 0.001) },
      },
      vertexShader: rippleVertex,
      fragmentShader: rippleFragment,
    });
    ripplePass.uniforms.tRipple.value = rt.texture;
    ripplePass.needsSwap = false;
    composer.addPass(ripplePass);

    // 7. Mutable state
    const state = {
      composer,
      rt,
      rippleScene,
      rippleCamera,
      mesh,
      iAlphaAttr,
      iColorAttr,
      ripples: [],
      dummy: new THREE.Object3D(),
    };
    stateRef.current = state;

    // 8. Click handler
    const handleClick = (e) => {
      if (state.ripples.length >= MAX_RIPPLES) return;
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

    // 9. Redirect real renderer.render to:
    //    a) render ripple simulation into FBO
    //    b) run composer on main scene
    gl.render = () => {
      gl.setRenderTarget(state.rt);
      originalRender.call(gl, state.rippleScene, state.rippleCamera);
      gl.setRenderTarget(null);
      composer.render();
    };

    // 10. Resize
    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      rt.setSize(nw, nh);
      state.rippleCamera.left = 0;
      state.rippleCamera.right = nw;
      state.rippleCamera.top = 0;
      state.rippleCamera.bottom = nh;
      state.rippleCamera.updateProjectionMatrix();
      composer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', onResize);
      gl.render = originalRender;
      composer.dispose();
      rt.dispose();
      geometry.dispose();
      material.dispose();
      stateRef.current = null;
    };
  }, [gl, scene, camera]);

  // 11. Frame loop: update instance data for active ripples
  useFrame((_state, delta) => {
    const st = stateRef.current;
    if (!st) return;

    const { mesh, iAlphaAttr, iColorAttr, ripples, dummy } = st;

    // Age & filter
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.age += delta * RIPPLE_SPEED;
      if (ripple.age > 1) {
        ripples.splice(i, 1);
      }
    }

    const count = ripples.length;
    mesh.count = count;

    if (count > 0) {
      // Draw order: newest first (index 0) so oldest end up on top,
      // matching the original backward canvas loop.
      for (let i = count - 1; i >= 0; i--) {
        const ripple = ripples[i];
        const sz = window.innerHeight * easeOutQuart(ripple.age);
        const alpha =
          ripple.age < RIPPLE_PEAK
            ? easeOutQuart(ripple.age / RIPPLE_PEAK)
            : 1 - linear((ripple.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK));

        const idx = count - 1 - i; // reverse: newest → 0

        dummy.position.set(ripple.position.x, ripple.position.y, 0);
        dummy.scale.set(sz, sz, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        iAlphaAttr.setX(idx, alpha);
        iColorAttr.setXY(idx, ripple.color.x, ripple.color.y);
      }

      mesh.instanceMatrix.needsUpdate = true;
      iAlphaAttr.needsUpdate = true;
      iColorAttr.needsUpdate = true;
    }
  });

  return null;
}
