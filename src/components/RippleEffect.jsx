import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { rippleParams } from "../stores/rippleParams";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import rippleVertex from "../shaders/rippleVertex.glsl";
import rippleFragment from "../shaders/rippleFragment.glsl";

const RIPPLE_SPEED = 0.3;
const RIPPLE_PEAK = 0.2;
const MAX_RIPPLES = 15;
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
  uniform float uScale;
  uniform float uWaveRadius;
  uniform float uReachMin;
  uniform float uPulseWidthFactor;
  uniform float uTendrilMin;
  uniform float uDispStrength;

  // --- fast 2D value noise ---
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // 2-octave fBm
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 2; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float dist = length(vLocalPos) * uScale;

    // Angle around the click center (continuous via circ)
    float angle = atan(vLocalPos.y, vLocalPos.x);
    vec2 circ = vec2(cos(angle), sin(angle));

    // Flame reach varies by direction and evolves as the wave expands
    float reach = fbm(circ * 2.5 + vec2(0.0, uWaveRadius * 0.02));
    reach = uReachMin + (1.0 - uReachMin) * reach;
    float rVar = uWaveRadius * reach;

    // Pulse width
    float w = max(uWaveRadius * uPulseWidthFactor, 12.0);

    // Tendril detail
    float tendril = fbm(circ * 6.0 + vec2(10.0, -uWaveRadius * 0.03));
    tendril = uTendrilMin + (1.0 - uTendrilMin) * tendril;

    // Shockwave envelope: Gaussian ring modulated by tendril brightness
    float envelope = exp(-pow((dist - rVar) / w, 2.0)) * tendril;

    // Pixels outside the active flame-front are transparent
    vec3 peakRGB = vec3(uColor.x, uColor.y, uDispStrength * uAlpha) / 255.0;
    gl_FragColor = vec4(peakRGB, envelope);
  }
