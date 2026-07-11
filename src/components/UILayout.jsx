import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import useScrollAnimations from "../hooks/useScrollAnimations";

// GSAP plugins are idempotent; re-registering is harmless.
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function UILayout({ crabRef }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const heroRef = useRef();

  const scrollToSection = (idOrPath) => {
    // map "/about" → "#about" if needed
    const hash = idOrPath.startsWith("/") ? "#" + idOrPath.slice(1) : idOrPath;
    const el = document.querySelector(hash);
    if (!el) return;

    const st = ScrollTrigger.getAll().find(
      (t) => t.trigger === el && t.vars.pin,
    );

    if (st) {
      // Pinned section: land ~35 % into its timeline so entrance is visible
      const target = st.start + (st.end - st.start) * 0.5;
      gsap.to(window, {
        duration: 2.25,
        scrollTo: { y: target, autoKill: false },
        ease: "power2.inOut",
      });
    } else {
      gsap.to(window, {
        duration: 2.25,
        scrollTo: { y: el, offsetY: 0, autoKill: false },
        ease: "power2.inOut",
      });
    }
  };

  const goTo = (pathname) => {
    history.pushState(null, "", pathname);
    scrollToSection(pathname);
  };

  // ── Handle direct URL access (cecialiawielonsky.com/about) ──
  useEffect(() => {
    const map = {
      "/about": "#about",
      "/works": "#works",
      "/contact": "#contact",
    };
    const target = map[window.location.pathname];
    if (target) {
      // debounce: wait a tick so ScrollTrigger + loader are ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToSection(target));
      });
    }
  }, []);

  useScrollAnimations(heroRef, crabRef);

  return (
    <>
      <nav className="ui-nav" aria-label="Main">
        <a className="ui-brand">Cecilia Wielonsky</a>

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
            href="/about"
            className="ui-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              goTo("/about");
            }}
          >
            <span className="ui-num">01</span>ABOUT
          </a>
          <a
            href="/works"
            className="ui-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              goTo("/works");
            }}
          >
            <span className="ui-num">02</span>WORKS
          </a>
          <a
            href="/contact"
            className="ui-link"
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(false);
              goTo("/contact");
            }}
          >
            <span className="ui-num">03</span>CONTACT
          </a>
        </div>
      </nav>

      <a
        className={`ui-status ui-bottom-left ${isMenuOpen ? "menu-open" : ""}`}
        href="mailto:cecilia.wielonsky@gmail.com?subject=I%20want%20to%20collaborate%20on%20a%20creative%20project"
        target="_blank"
        rel="noopener noreferrer"
      >
        Available for work
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
          Email
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
          Linkedin
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
          Instagram
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
          Github
        </a>
      </div>

      {/* Scrollable page content */}
      <main className="page-content">
        <section className="hero" ref={heroRef}>
          <div className="ui-headline">
            <div className="ui-headline-line">
              <h1 className="ui-headline-top">Creative</h1>
            </div>
            <div className="ui-headline-line">
              <h1 className="ui-headline-bottom">Developer</h1>
            </div>
            <p className="ui-intro">
              I'm a french javascript enthusiast.
              <br /> I love experimenting with lights, colors and maths.
            </p>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="section-title">
            <div className="ui-headline-line">
              <h2 className="about-title">About</h2>
            </div>
          </div>
          <div className="section-body">
            <p className="about-reveal-p1">
              Hi, I'm Cecilia Wielonsky, a creative developer and UX/UI
              designer, based in Barcelona with over 9 years of experience in
              the tech industry. I craft immersive web experiences using
              three.js, shaders, and modern JavaScript.
            </p>
            <p className="about-reveal-p2">
              I started as a front-end developer and later discovered my passion
              for creative coding, which led me to explore the intersection of
              design and technology. My focus for the past few years has been
              front-end development with a strong interest in 3D and shaders
              magic ✨
            </p>
            <div className="about-reveal-resume">
              <a
                href="/assets/cv_cecilia_wielonsky.pdf"
                download
                className="ui-social-link"
              >
                <img
                  src="/assets/arrow-external.svg"
                  alt=""
                  className="ui-social-arrow"
                  aria-hidden="true"
                />
                Download my resume
              </a>
            </div>
          </div>
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
