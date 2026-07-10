import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import vertexParticles from "../shaders/vertexParticles.glsl";
import fragmentShader from "../shaders/fragment.glsl";

const BASE_ROTATION_Y = -Math.PI * 0.92;

export default function CrabParticles({ mouseRef }) {
  const groupRef = useRef();
  const materialRef = useRef();

  // load model (drei handles draco by default from a CDN when `true` is passed)
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
      const stride = 4; // integer only: keep every 4th vertex
      const count = Math.floor(pos.count / stride);
      const reduced = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const src = i * stride * 3;
        reduced[i * 3] = pos.array[src];
        reduced[i * 3 + 1] = pos.array[src + 1];
        reduced[i * 3 + 2] = pos.array[src + 2];
      }

      geo.setAttribute("position", new THREE.BufferAttribute(reduced, 3));
      // Remove the old triangle index so points render correctly
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

  // update uResolution on window resize
  useEffect(() => {
    const onResize = () => {
      uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight,
        1,
        1,
      );
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

    if (groupRef.current) {
      const targetX = mouseRef.current.y * 0.05;
      const targetY = mouseRef.current.x * 0.05 + BASE_ROTATION_Y;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.05,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        0.05,
      );
    }
  });

  if (!geometry) return null;

  return (
    <group
      ref={groupRef}
      rotation={[0, BASE_ROTATION_Y, 0]}
      position={[-3, 0, 0]}
    >
      <points geometry={geometry}>
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
}

useGLTF.preload("/assets/crab_draco.glb");
