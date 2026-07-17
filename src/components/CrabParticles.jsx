import { useRef, useEffect, useMemo, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import vertexParticles from "../shaders/vertexParticles.glsl";
import fragmentShader from "../shaders/fragment.glsl";

export const BASE_ROTATION_Y = -Math.PI * 0.92;

const CrabParticles = forwardRef(function CrabParticles({ mouseRef }, ref) {
  const materialRef = useRef();
  const { scene } = useGLTF("/assets/crab_draco.glb", true);

  const geometry = useMemo(() => {
    let geo = null;
    scene.traverse((child) => {
      if (!geo && child.isMesh) {
        geo = child.geometry.clone();
        geo.scale(0.6, 0.6, 0.6);
        geo.translate(0, -0.5, 0);
      }
    });

    if (geo) {
      const pos = geo.attributes.position;
      const stride = 4;
      const count = Math.floor(pos.count / stride);
      const reduced = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const src = i * stride * 3;
        reduced[i * 3] = pos.array[src];
        reduced[i * 3 + 1] = pos.array[src + 1];
        reduced[i * 3 + 2] = pos.array[src + 2];
      }

      geo.setAttribute("position", new THREE.BufferAttribute(reduced, 3));
      geo.index = null;
      geo.clearGroups();
      for (const key of Object.keys(geo.attributes)) {
        if (key !== "position") geo.deleteAttribute(key);
      }
    }

    return geo;
  }, [scene]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: {
        value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1, 1),
      },
    }),
    [],
  );

  useEffect(() => {
    const onResize = () => {
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight, 1, 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [uniforms]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    if (mouseRef.current) {
      uniforms.uMouse.value.lerp(mouseRef.current, 0.1);
    }

    if (ref.current && !ref.current.userData.isAnimating && !ref.current.userData.isTransitioning) {
      const currentBaseRotation = typeof ref.current.userData.targetRotationY === 'number'
        ? ref.current.userData.targetRotationY
        : BASE_ROTATION_Y;
      const targetX = mouseRef.current.y * 0.05;
      const targetY = mouseRef.current.x * 0.05 + currentBaseRotation;
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetX, 0.05);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetY, 0.05);
    }
  });

  if (!geometry) return null;

  return (
    <group ref={ref} rotation={[0, BASE_ROTATION_Y, 0]} position={[-3, 0, 0]}>
      <points geometry={geometry} name="crab-particles">
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexParticles}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

export default CrabParticles;

useGLTF.preload("/assets/crab_draco.glb");
