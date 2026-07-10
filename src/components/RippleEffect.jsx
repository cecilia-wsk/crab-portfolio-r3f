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
const FADE_SPEED = 0.4;
const RIPPLE_PEAK = 0.2;
const MAX_RIPPLES = 10;
const easeOutQuart = (t) => 1 - --t * t * t * t;

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
  uniform vec2  uColor;
  uniform float uScale;
  uniform float uWaveRadius;
  uniform float uReachMin;
  uniform float uPulseWidthFactor;
  uniform float uTendrilMin;
  uniform float uDispStrength;
  uniform float uTime;

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

    float angle = atan(vLocalPos.y, vLocalPos.x);
    vec2 circ = vec2(cos(angle), sin(angle));

    // animate even when frozen via uTime
    float reach = fbm(circ * 2.5 + vec2(0.0, uWaveRadius * 0.02 + uTime * 0.8));
    reach = uReachMin + (1.0 - uReachMin) * reach;
    float rVar = uWaveRadius * reach;

    float w = max(uWaveRadius * uPulseWidthFactor, 12.0);

    float tendril = fbm(circ * 6.0 + vec2(10.0, -uWaveRadius * 0.03 - uTime * 1.2));
    tendril = uTendrilMin + (1.0 - uTendrilMin) * tendril;

    float envelope = exp(-pow((dist - rVar) / w, 2.0)) * tendril;

    vec3 peakRGB = vec3(uColor.x, uColor.y, uDispStrength * uAlpha) / 255.0;
    gl_FragColor = vec4(peakRGB, envelope);
  }
`;

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

    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    rt.texture.colorSpace = THREE.NoColorSpace;

    const rippleScene = new THREE.Scene();
    const rippleCamera = new THREE.OrthographicCamera(0, w, 0, h, 0.1, 100);
    rippleCamera.position.set(0, 0, 5);
    rippleCamera.updateMatrixWorld();
    const rippleClearColor = new THREE.Color(128.0 / 255.0, 128.0 / 255.0, 0.0);

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
          uTime: { value: 0 },
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

    const originalRender = gl.render.bind(gl);
    const proxyRenderer = new Proxy(gl, {
      get(target, prop) {
        if (prop === "render")
          return (s, c) => originalRender.call(target, s, c);
        const val = Reflect.get(target, prop);
        return typeof val === "function" ? val.bind(target) : val;
      },
    });

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

    // ── hover detection raycaster ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const hoverState = {
      isHovering: false,
      mouseMoveAccum: 0,
      clientX: 0,
      clientY: 0,
    };

    const checkHover = () => {
      raycaster.params.Points = { threshold: 1.2 };
      raycaster.setFromCamera(mouse, camera);

      let pointsObj = null;
      scene.traverse((c) => {
        if (c.name === "crab-particles") pointsObj = c;
      });

      if (!pointsObj || !pointsObj.geometry) return false;
      const hits = raycaster.intersectObject(pointsObj);
      return hits.length > 0;
    };

    const onMove = (e) => {
      const prevX = mouse.x;
      const prevY = mouse.y;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      hoverState.isHovering = checkHover();
      hoverState.clientX = e.clientX;
      hoverState.clientY = e.clientY;

      if (hoverState.isHovering) {
        const dx = mouse.x - prevX;
        const dy = mouse.y - prevY;
        if (Math.abs(dx) + Math.abs(dy) > 0.003) {
          hoverState.mouseMoveAccum += 1;
        }
      }

      if (window.innerWidth <= 768) return;
    };

    const onClick = (e) => {
      if (window.innerWidth > 768) return; // click only on mobile
      if (!stateRef.current) return;
      const st = stateRef.current;
      if (st.ripples.length >= MAX_RIPPLES) return;
      const clientDpr = gl.getPixelRatio();
      st.ripples.push({
        age: 0,
        freezeAge: 0,
        frozen: false,
        position: new THREE.Vector2(
          e.clientX * clientDpr,
          e.clientY * clientDpr,
        ),
        color: new THREE.Vector2(
          (e.clientX / window.innerWidth) * 255,
          (e.clientY / window.innerHeight) * 255,
        ),
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    // state stored on ref so useFrame can read
    const state = {
      composer,
      rt,
      pool,
      ripples: [],
      mouse,
      hoverState,
    };
    stateRef.current = state;

    gl.render = () => {
      composer.render();
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const buf = new THREE.Vector2();
        gl.getDrawingBufferSize(buf);
        rt.setSize(buf.x, buf.y);
        rippleCamera.left = 0;
        rippleCamera.right = buf.x;
        rippleCamera.top = 0;
        rippleCamera.bottom = buf.y;
        rippleCamera.updateProjectionMatrix();
        composer.setSize(window.innerWidth, window.innerHeight);
      }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      gl.render = originalRender;
      composer.dispose();
      rt.dispose();
      geometry.dispose();
      pool.forEach((e) => e.material.dispose());
      stateRef.current = null;
    };
  }, [gl, scene, camera]);

  useFrame((_, delta) => {
    const st = stateRef.current;
    if (!st) return;
    const { pool, ripples } = st;

    // --- HOVER logic (desktop only) ---
    if (window.innerWidth > 768) {
      const hs = st.hoverState;
      if (hs.isHovering) {
        const dpr = gl.getPixelRatio();
        const x = hs.clientX * dpr;
        const y = hs.clientY * dpr;

        // find existing active hover ripple (not fading out)
        const existing = ripples.find((r) => r.hover && !r.leaving);

        if (existing) {
          // move with mouse but keep age frozen at peak
          existing.position.set(x, y);
        } else {
          // first entry or old one already gone → spawn fresh
          ripples.push({
            hover: true,
            age: 0,
            freezeAge: RIPPLE_PEAK,
            frozen: false,
            leaving: false,
            position: new THREE.Vector2(x, y),
            color: new THREE.Vector2(
              (st.mouse.x * 0.5 + 0.5) * 255,
              (st.mouse.y * 0.5 + 0.5) * 255,
            ),
          });
        }
      }
    }

    // --- age & cull ---
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];

      if (r.frozen && r.hover) {
        // mouse left → start fade-out
        if (!st.hoverState.isHovering) {
          r.frozen = false;
          r.leaving = true;
        }
      }

      if (r.leaving || (!r.frozen && r.freezeAge === 0)) {
        r.age += delta * FADE_SPEED;
      } else if (!r.frozen) {
        r.age += delta * RIPPLE_SPEED;
        if (r.age >= r.freezeAge) {
          r.frozen = true;
          r.age = r.freezeAge;
        }
      }

      if (r.age > 1) ripples.splice(i, 1);
    }

    // --- render pool ---
    const activeCount = ripples.length;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      pool[i].active = false;
      pool[i].mesh.visible = false;
    }

    for (let i = activeCount - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const entry = pool[activeCount - 1 - i];

      entry.active = true;
      const waveRadius =
        window.innerHeight * (1.2 * ripple.age) * gl.getPixelRatio();
      const sz = Math.max(waveRadius * 2.5, 50.0);

      // full brightness while growing or frozen; only fade when leaving
      const fadeProgress =
        ripple.leaving || ripple.freezeAge === 0
          ? ripple.freezeAge > 0
            ? Math.min(
                1,
                (ripple.age - ripple.freezeAge) / (1 - ripple.freezeAge),
              )
            : ripple.age
          : 0;
      const alpha = 1.0 - easeOutQuart(fadeProgress);

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
      entry.material.uniforms.uTime.value += delta; // animate fire
    }
  });

  return null;
}
