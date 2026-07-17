import { Suspense, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import CrabParticles from "./CrabParticles";
import Stars from "./Stars";
import RippleEffect from "./RippleEffect";

function CameraTarget() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function Scene({ mouseRef, crabRef }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <CameraTarget />
      <PerspectiveCamera makeDefault position={[0, 0, -6]} fov={75} near={0.1} far={1000} />
      <Suspense fallback={null}>
        <CrabParticles ref={crabRef} mouseRef={mouseRef} />
      </Suspense>
      <Stars />
      <RippleEffect />
    </>
  );
}
