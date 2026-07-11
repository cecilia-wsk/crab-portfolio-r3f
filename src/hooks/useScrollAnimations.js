import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BASE_ROTATION_Y } from "../components/CrabParticles";

gsap.registerPlugin(ScrollTrigger);

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

export default function useScrollAnimations(heroRef, crabRef) {
  const pinTlRef = useRef(null);
  const entranceDoneRef = useRef(false);

  // ── Entrance animation (runs immediately on mount) ──
  useEffect(() => {
    const entranceCtx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          entranceDoneRef.current = true;
          if (pinTlRef.current) {
            addHeadlineExitTweens(pinTlRef.current);
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

  // ── Scroll-driven exit + crab + about ──
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
        // 1) Hero pin — just for headline exit
        const pinTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=50%",
            pin: true,
            scrub: 0.5,
          },
        });

        pinTlRef.current = pinTl;
        if (entranceDoneRef.current) {
          addHeadlineExitTweens(pinTl);
        }

        // 2) Crab movement — longer, no pin
        const crabTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=100%",
            pin: false,
            scrub: 0.5,
            onUpdate: (st) => {
              crabGroup.userData.isAnimating = st.progress > 0;
            },
          },
        });

        crabTl.to(
          crabGroup.position,
          { x: 3, y: 0, z: 0, duration: 1, ease: "power2.easeIn" },
          0,
        );
        crabTl.to(
          crabGroup.scale,
          { x: 0.9, y: 0.9, z: 0.9, duration: 1, ease: "power2.easeIn" },
          0,
        );
        crabTl.to(
          crabGroup.rotation,
          {
            y: BASE_ROTATION_Y + Math.PI * 0.8,
            duration: 1,
            ease: "power2.easeIn",
          },
          0,
        );

        // 3) About section reveal — pinned with entrance + exit
        const aboutSection = document.querySelector(".section.about");
        if (aboutSection) {
          const aboutTitle = aboutSection.querySelector(".about-title");
          const aboutPara1 = aboutSection.querySelector(".about-reveal-p1");
          const aboutPara2 = aboutSection.querySelector(".about-reveal-p2");
          const aboutResume = aboutSection.querySelector(
            ".about-reveal-resume a",
          );

          // set initial hidden states
          gsap.set(aboutTitle, { yPercent: 110 });
          gsap.set(aboutPara1, { opacity: 0, y: 30 });
          gsap.set(aboutPara2, { opacity: 0, y: 30 });
          gsap.set(aboutResume, { opacity: 0, y: 30 });

          const aboutTl = gsap.timeline({
            scrollTrigger: {
              id: "about-pin",
              trigger: aboutSection,
              start: "top 0%",
              end: "+=80%",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
            },
          });

          // ── ENTRANCE ──
          aboutTl.fromTo(
            aboutTitle,
            { yPercent: 110 },
            { yPercent: 0, duration: 0.25, ease: "power4.out" },
            0,
          );

          aboutTl.fromTo(
            aboutPara1,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
            0.15,
          );

          aboutTl.fromTo(
            aboutPara2,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
            0.25,
          );

          aboutTl.fromTo(
            aboutResume,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
            0.35,
          );

          // ── EXIT (reverse order, matching entrance style) ──
          aboutTl.to(
            aboutResume,
            { opacity: 0, y: -20, duration: 0.15, ease: "power2.in" },
            0.6,
          );

          aboutTl.to(
            aboutPara2,
            { opacity: 0, y: -20, duration: 0.15, ease: "power2.in" },
            0.66,
          );

          aboutTl.to(
            aboutPara1,
            { opacity: 0, y: -20, duration: 0.15, ease: "power2.in" },
            0.72,
          );

          aboutTl.to(
            aboutTitle,
            { yPercent: -110, duration: 0.2, ease: "power2.in" },
            0.78,
          );
        }
      }, hero);
    };

    setup();
    interval = setInterval(setup, 50);

    return () => {
      clearInterval(interval);
      if (ctx) ctx.revert();
    };
  }, [heroRef, crabRef]);
}
