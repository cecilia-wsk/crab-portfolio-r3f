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
    outgoing: {
      opacity: 0,
      scale: 0.96,
      y: -20,
      duration: 0.8,
    },
    incoming: {
      from: { opacity: 0, y: 60 },
      duration: 0.7,
      ease: "power2.out",
    },
    crab: "toAbout",
  },
  "/about→/": {
    outgoing: {
      opacity: 0,
      scale: 0.94,
      y: -20,
      duration: 0.6,
      ease: "power2.in",
    },
    incoming: {
      from: { opacity: 0, y: -30 },
      duration: 0.6,
      ease: "power2.out",
    },
    crab: "toHome",
  },
  default: {
    outgoing: { opacity: 0, duration: 0.4, ease: "power2.in" },
    incoming: { from: { opacity: 0 }, duration: 0.5, ease: "power2.out" },
    crab: null,
  },
};

export default function Shell({ crabRef, children }) {
  const [location] = useLocation();
  const [displayed, setDisplayed] = useState(location);
  const [renderIncoming, setRenderIncoming] = useState(false);
  const isTransitioningRef = useRef(false);
  const targetRef = useRef(null);
  const containerRef = useRef(null);

  // On first mount: snap crab to match current route (retry until R3F ref exists)
  useLayoutEffect(() => {
    const trySet = () => {
      const g = crabRef.current;
      if (!g) return false;
      if (location === "/about") setCrabAtAbout(g, BASE_ROTATION_Y);
      else setCrabAtHome(g, BASE_ROTATION_Y);
      return true;
    };

    if (!trySet()) {
      const id = setInterval(() => {
        if (trySet()) clearInterval(id);
      }, 50);
      return () => clearInterval(id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // First-mount entrance animation (no transition — direct page load)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const page = container.querySelector(".page--outgoing");
    if (!page) return;

    if (displayed === "/") {
      gsap.fromTo(
        page.querySelector(".home-headline-top"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1, delay: 0.3 },
      );
      gsap.fromTo(
        page.querySelector(".home-headline-bottom"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1, delay: 0.6 },
      );
      gsap.fromTo(
        page.querySelector(".home-intro"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1.0 },
      );
    } else if (displayed === "/about") {
      gsap.fromTo(
        page.querySelector(".about-title"),
        { yPercent: 110 },
        { yPercent: 0, duration: 0.6, delay: 0.2 },
      );
      gsap.fromTo(
        page.querySelectorAll(
          ".about-reveal-p1, .about-reveal-p2, .about-reveal-resume a",
        ),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.35,
        },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect route change, start crab animation, flag incoming render
  useEffect(() => {
    const from = displayed; // the currently visible page
    const to = location;
    if (from === to || isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    const key = `${from}→${to}`;
    const profile = PROFILES[key] || PROFILES.default;
    targetRef.current = { from, to, profile };
    setRenderIncoming(true);

    const g = crabRef.current;
    if (g) {
      if (profile.crab === "toAbout") animateCrabToAbout(g, BASE_ROTATION_Y);
      if (profile.crab === "toHome") animateCrabToHome(g, BASE_ROTATION_Y);
    }
  }, [location, displayed, crabRef]);

  // After React commits the incoming page to DOM, set up GSAP
  useLayoutEffect(() => {
    if (!renderIncoming || !targetRef.current) return;

    const { from, to } = targetRef.current;
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
          targetRef.current = null;
        },
      });

      const profile = targetRef.current?.profile || PROFILES.default;

      // ─── OUTGOING page wrapper + elements ───
      if (outgoing) {
        tl.to(
          outgoing,
          {
            opacity: profile.outgoing.opacity ?? 0,
            scale: profile.outgoing.scale ?? 1,
            y: profile.outgoing.y ?? 0,
            duration: profile.outgoing.duration,
            ease: profile.outgoing.ease,
          },
          0,
        );

        // Home-specific exit
        if (from === "/") {
          tl.to(
            outgoing.querySelectorAll(
              ".home-headline-top, .home-headline-bottom",
            ),
            { yPercent: -110, duration: 0.6, ease: "power2.in", stagger: 0.05 },
            0,
          );
          tl.to(
            outgoing.querySelector(".home-intro"),
            { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" },
            0,
          );
        }

        // About-specific exit
        if (from === "/about") {
          tl.to(
            outgoing.querySelector(".about-title"),
            { yPercent: -110, duration: 0.5, ease: "power2.in" },
            0,
          );
          tl.to(
            outgoing.querySelectorAll(
              ".about-reveal-p1, .about-reveal-p2, .about-reveal-resume a",
            ),
            {
              opacity: 0,
              y: -20,
              duration: 0.5,
              ease: "power2.in",
              stagger: 0.03,
            },
            0,
          );
        }
      }

      // ─── INCOMING page wrapper + elements ───
      if (incoming) {
        gsap.set(incoming, {
          opacity: profile.incoming.from.opacity ?? 0,
          y: profile.incoming.from.y ?? 0,
          position: "fixed",
          inset: 0,
          zIndex: 20,
        });

        // Wrapper fade in
        tl.to(
          incoming,
          {
            opacity: 1,
            y: 0,
            duration: profile.incoming.duration,
            ease: profile.incoming.ease,
          },
          0.1,
        );

        // Home-specific entrance
        if (to === "/") {
          gsap.set(
            incoming.querySelectorAll(
              ".home-headline-top, .home-headline-bottom",
            ),
            {
              yPercent: 110,
            },
          );
          gsap.set(incoming.querySelector(".home-intro"), {
            opacity: 0,
            y: 20,
          });

          tl.to(
            incoming.querySelector(".home-headline-top"),
            { yPercent: 0, duration: 1, ease: "power2.inOut" },
            0.3,
          );
          tl.to(
            incoming.querySelector(".home-headline-bottom"),
            { yPercent: 0, duration: 1, ease: "power2.inOut" },
            0.6,
          );
          tl.to(
            incoming.querySelector(".home-intro"),
            { opacity: 1, y: 0, duration: 1, ease: "power2.inOut" },
            1.0,
          );
        }

        // About-specific entrance
        if (to === "/about") {
          gsap.set(incoming.querySelector(".about-title"), { yPercent: 110 });
          gsap.set(
            incoming.querySelectorAll(
              ".about-reveal-p1, .about-reveal-p2, .about-reveal-resume a",
            ),
            { opacity: 0, y: 30 },
          );

          tl.to(
            incoming.querySelector(".about-title"),
            { yPercent: 0, duration: 0.6, ease: "power2.inOut" },
            0.2,
          );
          tl.to(
            incoming.querySelector(".about-reveal-p1"),
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" },
            0.35,
          );
          tl.to(
            incoming.querySelector(".about-reveal-p2"),
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" },
            0.45,
          );
          tl.to(
            incoming.querySelector(".about-reveal-resume a"),
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.inOut" },
            0.55,
          );
        }
      }
    }, container);

    return () => ctx.revert();
  }, [renderIncoming]);

  return (
    <div ref={containerRef} className="shell">
      {/* outgoing page */}
      <div className="page page--outgoing">
        {displayed === "/" && children("/")}
        {displayed === "/about" && children("/about")}
      </div>

      {/* incoming page — rendered only during transition */}
      {renderIncoming && (
        <div className="page page--incoming">
          {location === "/" && children("/")}
          {location === "/about" && children("/about")}
        </div>
      )}
    </div>
  );
}
