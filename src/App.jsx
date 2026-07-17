import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Router } from "wouter";

import Scene from "./components/Scene";
import Nav from "./components/Nav";
import Shell from "./components/Shell";
import Loader from "./components/Loader";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import WorksPage from "./components/WorksPage";

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
    <Router>
      <Loader />

      <div className="canvas-wrapper">
        <Canvas tabIndex={-1} dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <Scene mouseRef={mouseRef} crabRef={crabRef} />
        </Canvas>
      </div>

      <Nav />

      <a className="ui-status ui-bottom-left" href="mailto:cecilia.wielonsky@gmail.com?subject=I%20want%20to%20collaborate%20on%20a%20creative%20project" target="_blank" rel="noopener noreferrer">
        Available for work
        <span className="ui-dot ui-dot--green" />
      </a>

      <div className="ui-social">
        <a href="mailto:cecilia.wielonsky@gmail.com" className="ui-social-link" target="_blank" rel="noopener noreferrer"><img src="/assets/arrow-external.svg" alt="" className="ui-social-arrow" aria-hidden="true" />Email</a>
        <a href="https://www.linkedin.com/in/cecilia-wielonsky/" className="ui-social-link" target="_blank" rel="noopener noreferrer"><img src="/assets/arrow-external.svg" alt="" className="ui-social-arrow" aria-hidden="true" />Linkedin</a>
        <a href="https://www.instagram.com/cecilia_wsk/" className="ui-social-link" target="_blank" rel="noopener noreferrer"><img src="/assets/arrow-external.svg" alt="" className="ui-social-arrow" aria-hidden="true" />Instagram</a>
        <a href="https://github.com/cecilia-wsk/" className="ui-social-link" target="_blank" rel="noopener noreferrer"><img src="/assets/arrow-external.svg" alt="" className="ui-social-arrow" aria-hidden="true" />Github</a>
      </div>

      <Shell crabRef={crabRef}>
        {(page) => {
          if (page === "/about") return <AboutPage />;
          if (page === "/works") return <WorksPage />;
          return <HomePage />;
        }}
      </Shell>
    </Router>
  );
}
