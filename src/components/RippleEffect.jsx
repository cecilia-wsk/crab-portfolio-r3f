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

const RIPPLE_MESH_VERTEX = `
  varying vec2 vLocalPos;
  void main() {
    vLocalPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIPPLE_MESH_FRAGMENT = `
  precision highp float;

  varying vec2 vLocalPos;
  uniform float uAlpha;
  uniform vec2 uColor;

  void main() {
    float r = length(vLocalPos);
    if (r > 1.0) discard;

    vec4 transparentColor = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 neutralColor = vec4(128.0 / 255.0, 128.0 / 255.0, 0.0, 0.5);
    vec3 peakColor = vec3(uColor.x, uColor.y, 5.0 * uAlpha) / 255.0;
    vec4 peakColorAlpha = vec4(peakColor, uAlpha);

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

    const rippleCamera = new THREE.OrthographicCamera(0, w, 0, h, -10, 10);
    rippleCamera.position.set(0, 0, 0);
    rippleCamera.updateMatrixWorld();

    // 3. Pooled meshes for GPU ripple rendering
    const geometry = new THREE.CircleGeometry(1, 64);
    const pool = [];

    for (let i = 0; i < MAX_RIPPLES; i++) {
      const material = new THREE.ShaderMaterial({
        vertexShader: RIPPLE_MESH_VERTEX,
        fragmentShader: RIPPLE_MESH_FRAGMENT,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        uniforms: {
          uAlpha: { value: 0 },
          uColor: { value: new THREE.Vector2(128, 128) },
        },
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.position.z = 0;
      rippleScene.add(mesh);

      pool.push({
        mesh,
        material,
        active: false,
        age: 0,
        colorX: 128,
        colorY: 128,
      });
    }

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
      pool,
      ripples: [],
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
      pool.forEach((entry) => entry.material.dispose());
      stateRef.current = null;
    };
  }, [gl, scene, camera]);

  // 11. Frame loop: activate / update pooled mesh for each active ripple
  useFrame((_state, delta) => {
    const st = stateRef.current;
    if (!st) return;

    const { pool, ripples } = st;

    // Age & filter out dead ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.age += delta * RIPPLE_SPEED;
      if (ripple.age > 1) {
        ripples.splice(i, 1);
      }
    }

    const activeCount = ripples.length;

    // Reset all pool entries
    for (let i = 0; i < MAX_RIPPLES; i++) {
      pool[i].active = false;
      pool[i].mesh.visible = false;
    }

    // Activate pool entries for current ripples
    // Draw order: newest first (index 0) so oldest end up on top,
    // matching the original backward canvas loop.
    for (let i = activeCount - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const entry = pool[activeCount - 1 - i];

      entry.active = true;
      entry.age = ripple.age;

      const sz = window.innerHeight * easeOutQuart(ripple.age);
      const alpha =
        ripple.age < RIPPLE_PEAK
          ? easeOutQuart(ripple.age / RIPPLE_PEAK)
          : 1 - linear((ripple.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK));

      entry.mesh.visible = true;
      entry.mesh.position.set(ripple.position.x, ripple.position.y, 0);
      entry.mesh.scale.set(sz, sz, 1);
      entry.material.uniforms.uAlpha.value = alpha;
      entry.material.uniforms.uColor.value.set(ripple.color.x, ripple.color.y);
    }
  });

  return null;
}
