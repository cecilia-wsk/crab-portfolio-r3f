import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import vertexParticles from '../shaders/vertexParticles.glsl';
import fragmentShader from '../shaders/fragment.glsl';

export default function CrabParticles({ mouseRef }) {
  const groupRef = useRef();
  const materialRef = useRef();

  // load model (drei handles draco by default from a CDN when `true` is passed)
  const { scene } = useGLTF('/assets/crab_draco.glb', true);

  const geometry = useMemo(() => {
    let geo = null;
    scene.traverse((child) => {
      if (!geo && child.isMesh) {
        geo = child.geometry.clone();
        geo.scale(0.3, 0.3, 0.3);
        geo.translate(0, -0.5, 0);
      }
    });
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
    []
  );

  // update uResolution on window resize
  useEffect(() => {
    const onResize = () => {
      uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight,
        1,
        1
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [uniforms]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    if (mouseRef.current) {
      uniforms.uMouse.value.lerp(mouseRef.current, 0.1);
    }

    if (groupRef.current) {
      const targetX = mouseRef.current.y * 0.05;
      const targetY = mouseRef.current.x * 0.05;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.05
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        0.05
      );
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexParticles}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
