import { useRef, useState, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { useLocation } from "wouter";
import { BASE_ROTATION_Y } from "../components/CrabParticles";
import {
  animateCrabToAbout,
  animateCrabToHome,
  setCrabAtAbout,
  setCrabAtHome,
} from "../lib/crab";

const PROFILES = {
  "/→/about": {
    outgoing: { opacity: 0, scale: 0.96, y: -20, duration: 0.8 },
    incoming: { from: { opacity: 0, y: 60 }, duration: 0.7, ease: "power2.out" },
    crab: "toAbout",
  },
  "/about→/": {
    outgoing: { opacity: 0, scale: 0.94, y: -20, duration: 0.6, ease: "power2.in" },
    incoming: { from: { opacity: 0, y: -30 }, duration: 0.6, ease: "power2.out" },
    crab: "toHome",
  },
  "*→/works": {
    outgoing: { opacity: 0.3, scale: 0.88, y: 0, duration: 0.9, ease: "power2.inOut" },
    incoming: { from: { opacity: 1, y: "100vh" }, to: { opacity: 1, y: 0 }, duration: 1, ease: "power3.inOut" },
    incomingZIndex: 30,
    crab: null,
  },
  "/works→*": {
    outgoing: { opacity: 1, scale: 1, y: "100vh", duration: 0.8, ease: "power3.inOut" },
    incoming: { from: { opacity: 0, scale: 0.94, y: 30 }, to: { opacity: 1, scale: 1, y: 0 }, duration: 0.8, ease: "power2.out" },
    incomingZIndex: 35,
    crab: null,
  },
  default: {
    outgoing: { opacity: 0, duration: 0.4, ease: "power2.in" },
    incoming: { from: { opacity: 0 }, duration: 0.5, ease: "power2.out" },
    crab: null,
  },
};

function resolveProfile(from, to) {
  if (to === "/works") return PROFILES["*→/works"];
  if (from === "/works") return PROFILES["/works→*"];
  return PROFILES[`${from}→${to}`] || PROFILES.default;
}

function firstMountEntrance(container, displayed) {
  const page = container.querySelector(".page--outgoing");
  if (!page) return;

  if (displayed === "/") {
    gsap.fromTo(
      page.querySelectorAll(".ui-headline-top, .ui-headline-bottom"),
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.3, delay: 0.3 },
    );
  }
}

