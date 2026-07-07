import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import starsVertex from '../shaders/starsVertex.glsl';
import starsFragment from '../shaders/starsFragment.glsl';

const COUNT = 10000;

const positions = (() => {
  const array = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    array[i * 3] = (Math.random() - 0.5) * 2000;
    array[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    array[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }

  return array;
})();

export default function Stars() {
  const materialRef = useRef();

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starsVertex}
        fragmentShader={starsFragment}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
