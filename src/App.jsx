import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./components/Scene";

export default function App() {
  const mouseRef = useRef(new THREE.Vector2());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="canvas-wrapper">
      <Canvas
        tabIndex={-1}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Scene mouseRef={mouseRef} />
      </Canvas>
      <div className="ui-layer">
        <nav className="ui-nav" aria-label="Main">
          <div className="ui-brand">CECILIA WIELONSKY</div>

          <button
            type="button"
            className="ui-hamburger"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((p) => !p)}
          >
            <span />
            <span />
            <span />
          </button>

          <div
            className={`ui-links ${isMenuOpen ? "open" : ""}`}
            aria-hidden={!isMenuOpen}
          >
            <a
              href="#about"
              className="ui-link"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="ui-num">01</span>ABOUT
            </a>
            <a
              href="#works"
              className="ui-link"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="ui-num">02</span>WORKS
            </a>
            <a
              href="#contact"
              className="ui-link"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="ui-num">03</span>CONTACT
            </a>
          </div>
        </nav>

        <a
          href="mailto:cecilia.wielonsky@gmail.com?subject=I%20want%20to%20collaborate%20on%20a%20creative%20project"
          target="_blank"
          rel="noopener noreferrer"
          className={`ui-status ui-bottom-left ${isMenuOpen ? "menu-open" : ""}`}
        >
          AVAILABLE FOR WORK
          <span className="ui-dot ui-dot--green" />
        </a>

        <div className={`ui-social ${isMenuOpen ? "menu-open" : ""}`}>
          <a
            href="mailto:cecilia.wielonsky@gmail.com"
            className="ui-social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/arrow-external.svg"
              alt=""
              className="ui-social-arrow"
              aria-hidden="true"
            />
            EMAIL
          </a>
          <a
            href="https://www.linkedin.com/in/cecilia-wielonsky/"
            className="ui-social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/arrow-external.svg"
              alt=""
              className="ui-social-arrow"
              aria-hidden="true"
            />
            LINKEDIN
          </a>
          <a
            href="https://www.instagram.com/cecilia_wsk/"
            className="ui-social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/arrow-external.svg"
              alt=""
              className="ui-social-arrow"
              aria-hidden="true"
            />
            INSTAGRAM
          </a>
          <a
            href="https://github.com/cecilia-wsk/"
            className="ui-social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/arrow-external.svg"
              alt=""
              className="ui-social-arrow"
              aria-hidden="true"
            />
            GITHUB
          </a>
        </div>

        <div className={`ui-headline ${isMenuOpen ? "menu-open" : ""}`}>
          <div className="ui-headline-line">
            <div className="ui-headline-top">Creative</div>
          </div>
          <div className="ui-headline-line">
            <div className="ui-headline-bottom">Developer</div>
          </div>
          <p className="ui-intro">
            I'm a french javascript enthusiast.
            <br /> I love experimenting with lights, colors and maths.
          </p>
        </div>
      </div>
    </div>
  );
}