export default function Shell({ crabRef, children }) {
  const [location] = useLocation();
  const [displayed, setDisplayed] = useState(location);
  const [renderIncoming, setRenderIncoming] = useState(false);
  const [incomingRoute, setIncomingRoute] = useState(null);
  const isTransitioningRef = useRef(false);
  const targetRef = useRef(null);
  const tlRef = useRef(null);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const trySet = () => {
      const g = crabRef.current;
      if (!g) return false;
      if (location === "/about") setCrabAtAbout(g, BASE_ROTATION_Y);
      else if (location === "/works") setCrabAtHome(g, BASE_ROTATION_Y);
      else setCrabAtHome(g, BASE_ROTATION_Y);
      return true;
    };
    if (!trySet()) {
      const id = setInterval(() => { if (trySet()) clearInterval(id); }, 50);
      return () => clearInterval(id);
    }
  }, []); // eslint-disable-line

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    firstMountEntrance(container, displayed);
    if (displayed === "/works") {
      document.body.classList.add("works-ready");
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const from = displayed;
    const to = location;
    if (from === to) return;

    if (isTransitioningRef.current) {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      const snapTo = targetRef.current?.to ?? from;
      setDisplayed(snapTo);
      isTransitioningRef.current = false;
      setRenderIncoming(false);
      setIncomingRoute(null);
      targetRef.current = null;
      return;
    }

    isTransitioningRef.current = true;
    const profile = resolveProfile(from, to);
    targetRef.current = { from, to, profile };
    setIncomingRoute(to);
    setRenderIncoming(true);

    const g = crabRef.current;
    document.body.classList.remove("works-ready");
    if (g) {
      if (to === "/about") animateCrabToAbout(g, BASE_ROTATION_Y);
      else if (to === "/") animateCrabToHome(g, BASE_ROTATION_Y);
    }
  }, [location, displayed, crabRef]);

  useLayoutEffect(() => {
    if (!renderIncoming || !targetRef.current) return;

    const { from, to, profile } = targetRef.current;
    const container = containerRef.current;
    if (!container) return;

    const outgoing = container.querySelector(".page--outgoing");
    const incoming = container.querySelector(".page--incoming");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setDisplayed(to);
          isTransitioningRef.current = false;
          setRenderIncoming(false);
          setIncomingRoute(null);
          targetRef.current = null;
          tlRef.current = null;
          if (to === "/works") document.body.classList.add("works-ready");
        },
      });
      tlRef.current = tl;

      if (outgoing) {
        tl.to(outgoing, {
          opacity: profile.outgoing.opacity ?? 0,
          scale: profile.outgoing.scale ?? 1,
          y: profile.outgoing.y ?? 0,
          duration: profile.outgoing.duration,
          ease: profile.outgoing.ease,
        }, 0);

        if (from === "/") {
          tl.to(outgoing.querySelectorAll(".ui-headline-top, .ui-headline-bottom"), { yPercent: -110, duration: 0.6, ease: "power2.in", stagger: 0.05 }, 0);
          tl.to(outgoing.querySelector(".home-intro"), { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, 0);
        }

        if (from === "/about") {
          tl.to(outgoing.querySelector(".about-title"), { yPercent: -110, duration: 0.5, ease: "power2.in" }, 0);
          tl.to(outgoing.querySelectorAll(".about-reveal-p1, .about-reveal-p2, .about-reveal-resume a"), { opacity: 0, y: -20, duration: 0.5, ease: "power2.in", stagger: 0.03 }, 0);
        }

        if (from === "/works") {
          tl.to(outgoing.querySelector(".works-title"), { yPercent: -110, duration: 0.4, ease: "power2.in" }, 0);
          tl.to(outgoing.querySelectorAll(".works-project"), { opacity: 0, y: 60, duration: 0.4, ease: "power2.in", stagger: { each: 0.06, from: "start" } }, 0.05);
        }
      }

      if (incoming) {
        gsap.set(incoming, {
          opacity: profile.incoming.from.opacity ?? 0,
          y: profile.incoming.from.y ?? 0,
          scale: profile.incoming.from.scale ?? 1,
          position: "fixed",
          inset: 0,
          zIndex: profile.incomingZIndex ?? 20,
        });

        tl.to(incoming, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: profile.incoming.duration,
          ease: profile.incoming.ease,
        }, 0.1);

        if (to === "/") {
          gsap.set(incoming.querySelectorAll(".ui-headline-top, .ui-headline-bottom"), { yPercent: 110 });
          gsap.set(incoming.querySelector(".home-intro"), { opacity: 0, y: 20 });
          tl.to(incoming.querySelector(".ui-headline-top"), { yPercent: 0, duration: 1, ease: "power2.inOut" }, 0.3);
          tl.to(incoming.querySelector(".ui-headline-bottom"), { yPercent: 0, duration: 1, ease: "power2.inOut" }, 0.6);
          tl.to(incoming.querySelector(".home-intro"), { opacity: 1, y: 0, duration: 1, ease: "power2.inOut" }, 1);
        }

        if (to === "/about") {
          gsap.set(incoming.querySelector(".about-title"), { yPercent: 110 });
          gsap.set(incoming.querySelectorAll(".about-reveal-p1, .about-reveal-p2, .about-reveal-resume a"), { opacity: 0, y: 30 });
          tl.to(incoming.querySelector(".about-title"), { yPercent: 0, duration: 0.6, ease: "power2.inOut" }, 0.2);
          tl.to(incoming.querySelector(".about-reveal-p1"), { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" }, 0.35);
          tl.to(incoming.querySelector(".about-reveal-p2"), { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" }, 0.45);
          tl.to(incoming.querySelector(".about-reveal-resume a"), { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" }, 0.55);
        }

        if (to === "/works") {
          gsap.set(incoming.querySelector(".works-title"), { yPercent: 110 });
          gsap.set(incoming.querySelectorAll(".works-project"), { opacity: 0, y: 40 });
          tl.to(incoming.querySelector(".works-title"), { yPercent: 0, duration: 0.8, ease: "power2.inOut" }, 0.3);
          tl.to(incoming.querySelectorAll(".works-project"), { opacity: 1, y: 0, duration: 0.6, ease: "power2.inOut", stagger: { each: 0.08, from: "start" } }, 0.5);
        }
      }
    }, container);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [renderIncoming]);

  return (
    <div ref={containerRef} className="shell">
      <div className="page page--outgoing">
        {displayed === "/" && children("/")}
        {displayed === "/about" && children("/about")}
        {displayed === "/works" && children("/works")}
      </div>

      {renderIncoming && (
        <div className="page page--incoming">
          {incomingRoute === "/" && children("/")}
          {incomingRoute === "/about" && children("/about")}
          {incomingRoute === "/works" && children("/works")}
        </div>
      )}
    </div>
  );
}