`;

// Custom pass: renders ripple scene into FBO
class RippleRenderPass extends Pass {
  constructor(scene, camera, renderTarget, clearColor) {
    super();
    this.needsSwap = false;
    this.scene = scene;
    this.camera = camera;
    this.renderTarget = renderTarget;
    this.clearColor = clearColor;
  }

  render(renderer) {
    const tmpColor = new THREE.Color();
    const prevClearColor = renderer.getClearColor(tmpColor);
    const prevClearAlpha = renderer.getClearAlpha();

    renderer.setClearColor(this.clearColor, 1);
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    renderer.setClearColor(prevClearColor, prevClearAlpha);
  }
}

export default function RippleEffect() {
  const { gl, scene, camera } = useThree();
  const stateRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const dpr = gl.getPixelRatio();
    const bufSize = new THREE.Vector2();
    gl.getDrawingBufferSize(bufSize);
    const w = bufSize.x;
    const h = bufSize.y;

    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    // 1. FBO (ripple texture at full physical pixel size for crispness)
    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    rt.texture.colorSpace = THREE.NoColorSpace;

    // 2. Ripple scene (manual clear, no background)
    const rippleScene = new THREE.Scene();
    const rippleCamera = new THREE.OrthographicCamera(0, w, 0, h, 0.1, 100);
    rippleCamera.position.set(0, 0, 5);
    rippleCamera.updateMatrixWorld();
    const rippleClearColor = new THREE.Color(128.0 / 255.0, 128.0 / 255.0, 0.0);

    // 3. Pooled meshes (PlaneGeometry + analytic circle)
    const geometry = new THREE.PlaneGeometry(2, 2);
    const pool = [];

    for (let i = 0; i < MAX_RIPPLES; i++) {
      const material = new THREE.ShaderMaterial({
        vertexShader: RIPPLE_MESH_VERTEX,
        fragmentShader: RIPPLE_MESH_FRAGMENT,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: {
          uAlpha: { value: 0 },
          uColor: { value: new THREE.Vector2(128, 128) },
          uScale: { value: 1 },
          uWaveRadius: { value: 0 },
          uReachMin: { value: rippleParams.reachMin },
          uPulseWidthFactor: { value: rippleParams.pulseWidthFactor },
          uTendrilMin: { value: rippleParams.tendrilMin },
          uDispStrength: { value: rippleParams.displacementStrength },
        },
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.position.z = 0;
      rippleScene.add(mesh);
      pool.push({ mesh, material, active: false });
    }

    // 4. Proxy renderer
    const originalRender = gl.render.bind(gl);
    const proxyRenderer = new Proxy(gl, {
      get(target, prop) {
        if (prop === "render")
          return (s, c) => originalRender.call(target, s, c);
        const val = Reflect.get(target, prop);
        return typeof val === "function" ? val.bind(target) : val;
      },
    });

    // 5. Composer (CSS pixels — EffectComposer handles DPR internally)
    const composer = new EffectComposer(proxyRenderer);
    composer.setSize(cssW, cssH);

    composer.addPass(
      new RippleRenderPass(rippleScene, rippleCamera, rt, rippleClearColor),
    );
    composer.addPass(new RenderPass(scene, camera));

    const ripplePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tRipple: { value: null },
        distort: { value: new THREE.Vector2(0.0, 0.0) },
      },
      vertexShader: rippleVertex,
      fragmentShader: rippleFragment,
    });
    ripplePass.uniforms.tRipple.value = rt.texture;
    ripplePass.needsSwap = false;
    composer.addPass(ripplePass);

    // 6. State
    const state = { composer, rt, pool, ripples: [] };
    stateRef.current = state;

    // Click trigger
    const handleClick = (e) => {
      if (!stateRef.current) return;
      const st = stateRef.current;
      if (st.ripples.length >= MAX_RIPPLES) return;
      const dpr = gl.getPixelRatio();
      st.ripples.push({
        age: 0,
        position: new THREE.Vector2(e.clientX * dpr, e.clientY * dpr),
        color: new THREE.Vector2(
          (e.clientX / window.innerWidth) * 255,
          (e.clientY / window.innerHeight) * 255,
        ),
      });
    };
    window.addEventListener("click", handleClick);

    // 7. Override renderer
    gl.render = () => {
      composer.render();
    };

    // 9. Resize
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const bufSize = new THREE.Vector2();
        gl.getDrawingBufferSize(bufSize);
        const nw = bufSize.x;
        const nh = bufSize.y;
        rt.setSize(nw, nh);
        rippleCamera.left = 0;
        rippleCamera.right = nw;
        rippleCamera.top = 0;
        rippleCamera.bottom = nh;
        rippleCamera.updateProjectionMatrix();
        composer.setSize(window.innerWidth, window.innerHeight);
      }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", onResize);
      gl.render = originalRender;
      composer.dispose();
      rt.dispose();
      geometry.dispose();
      pool.forEach((entry) => entry.material.dispose());
      stateRef.current = null;
    };
  }, [gl, scene, camera]);

  // 10. Frame loop
  useFrame((_state, delta) => {
    const st = stateRef.current;
    if (!st) return;

    const { pool, ripples } = st;

    // Age & cull
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += delta * RIPPLE_SPEED;
      if (r.age > 1) ripples.splice(i, 1);
    }

    const activeCount = ripples.length;

    // Reset
    for (let i = 0; i < MAX_RIPPLES; i++) {
      pool[i].active = false;
      pool[i].mesh.visible = false;
    }

    // Activate (newest first)
    for (let i = activeCount - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const entry = pool[activeCount - 1 - i];

      entry.active = true;
      const waveRadius = window.innerHeight * (1.2 * ripple.age);
      const sz = Math.max(waveRadius * 2.5, 50.0);
      const alpha = 1.0 - easeOutQuart(ripple.age);

      entry.mesh.visible = true;
      entry.mesh.position.set(ripple.position.x, ripple.position.y, 0);
      entry.mesh.scale.set(sz, sz, 1);
      entry.material.uniforms.uAlpha.value = alpha;
      entry.material.uniforms.uColor.value.set(ripple.color.x, ripple.color.y);
      entry.material.uniforms.uScale.value = sz;
      entry.material.uniforms.uWaveRadius.value = waveRadius;
      entry.material.uniforms.uReachMin.value = rippleParams.reachMin;
      entry.material.uniforms.uPulseWidthFactor.value =
        rippleParams.pulseWidthFactor;
      entry.material.uniforms.uTendrilMin.value = rippleParams.tendrilMin;
      entry.material.uniforms.uDispStrength.value =
        rippleParams.displacementStrength;
    }
  });

  return null;
}
