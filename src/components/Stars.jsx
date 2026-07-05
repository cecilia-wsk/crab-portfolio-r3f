import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import starsVertex from '../shaders/starsVertex.glsl';
import starsFragment from '../shaders/starsFragment.glsl';

const COUNT = 10000;

export default function Stars() {
  const materialRef = useRef();

  const positions = useRef(new Float32Array(COUNT * 3));
  for (let i = 0; i < COUNT; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 2000;
    positions.current[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }

  const uniforms = useRef({ uTime: { value: 0 } });

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms.current}
        vertexShader={starsVertex}
        fragmentShader={starsFragment}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
