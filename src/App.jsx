import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Scene from "./components/Scene";
import { BASE_ROTATION_Y } from "./components/CrabParticles";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function App() {
  const mouseRef = useRef(new THREE.Vector2());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const crabRef = useRef();
  const heroRef = useRef();

  const scrollTlRef = useRef(null);
  const entranceDoneRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Entrance animation (runs immediately on mount) ──
  useEffect(() => {
    const entranceCtx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          entranceDoneRef.current = true;
          if (scrollTlRef.current) {
            addHeadlineExitTweens(scrollTlRef.current);
          }
        },
      });
      tl.fromTo(
        ".ui-headline-top",
        { yPercent: 110 },
        { yPercent: 0, duration: 1 },
        0.3,
      );
      tl.fromTo(
        ".ui-headline-bottom",
        { yPercent: 110 },
        { yPercent: 0, duration: 1 },
        0.6,
      );
      tl.fromTo(
        ".ui-intro",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1 },
        1.0,
      );
    });

    return () => entranceCtx.revert();
  }, []);

  // ── Scroll-driven exit ──
  useEffect(() => {
    if (!heroRef.current) return;

    let ctx = null;
    let interval = null;

    const setup = () => {
      const hero = heroRef.current;
      const crabGroup = crabRef.current;
      if (!hero || !crabGroup || ctx) return;

      clearInterval(interval);

      ctx = gsap.context(() => {
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=20%",
            pin: true,
            scrub: 0.5,
            onUpdate: (st) => {
              crabGroup.userData.isAnimating = st.progress > 0;
            },
          },
        });

        scrollTl.to(
          crabGroup.position,
          { x: -6, y: 0.5, z: 0, duration: 1, ease: "power2.inOut" },
          0,
        );

        scrollTl.to(
          crabGroup.scale,
          { x: 1.5, y: 1.5, z: 1.5, duration: 1, ease: "power2.inOut" },
          0,
        );

        scrollTl.to(
          crabGroup.rotation,
          {
            y: BASE_ROTATION_Y + Math.PI * 0.85,
            duration: 1,
            ease: "power2.inOut",
          },
          0,
        );

        scrollTlRef.current = scrollTl;

        if (entranceDoneRef.current) {
          addHeadlineExitTweens(scrollTl);
        }
      }, hero);
    };

    setup();
    interval = setInterval(setup, 50);

    return () => {
      clearInterval(interval);
      if (ctx) ctx.revert();
    };
  }, []);

  function addHeadlineExitTweens(tl) {
    if (tl.vars._headlineAdded) return;
    tl.vars._headlineAdded = true;
    tl.to(
      ".ui-headline-top",
      { yPercent: -110, duration: 0.5, ease: "power2.in" },
      0,
    );
    tl.to(
      ".ui-headline-bottom",
      { yPercent: -110, duration: 0.5, ease: "power2.in" },
      0.05,
    );
    tl.to(
      ".ui-intro",
      { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" },
      0,
    );
    ScrollTrigger.refresh();
  }

  const scrollToSection = (id) => {
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: id, offsetY: 0 },
      ease: "power2.inOut",
    });
  };

  return (
    <>
      <div className="canvas-wrapper">
        <Canvas
          tabIndex={-1}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
        >
          <Scene mouseRef={mouseRef} crabRef={crabRef} />
        </Canvas>
      </div>

      {/* Fixed chrome — always visible */}
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
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              scrollToSection("#about");
            }}
          >
            <span className="ui-num">01</span>ABOUT
          </a>
          <a
            href="#works"
            className="ui-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              scrollToSection("#works");
            }}
          >
            <span className="ui-num">02</span>WORKS
          </a>
          <a
            href="#contact"
            className="ui-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              scrollToSection("#contact");
            }}
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

      {/* Scrollable page content */}
      <main className="page-content">
        <section className="hero" ref={heroRef}>
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
        </section>

        <section className="section about" id="about">
          <h2 className="section-title">About</h2>
          <p className="section-body">
            I'm Cecilia Wielonsky, a creative developer passionate about
            bridging design and technology. I craft immersive web experiences
            using WebGL, shaders, and modern JavaScript.
          </p>
        </section>

        <section className="section works" id="works">
          <h2 className="section-title">Works</h2>
          <p className="section-body">
            A selection of experiments and client projects exploring interactive
            3D, generative art, and performant web animations.
          </p>
        </section>

        <section className="section contact" id="contact">
          <h2 className="section-title">Contact</h2>
          <p className="section-body">
            Want to collaborate or just say hi?
            <br />
            <a
              href="mailto:cecilia.wielonsky@gmail.com"
              className="section-link"
            >
              cecilia.wielonsky@gmail.com
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
