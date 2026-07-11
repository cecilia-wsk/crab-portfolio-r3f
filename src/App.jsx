import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./components/Scene";
import UILayout from "./components/UILayout";

export default function App() {
  const mouseRef = useRef(new THREE.Vector2());
  const crabRef = useRef();

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <div className="canvas-wrapper">
        <Canvas
          tabIndex={-1}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Scene mouseRef={mouseRef} crabRef={crabRef} />
        </Canvas>
      </div>

      <UILayout crabRef={crabRef} />
    </>
  );
}
