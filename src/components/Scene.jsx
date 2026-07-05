import { Suspense } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import CrabParticles from './CrabParticles';
import Stars from './Stars';
import RippleEffect from './RippleEffect';

export default function Scene({ mouseRef }) {
  return (
    <>
      <color attach="background" args={['#0b0b0b']} />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, -6]}
        fov={75}
        near={0.001}
        far={10000}
      />
      <OrbitControls enableDamping dampingFactor={0.05} />
      <Suspense fallback={null}>
        <CrabParticles mouseRef={mouseRef} />
      </Suspense>
      <Stars />
      <RippleEffect />
    </>
  );
}
